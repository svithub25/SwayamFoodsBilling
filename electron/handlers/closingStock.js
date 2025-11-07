export function registerClosingStockHandlers({ ipcMain, getDb }) {
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


