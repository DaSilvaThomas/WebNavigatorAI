const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let CONFIG;

function initConfig() {
  CONFIG = {
    DATA_DIR: path.join(app.getPath('userData'), 'data'),
    HISTORY_FILE: path.join(app.getPath('userData'), 'data', 'history.json'),
    BOOKMARKS_FILE: path.join(app.getPath('userData'), 'data', 'bookmarks.json'),
    DEFAULT_URL: 'https://www.google.com'
  };
}

let mainWindow;

function ensureDataDirectory() {
  console.log('Création des répertoires...');
  if (!fs.existsSync(CONFIG.DATA_DIR)) {
    fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG.HISTORY_FILE)) {
    fs.writeFileSync(CONFIG.HISTORY_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(CONFIG.BOOKMARKS_FILE)) {
    fs.writeFileSync(CONFIG.BOOKMARKS_FILE, JSON.stringify([], null, 2));
  }
  console.log('Répertoires créés');
}

function createWindow() {
  console.log('Création fenêtre...');
  initConfig();
  ensureDataDirectory();
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    backgroundColor: '#f5f5f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true // CHANGEMENT CRUCIAL : activer webview
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'main_window.html'));
  
  // AJOUT: Configurer la CSP pour autoriser les appels à l'API Apyhub
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
          "connect-src 'self' https://api.apyhub.com https://*.google.com; " +
          "img-src 'self' data: https:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline';"
        ]
      }
    });
  });
  
  // mainWindow.webContents.openDevTools();
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Les handlers IPC sont maintenant simplifiés car la gestion des webviews
// se fait directement dans le renderer process
ipcMain.handle('get-default-url', () => {
  return CONFIG.DEFAULT_URL;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});