export function registerOpeningStockHandlers({ ipcMain, getDb }) {
  
  // Get current financial year
  const getCurrentFinancialYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 0-indexed
    
    if (month >= 4) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  // Set or update opening stock for an item
  ipcMain.handle('set-opening-stock', async (event, { itemId, qty, rate, date }) => {
    const db = getDb();
    const financialYear = getCurrentFinancialYear();
    
    try {
      // Check if opening stock already exists and is locked
      const existing = db.prepare(`
        SELECT * FROM opening_stock 
        WHERE item_id = ? AND financial_year = ?
      `).get(itemId, financialYear);

      if (existing && existing.is_locked === 1) {
        throw new Error('Opening stock is locked and cannot be modified');
      }

      const amount = qty * rate;
      const openingDate = date || new Date().toISOString().split('T')[0];

      if (existing) {
        // Update existing opening stock
        db.prepare(`
          UPDATE opening_stock 
          SET opening_qty = ?, 
              opening_rate = ?, 
              opening_amount = ?,
              opening_date = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE item_id = ? AND financial_year = ?
        `).run(qty, rate, amount, openingDate, itemId, financialYear);
      } else {
        // Insert new opening stock
        db.prepare(`
          INSERT INTO opening_stock 
          (item_id, financial_year, opening_qty, opening_rate, opening_amount, opening_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(itemId, financialYear, qty, rate, amount, openingDate);
      }

      return { success: true };
    } catch (error) {
      console.error('Error setting opening stock:', error);
      throw error;
    }
  });

  // Get opening stock for an item
  ipcMain.handle('get-opening-stock', async (event, itemId) => {
    const db = getDb();
    const financialYear = getCurrentFinancialYear();
    
    const openingStock = db.prepare(`
      SELECT * FROM opening_stock 
      WHERE item_id = ? AND financial_year = ?
    `).get(itemId, financialYear);

    return openingStock || {
      opening_qty: 0,
      opening_rate: 0,
      opening_amount: 0,
      is_locked: 0
    };
  });

  // Get all opening stock
  ipcMain.handle('get-all-opening-stock', async () => {
    const db = getDb();
    const financialYear = getCurrentFinancialYear();
    
    const openingStocks = db.prepare(`
      SELECT 
        os.*,
        i.name as item_name,
        i.sku,
        i.current_stock
      FROM opening_stock os
      JOIN items i ON os.item_id = i.id
      WHERE os.financial_year = ?
      ORDER BY i.name
    `).all(financialYear);

    return openingStocks;
  });

  // Lock opening stock (prevent further modifications)
  ipcMain.handle('lock-opening-stock', async (event, itemId) => {
    const db = getDb();
    const financialYear = getCurrentFinancialYear();
    
    db.prepare(`
      UPDATE opening_stock 
      SET is_locked = 1, updated_at = CURRENT_TIMESTAMP
      WHERE item_id = ? AND financial_year = ?
    `).run(itemId, financialYear);

    return { success: true };
  });

  // Unlock opening stock (for admin corrections)
  ipcMain.handle('unlock-opening-stock', async (event, itemId) => {
    const db = getDb();
    const financialYear = getCurrentFinancialYear();
    
    db.prepare(`
      UPDATE opening_stock 
      SET is_locked = 0, updated_at = CURRENT_TIMESTAMP
      WHERE item_id = ? AND financial_year = ?
    `).run(itemId, financialYear);

    return { success: true };
  });

  // Bulk lock all opening stocks for the financial year
  ipcMain.handle('lock-all-opening-stocks', async () => {
    const db = getDb();
    const financialYear = getCurrentFinancialYear();
    
    db.prepare(`
      UPDATE opening_stock 
      SET is_locked = 1, updated_at = CURRENT_TIMESTAMP
      WHERE financial_year = ? AND is_locked = 0
    `).run(financialYear);

    return { success: true };
  });

  // Calculate opening stock from previous year's closing
  ipcMain.handle('calculate-opening-from-closing', async (event, { previousFinancialYear }) => {
    const db = getDb();
    const currentFinancialYear = getCurrentFinancialYear();
    
    try {
      db.prepare('BEGIN TRANSACTION').run();

      // Get all items with their current stock at end of previous FY
      const items = db.prepare(`
        SELECT 
          i.id,
          i.current_stock,
          i.purchase_rate
        FROM items i
        WHERE i.status_code = 0
      `).all();

      for (const item of items) {
        // Check if opening stock already exists
        const existing = db.prepare(`
          SELECT * FROM opening_stock 
          WHERE item_id = ? AND financial_year = ?
        `).get(item.id, currentFinancialYear);

        if (!existing) {
          const amount = item.current_stock * item.purchase_rate;
          
          db.prepare(`
            INSERT INTO opening_stock 
            (item_id, financial_year, opening_qty, opening_rate, opening_amount, opening_date)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            item.id,
            currentFinancialYear,
            item.current_stock,
            item.purchase_rate,
            amount,
            new Date().toISOString().split('T')[0]
          );
        }
      }

      db.prepare('COMMIT').run();
      return { success: true };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error calculating opening stock:', error);
      throw error;
    }
  });
}