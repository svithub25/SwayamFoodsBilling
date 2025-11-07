export function registerSupplierHandlers({ ipcMain, getDb }) {
  ipcMain.handle('get-suppliers', async () => {
    return getDb()
      .prepare('SELECT * FROM suppliers WHERE (status_code = 0 OR status_code IS NULL) ORDER BY name')
      .all();
  });

  ipcMain.handle('add-supplier', async (event, { name, contact, address, gstin }) => {
    const stmt = getDb().prepare('INSERT INTO suppliers (name, contact, address, gstin) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, contact, address, gstin);
    return { id: result.lastInsertRowid, name, contact, address, gstin };
  });

  ipcMain.handle('update-supplier', async (event, { id, name, contact, address, gstin }) => {
    const stmt = getDb().prepare('UPDATE suppliers SET name = ?, contact = ?, address = ?, gstin = ? WHERE id = ?');
    const result = stmt.run(name, contact, address, gstin, id);
    return result.changes > 0;
  });

  ipcMain.handle('delete-supplier', async (event, id) => {
    const stmt = getDb().prepare('UPDATE suppliers SET status_code = 1 WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  });
}


