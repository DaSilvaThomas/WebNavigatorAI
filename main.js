const { app, BrowserWindow, BrowserView, ipcMain } = require('electron');
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
const tabs = new Map();
let activeTabId = null;

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
      webviewTag: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'main_window.html'));
  mainWindow.webContents.openDevTools();
  
  mainWindow.on('closed', () => {
    tabs.forEach(view => view.destroy());
    tabs.clear();
    mainWindow = null;
  });
}

ipcMain.handle('create-tab', (event, tabId, url) => {
  console.log('Création tab:', tabId, url);
  
  const view = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      javascript: true
    }
  });
  
  tabs.set(tabId, view);
  mainWindow.addBrowserView(view);
  
  const bounds = mainWindow.getContentBounds();
  view.setBounds({ x: 0, y: 120, width: bounds.width, height: bounds.height - 120 });
  view.setAutoResize({ width: true, height: true });
  
  const targetUrl = url || CONFIG.DEFAULT_URL;
  view.webContents.loadURL(targetUrl).catch(err => {
    console.error('Erreur chargement:', err);
  });
  
  view.webContents.on('did-start-loading', () => {
    event.sender.send('tab-loading', tabId, true);
  });
  
  view.webContents.on('did-stop-loading', () => {
    event.sender.send('tab-loading', tabId, false);
    event.sender.send('tab-title', tabId, view.webContents.getTitle());
  });
  
  view.webContents.on('did-navigate', (e, url) => {
    event.sender.send('tab-url', tabId, url);
  });
  
  view.webContents.on('did-navigate-in-page', (e, url) => {
    event.sender.send('tab-url', tabId, url);
  });
  
  view.webContents.on('page-title-updated', (e, title) => {
    event.sender.send('tab-title', tabId, title);
  });
  
  return { success: true, tabId };
});

ipcMain.handle('switch-tab', (event, tabId) => {
  console.log('Switch tab:', tabId);
  const view = tabs.get(tabId);
  if (!view) return { success: false };
  
  const bounds = mainWindow.getContentBounds();
  view.setBounds({ x: 0, y: 120, width: bounds.width, height: bounds.height - 120 });
  mainWindow.setTopBrowserView(view);
  activeTabId = tabId;
  return { success: true };
});

ipcMain.handle('close-tab', (event, tabId) => {
  const view = tabs.get(tabId);
  if (view) {
    mainWindow.removeBrowserView(view);
    view.destroy();
    tabs.delete(tabId);
  }
  return { success: true };
});

ipcMain.handle('navigate-tab', (event, tabId, url) => {
  console.log('Navigation:', tabId, url);
  const view = tabs.get(tabId);
  if (view) {
    view.webContents.loadURL(url).catch(err => {
      console.error('Erreur navigation:', err);
    });
  }
  return { success: true };
});

ipcMain.handle('tab-back', (event, tabId) => {
  const view = tabs.get(tabId);
  if (view && view.webContents.canGoBack()) {
    view.webContents.goBack();
  }
  return { success: true };
});

ipcMain.handle('tab-forward', (event, tabId) => {
  const view = tabs.get(tabId);
  if (view && view.webContents.canGoForward()) {
    view.webContents.goForward();
  }
  return { success: true };
});

ipcMain.handle('tab-refresh', (event, tabId) => {
  const view = tabs.get(tabId);
  if (view) {
    view.webContents.reload();
  }
  return { success: true };
});

ipcMain.handle('tab-stop', (event, tabId) => {
  const view = tabs.get(tabId);
  if (view) {
    view.webContents.stop();
  }
  return { success: true };
});

ipcMain.handle('tab-zoom', (event, tabId, level) => {
  console.log('Zoom:', tabId, level);
  const view = tabs.get(tabId);
  if (view) {
    view.webContents.setZoomLevel(level);
  }
  return { success: true };
});

ipcMain.handle('get-selected-text', async (event, tabId) => {
  const view = tabs.get(tabId);
  if (view) {
    const text = await view.webContents.executeJavaScript('window.getSelection().toString()');
    return text;
  }
  return '';
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