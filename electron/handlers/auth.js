export function registerAuthHandlers({ ipcMain, getDb }) {
  ipcMain.handle('login', async (event, username, password) => {
    try {
      const user = getDb()
        .prepare('SELECT id, username FROM users WHERE username = ? AND password = ?')
        .get(username, password);
      return user || null;
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  ipcMain.handle('verify-pin', async (event, pin) => {
    try {
      return pin === '4040';
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  ipcMain.handle('verify-approve-pin', async (event, pin) => pin === '4040');
}


