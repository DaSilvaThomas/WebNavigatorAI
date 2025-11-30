const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('PRELOAD: Démarrage');

function getUserDataPath() {
  const os = require('os');
  const appName = 'web-navigator-ai';
  
  if (process.platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Roaming', appName);
  } else if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', appName);
  } else {
    return path.join(os.homedir(), '.config', appName);
  }
}

const userDataPath = getUserDataPath();

const CONFIG = {
  DATA_DIR: path.join(userDataPath, 'data'),
  HISTORY_FILE: path.join(userDataPath, 'data', 'history.json'),
  BOOKMARKS_FILE: path.join(userDataPath, 'data', 'bookmarks.json'),
  AI_API_URL: 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
  AI_API_KEY: '',
  SEARCH_ENGINE: 'https://www.google.com/search?q=',
  DEFAULT_URL: 'https://www.google.com',
  MAX_HISTORY_ITEMS: 1000,
  REQUEST_TIMEOUT: 15000
};

console.log('PRELOAD: Config OK');

contextBridge.exposeInMainWorld('electronAPI', {
  createTab: (tabId, url) => ipcRenderer.invoke('create-tab', tabId, url),
  switchTab: (tabId) => ipcRenderer.invoke('switch-tab', tabId),
  closeTab: (tabId) => ipcRenderer.invoke('close-tab', tabId),
  navigateTab: (tabId, url) => ipcRenderer.invoke('navigate-tab', tabId, url),
  tabBack: (tabId) => ipcRenderer.invoke('tab-back', tabId),
  tabForward: (tabId) => ipcRenderer.invoke('tab-forward', tabId),
  tabRefresh: (tabId) => ipcRenderer.invoke('tab-refresh', tabId),
  tabStop: (tabId) => ipcRenderer.invoke('tab-stop', tabId),
  tabZoom: (tabId, level) => ipcRenderer.invoke('tab-zoom', tabId, level),
  getSelectedText: (tabId) => ipcRenderer.invoke('get-selected-text', tabId),
  
  onTabLoading: (callback) => ipcRenderer.on('tab-loading', (e, tabId, loading) => callback(tabId, loading)),
  onTabUrl: (callback) => ipcRenderer.on('tab-url', (e, tabId, url) => callback(tabId, url)),
  onTabTitle: (callback) => ipcRenderer.on('tab-title', (e, tabId, title) => callback(tabId, title)),
  
  getHistory: () => {
    try {
      const data = fs.readFileSync(CONFIG.HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return [];
    }
  },
  
  addHistory: (entry) => {
    try {
      let history = JSON.parse(fs.readFileSync(CONFIG.HISTORY_FILE, 'utf8'));
      history.unshift({
        url: entry.url,
        title: entry.title,
        timestamp: Date.now()
      });
      
      if (history.length > CONFIG.MAX_HISTORY_ITEMS) {
        history = history.slice(0, CONFIG.MAX_HISTORY_ITEMS);
      }
      
      fs.writeFileSync(CONFIG.HISTORY_FILE, JSON.stringify(history, null, 2));
      return true;
    } catch (err) {
      console.error('Erreur historique:', err);
      return false;
    }
  },
  
  clearHistory: () => {
    try {
      fs.writeFileSync(CONFIG.HISTORY_FILE, JSON.stringify([], null, 2));
      return true;
    } catch (err) {
      return false;
    }
  },
  
  getBookmarks: () => {
    try {
      const data = fs.readFileSync(CONFIG.BOOKMARKS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return [];
    }
  },
  
  addBookmark: (bookmark) => {
    try {
      const bookmarks = JSON.parse(fs.readFileSync(CONFIG.BOOKMARKS_FILE, 'utf8'));
      
      const exists = bookmarks.find(b => b.url === bookmark.url);
      if (exists) return false;
      
      bookmarks.push({
        url: bookmark.url,
        title: bookmark.title,
        timestamp: Date.now()
      });
      
      fs.writeFileSync(CONFIG.BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
      return true;
    } catch (err) {
      console.error('Erreur bookmark:', err);
      return false;
    }
  },
  
  removeBookmark: (url) => {
    try {
      let bookmarks = JSON.parse(fs.readFileSync(CONFIG.BOOKMARKS_FILE, 'utf8'));
      bookmarks = bookmarks.filter(b => b.url !== url);
      fs.writeFileSync(CONFIG.BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
      return true;
    } catch (err) {
      return false;
    }
  },
  
  summarizeText: async (text) => {
    try {
      if (!text || text.trim().length < 50) {
        return { success: false, error: 'Texte trop court (min 50 caractères)' };
      }
      
      const cleanText = text.trim().substring(0, 1024);
      
      const response = await axios.post(
        CONFIG.AI_API_URL,
        { inputs: cleanText, parameters: { max_length: 130, min_length: 30 } },
        {
          headers: CONFIG.AI_API_KEY ? { 'Authorization': `Bearer ${CONFIG.AI_API_KEY}` } : {},
          timeout: CONFIG.REQUEST_TIMEOUT
        }
      );
      
      if (response.data && response.data[0] && response.data[0].summary_text) {
        return { success: true, summary: response.data[0].summary_text };
      }
      
      return { success: false, error: 'Réponse API invalide' };
    } catch (err) {
      console.error('Erreur résumé:', err.message);
      
      if (err.response && err.response.status === 503) {
        return { success: false, error: 'Modèle en cours de chargement, réessayez dans 20s' };
      }
      
      return { success: false, error: err.message || 'Erreur inconnue' };
    }
  },
  
  getConfig: () => ({
    searchEngine: CONFIG.SEARCH_ENGINE,
    defaultUrl: CONFIG.DEFAULT_URL
  })
});

console.log('PRELOAD: API exposée');