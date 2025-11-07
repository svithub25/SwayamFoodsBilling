export function registerBillMessageHandlers({ ipcMain, getDb }) {
  ipcMain.handle('get-bill-message', async () => {
    const row = getDb()
      .prepare('SELECT * FROM bill_message WHERE status_code = 0 ORDER BY updated_at DESC LIMIT 1')
      .get();
    return row?.message || '';
  });

  ipcMain.handle('set-bill-message', async (event, message) => {
    getDb().prepare('INSERT INTO bill_message (message) VALUES (?)').run(message);
    return true;
  });
}


