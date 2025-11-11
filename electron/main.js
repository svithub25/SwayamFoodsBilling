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

  // Add external link handling after window is created
  if (mainWindow) {
    // Prevent navigation away from the app and open external links in browser
    mainWindow.webContents.on('will-navigate', (event, url) => {
      const appUrl = isDev 
        ? 'http://localhost:5173' 
        : `file://${paths.dist}/index.html`;
      
      console.log('Navigation detected:', url);
      console.log('App URL:', appUrl);
      
      // If navigating to external URL, prevent it and open in browser
      if (!url.startsWith(appUrl) && !url.startsWith('devtools://')) {
        console.log('Opening external URL:', url);
        event.preventDefault();
        shell.openExternal(url);
      }
    });

    // Handle new window requests (target="_blank")
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      console.log('New window requested for:', url);
      // Open external links in default browser
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }
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

  // Add IPC handler for opening external URLs
  ipcMain.handle('open-external', async (event, url) => {
    try {
      console.log('IPC: Opening external URL:', url);
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('Error opening external URL:', error);
      return { success: false, error: error.message };
    }
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