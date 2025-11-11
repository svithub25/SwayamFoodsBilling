export function registerClosingStockHandlers({ ipcMain, getDb }) {
  ipcMain.handle('calculate-closing-stock', async (event, { itemId, asOfDate }) => {
    const db = getDb();

    // Get opening stock
    const financialYear = getFinancialYear(new Date(asOfDate));
    const opening = db.prepare(`
      SELECT opening_qty, opening_rate 
      FROM opening_stock 
      WHERE item_id = ? AND financial_year = ?
    `).get(itemId, financialYear) || { opening_qty: 0, opening_rate: 0 };

    // Get all purchases up to date
    const purchases = db.prepare(`
      SELECT quantity, unit_price
      FROM purchase_items pi
      JOIN purchases p ON pi.purchase_id = p.id
      WHERE pi.item_id = ?
      AND p.purchase_date <= ?
      AND (pi.status_code = 0 OR pi.status_code IS NULL)
      ORDER BY p.purchase_date ASC
    `).all(itemId, asOfDate);

    // Get all sales up to date
    const sales = db.prepare(`
      SELECT quantity
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE si.item_id = ?
      AND s.sale_date <= ?
      AND (si.status_code = 0 OR si.status_code IS NULL)
    `).all(itemId, asOfDate);

    // Calculate FIFO closing stock
    let totalQty = opening.opening_qty;
    const layers = [{ qty: opening.opening_qty, rate: opening.opening_rate }];

    // Add purchases
    purchases.forEach(p => {
      totalQty += p.quantity;
      layers.push({ qty: p.quantity, rate: p.unit_price });
    });

    // Remove sales (FIFO)
    let remainingSales = sales.reduce((sum, s) => sum + s.quantity, 0);
    const closingLayers = [];

    for (const layer of layers) {
      if (remainingSales >= layer.qty) {
        remainingSales -= layer.qty;
      } else if (remainingSales > 0) {
        closingLayers.push({
          qty: layer.qty - remainingSales,
          rate: layer.rate
        });
        remainingSales = 0;
      } else {
        closingLayers.push(layer);
      }
    }

    const closingQty = closingLayers.reduce((sum, l) => sum + l.qty, 0);
    const closingValue = closingLayers.reduce((sum, l) => sum + (l.qty * l.rate), 0);
    const avgRate = closingQty > 0 ? closingValue / closingQty : 0;

    return {
      closingQty,
      closingValue,
      avgRate,
      layers: closingLayers
    };
  });

  ipcMain.handle('update-closing-stock', async (event, { itemId, qty, purchaseRate }) => {
    const closingDate = new Date().toISOString().slice(0, 10);
    const closingAmount = qty * purchaseRate;
    const existing = getDb()
      .prepare('SELECT id FROM closing_stock WHERE item_id = ? AND closing_date = ?')
      .get(itemId, closingDate);

    if (existing) {
      getDb()
        .prepare('UPDATE closing_stock SET closing_qty = ?, purchase_rate = ?, closing_amount = ? WHERE id = ?')
        .run(qty, purchaseRate, closingAmount, existing.id);
    } else {
      getDb().prepare(
        'INSERT INTO closing_stock (item_id, closing_date, closing_qty, purchase_rate, closing_amount) VALUES (?, ?, ?, ?, ?)'
      ).run(itemId, closingDate, qty, purchaseRate, closingAmount);
    }

    return true;
  });

  ipcMain.handle('get-closing-stock', async (event, itemId) => {
    return getDb()
      .prepare('SELECT * FROM closing_stock WHERE item_id = ? ORDER BY closing_date DESC LIMIT 1')
      .get(itemId);
  });
}

export function createClosingStockReducer(getDb) {
  return function reduceClosingStock(itemId, qtySold) {
    const closing = getDb()
      .prepare('SELECT * FROM closing_stock WHERE item_id = ? ORDER BY closing_date DESC LIMIT 1')
      .get(itemId);

    if (closing) {
      let newQty = closing.closing_qty - qtySold;
      if (newQty < 0) newQty = 0;
      const newAmount = newQty * closing.purchase_rate;
      getDb()
        .prepare('UPDATE closing_stock SET closing_qty = ?, closing_amount = ? WHERE id = ?')
        .run(newQty, newAmount, closing.id);
    }
  };
}

function getFinancialYear(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (month >= 3) { // April onwards
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}


