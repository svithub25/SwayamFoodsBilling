import { execSync } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { createEnvironment } from './config/environment.js';
import { initDatabase } from './database/index.js';
import { createMainWindow } from './windows/mainWindow.js';
import { createBackupManager } from './handlers/backup.js';
import { createLicenseManager } from './handlers/license.js';
import { registerAllHandlers } from './handlers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const environment = createEnvironment(__dirname);
const { isDev, paths } = environment;

let machineId = null;
try {
  machineId = execSync(paths.machineIdExecutable).toString().trim();
  console.log('Current Machine ID:', machineId);
} catch (err) {
  console.error('Failed to get machine ID:', err);
}

let mainWindow = null;
let db = initDatabase(paths.db);

const getDb = () => db;
const setDb = (nextDb) => {
  db = nextDb;
};

const backupManager = createBackupManager({
  ipcMain,
  dialog,
  getMainWindow: () => mainWindow,
  isDev,
  paths,
  getDb,
  setDb
});

const licenseManager = createLicenseManager({
  ipcMain,
  getDb,
  machineId
});

const bootstrapWindow = () => {
  mainWindow = createMainWindow({
    startUrl: environment.getStartUrl(),
    preloadPath: paths.preload,
    iconPath: paths.icon,
    isDev,
    baseDir: __dirname
  });
};

const bootstrapHandlers = () => {
  registerAllHandlers({
    ipcMain,
    getDb,
    dialog,
    shell,
    mainWindow,
    isDev,
    paths,
    app,
    machineId,
    backupManager,
    licenseManager
  });
};

app.whenReady().then(() => {
  bootstrapWindow();
  bootstrapHandlers();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    bootstrapWindow();
  }
});

app.on('before-quit', async (event) => {
  event.preventDefault();

  try {
    await backupManager.autoBackupDatabase();
    const currentDb = getDb();
    if (currentDb && currentDb.open !== false) {
      currentDb.close();
    }
  } catch (error) {
    console.error('Backup error during quit:', error.message);
  } finally {
    app.exit(0);
  }
});