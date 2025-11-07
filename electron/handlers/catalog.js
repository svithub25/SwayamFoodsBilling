export function registerCatalogHandlers({ ipcMain, getDb }) {
  ipcMain.handle('get-categories', async () => {
    return getDb()
      .prepare('SELECT * FROM categories WHERE (status_code = 0 OR status_code IS NULL) ORDER BY name')
      .all();
  });

  ipcMain.handle('add-category', async (event, category) => {
    const stmt = getDb().prepare('INSERT INTO categories (name) VALUES (?)');
    const result = stmt.run(category.name);
    return { id: result.lastInsertRowid, name: category.name };
  });

  ipcMain.handle('delete-category', async (event, id) => {
    const stmt = getDb().prepare('UPDATE categories SET status_code = 1 WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  });

  ipcMain.handle('check-category-exists', async (event, name, excludeId = null) => {
    try {
      let query = 'SELECT id FROM categories WHERE name = ? AND (status_code = 0 OR status_code IS NULL)';
      const params = [name];
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      const row = getDb().prepare(query).get(...params);
      return !!row;
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  ipcMain.handle('get-units', async () => {
    return getDb()
      .prepare('SELECT * FROM units WHERE (status_code = 0 OR status_code IS NULL) ORDER BY name')
      .all();
  });

  ipcMain.handle('add-unit', async (event, { name }) => {
    const stmt = getDb().prepare('INSERT INTO units (name) VALUES (?)');
    const result = stmt.run(name);
    return { id: result.lastInsertRowid, name };
  });

  ipcMain.handle('delete-unit', async (event, id) => {
    const stmt = getDb().prepare('UPDATE units SET status_code = 1 WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  });

  ipcMain.handle('get-gst-rates', async () => {
    return getDb()
      .prepare('SELECT * FROM gst_rates WHERE (status_code = 0 OR status_code IS NULL) ORDER BY rate')
      .all();
  });

  ipcMain.handle('add-gst-rate', async (event, { rate, description }) => {
    const stmt = getDb().prepare('INSERT INTO gst_rates (rate, description) VALUES (?, ?)');
    const result = stmt.run(rate, description);
    return { id: result.lastInsertRowid, rate, description };
  });

  ipcMain.handle('delete-gst-rate', async (event, id) => {
    const stmt = getDb().prepare('UPDATE gst_rates SET status_code = 1 WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  });

  ipcMain.handle('check-gst-exists', async (event, rate, excludeId = null) => {
    try {
      let query = 'SELECT id FROM gst_rates WHERE rate = ? AND (status_code = 0 OR status_code IS NULL)';
      const params = [rate];
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      const row = getDb().prepare(query).get(...params);
      return !!row;
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
}


