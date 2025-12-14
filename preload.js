const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('PRELOAD: Démarrage');

/* =========================
   PATHS & CONFIG
========================= */

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
  AI_API_URL: 'https://api.apyhub.com/ai/summarize-text',
  AI_API_KEY: 'APY04yQjQCle4BiHGatNS8uMW3Oo2JEzWKxyTFWVpMdw3GmqEJa9qqO2LojQ0Oa4QYcTZH1BwGUi0A',
  SEARCH_ENGINE: 'https://www.google.com/search?q=',
  DEFAULT_URL: 'https://www.google.com',
  MAX_HISTORY_ITEMS: 1000,
  REQUEST_TIMEOUT: 30000
};

/* =========================
   ENSURE DATA FILES EXIST
========================= */

try {
  if (!fs.existsSync(CONFIG.DATA_DIR)) {
    fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFIG.HISTORY_FILE)) {
    fs.writeFileSync(CONFIG.HISTORY_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(CONFIG.BOOKMARKS_FILE)) {
    fs.writeFileSync(CONFIG.BOOKMARKS_FILE, JSON.stringify([], null, 2));
  }
} catch (err) {
  console.error('❌ Erreur initialisation fichiers:', err);
}

console.log('PRELOAD: Config OK');

/* =========================
   EXPOSE API
========================= */

contextBridge.exposeInMainWorld('electronAPI', {
  /* -------- IMPORTANT --------
     Chemin ABSOLU du preload
     pour les <webview>
  ---------------------------- */
  getWebviewPreloadPath: () => {
    return path.join(__dirname, 'preload.js');
  },

  /* -------- HISTORY -------- */

  getHistory: () => {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.HISTORY_FILE, 'utf8'));
    } catch {
      return [];
    }
  },

  addHistory: (entry) => {
    try {
      let history = [];

      if (fs.existsSync(CONFIG.HISTORY_FILE)) {
        history = JSON.parse(fs.readFileSync(CONFIG.HISTORY_FILE, 'utf8'));
      }

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
      console.error('❌ Erreur historique:', err);
      return false;
    }
  },

  clearHistory: () => {
    try {
      fs.writeFileSync(CONFIG.HISTORY_FILE, JSON.stringify([], null, 2));
      return true;
    } catch {
      return false;
    }
  },

  /* -------- BOOKMARKS -------- */

  getBookmarks: () => {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.BOOKMARKS_FILE, 'utf8'));
    } catch {
      return [];
    }
  },

  addBookmark: (bookmark) => {
    try {
      let bookmarks = [];

      if (fs.existsSync(CONFIG.BOOKMARKS_FILE)) {
        bookmarks = JSON.parse(fs.readFileSync(CONFIG.BOOKMARKS_FILE, 'utf8'));
      }

      if (bookmarks.find(b => b.url === bookmark.url)) {
        return false;
      }

      bookmarks.push({
        url: bookmark.url,
        title: bookmark.title,
        timestamp: Date.now()
      });

      fs.writeFileSync(CONFIG.BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
      return true;
    } catch (err) {
      console.error('❌ Erreur bookmark:', err);
      return false;
    }
  },

  removeBookmark: (url) => {
    try {
      const bookmarks = JSON.parse(fs.readFileSync(CONFIG.BOOKMARKS_FILE, 'utf8'))
        .filter(b => b.url !== url);

      fs.writeFileSync(CONFIG.BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
      return true;
    } catch {
      return false;
    }
  },

  /* -------- AI SUMMARY -------- */

  summarizeText: async (text) => {
    try {
      if (!text || text.trim().length < 50) {
        return { success: false, error: 'Texte trop court (min 50 caractères)' };
      }

      const response = await axios.post(
        CONFIG.AI_API_URL,
        {
          text: text.trim(),
          output_language: 'fr'
        },
        {
          headers: {
            'apy-token': CONFIG.AI_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: CONFIG.REQUEST_TIMEOUT
        }
      );

      if (response.data?.data?.summary) {
        return { success: true, summary: response.data.data.summary };
      }

      return { success: false, error: 'Réponse API invalide' };
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        return { success: false, error: 'Timeout API (30s)' };
      }
      return { success: false, error: err.message };
    }
  },

  /* -------- CONFIG -------- */

  getConfig: () => ({
    searchEngine: CONFIG.SEARCH_ENGINE,
    defaultUrl: CONFIG.DEFAULT_URL
  })
});

console.log('PRELOAD: API exposée');
