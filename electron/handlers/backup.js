import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

export function createBackupManager({
  ipcMain,
  dialog,
  getMainWindow,
  isDev,
  paths,
  getDb,
  setDb
}) {
  const resolveDbPath = () => (isDev ? paths.db : paths.db);

  const autoBackupDatabase = () => {
    const db = getDb();
    return new Promise((resolve, reject) => {
      try {
        if (!db || db.open === false) throw new Error('Database connection is not open');

        const dbPath = resolveDbPath();
        const backupDir = isDev ? path.join(path.dirname(dbPath), 'backups') : path.join(process.resourcesPath, 'backups');

        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        const backupFile = path.join(
          backupDir,
          `SVs_BizzSaathi_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`
        );

        db.backup(backupFile)
          .then(() => {
            db.prepare('UPDATE settings SET value = ? WHERE key = ?')
              .run(new Date().toISOString(), 'last_backup');

            const backups = fs
              .readdirSync(backupDir)
              .filter((file) => file.endsWith('.db'))
              .map((file) => ({
                name: file,
                time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
              }))
              .sort((a, b) => b.time - a.time);

            if (backups.length > 3) {
              backups.slice(3).forEach((backup) => {
                fs.unlinkSync(path.join(backupDir, backup.name));
              });
            }

            resolve();
          })
          .catch(reject);
      } catch (error) {
        console.error('Auto-backup failed:', error);
        reject(error);
      }
    });
  };

  ipcMain.handle('backup-database', async () => {
    const db = getDb();
    try {
      const result = await dialog.showSaveDialog(getMainWindow(), {
        title: 'Backup Database',
        defaultPath: `SVs_BizzSaathi_backup_${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'Database Files', extensions: ['db'] }]
      });

      if (!result.canceled) {
        db.backup(result.filePath);
        db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(new Date().toISOString(), 'last_backup');
        return { success: true, path: result.filePath };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('restore-database', async () => {
    try {
      const result = await dialog.showOpenDialog(getMainWindow(), {
        title: 'Restore Database',
        filters: [{ name: 'Database Files', extensions: ['db'] }],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const backupPath = result.filePaths[0];
        const dbPath = resolveDbPath();

        const currentDb = getDb();
        if (currentDb) currentDb.close();

        fs.copyFileSync(backupPath, dbPath);

        const newDb = new Database(dbPath);
        setDb(newDb);

        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-last-backup-date', async () => {
    const db = getDb();
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get('last_backup');
    return result ? result.value : null;
  });

  ipcMain.handle('get-database-size', async () => {
    try {
      const stats = fs.statSync(resolveDbPath());
      return stats.size;
    } catch (e) {
      return null;
    }
  });

  return {
    autoBackupDatabase
  };
}


