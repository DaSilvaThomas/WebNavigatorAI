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
  AI_API_URL: 'https://api.apyhub.com/ai/summarize-text',
  AI_API_KEY: 'APY04yQjQCle4BiHGatNS8uMW3Oo2JEzWKxyTFWVpMdw3GmqEJa9qqO2LojQ0Oa4QYcTZH1BwGUi0A',
  SEARCH_ENGINE: 'https://www.google.com/search?q=',
  DEFAULT_URL: 'https://www.google.com',
  MAX_HISTORY_ITEMS: 1000,
  REQUEST_TIMEOUT: 30000
};

console.log('PRELOAD: Config OK');

contextBridge.exposeInMainWorld('electronAPI', {
  // NOTE: Les méthodes IPC pour les tabs ne sont plus nécessaires
  // car les webviews sont gérés directement dans le renderer
  
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
      console.log('📝 Ajout historique:', entry);
      console.log('📂 Chemin:', CONFIG.HISTORY_FILE);
      
      let history = [];
      
      // Lire le fichier existant
      if (fs.existsSync(CONFIG.HISTORY_FILE)) {
        const data = fs.readFileSync(CONFIG.HISTORY_FILE, 'utf8');
        history = JSON.parse(data);
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
      console.log('✅ Historique sauvegardé:', history.length, 'entrées');
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
      console.log('⭐ Ajout favori:', bookmark);
      console.log('📂 Chemin:', CONFIG.BOOKMARKS_FILE);
      
      let bookmarks = [];
      
      // Lire le fichier existant
      if (fs.existsSync(CONFIG.BOOKMARKS_FILE)) {
        const data = fs.readFileSync(CONFIG.BOOKMARKS_FILE, 'utf8');
        bookmarks = JSON.parse(data);
      }
      
      const exists = bookmarks.find(b => b.url === bookmark.url);
      if (exists) {
        console.log('⚠️ Favori déjà existant');
        return false;
      }
      
      bookmarks.push({
        url: bookmark.url,
        title: bookmark.title,
        timestamp: Date.now()
      });
      
      fs.writeFileSync(CONFIG.BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
      console.log('✅ Favori sauvegardé:', bookmarks.length, 'entrées');
      return true;
    } catch (err) {
      console.error('❌ Erreur bookmark:', err);
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
      
      console.log('🤖 Envoi à Apyhub AI...');
      
      // Préparer le payload selon le format Apyhub
      const payload = {
        text: text.trim(),
        output_language: 'fr'
      };
      
      // Effectuer la requête POST vers Apyhub
      const response = await axios.post(
        CONFIG.AI_API_URL,
        payload,
        {
          headers: {
            'apy-token': CONFIG.AI_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: CONFIG.REQUEST_TIMEOUT
        }
      );
      
      console.log('📥 Réponse Apyhub:', response.data);
      
      // Extraire le résumé selon le format de réponse Apyhub
      if (response.data && response.data.data && response.data.data.summary) {
        return { 
          success: true, 
          summary: response.data.data.summary 
        };
      }
      
      // Si le format est différent, afficher la réponse complète pour debug
      console.error('Format de réponse inattendu:', response.data);
      return { 
        success: false, 
        error: 'Format de réponse inattendu de l\'API' 
      };
      
    } catch (err) {
      console.error('❌ Erreur résumé Apyhub:', err.message);
      
      // Gestion des erreurs spécifiques
      if (err.response) {
        console.error('Détails erreur:', err.response.status, err.response.data);
        return { 
          success: false, 
          error: `Erreur API (${err.response.status}): ${JSON.stringify(err.response.data)}` 
        };
      }
      
      if (err.code === 'ECONNABORTED') {
        return { 
          success: false, 
          error: 'Temps d\'attente dépassé (30s)' 
        };
      }
      
      return { 
        success: false, 
        error: err.message || 'Erreur inconnue' 
      };
    }
  },
  
  getConfig: () => ({
    searchEngine: CONFIG.SEARCH_ENGINE,
    defaultUrl: CONFIG.DEFAULT_URL
  })
});

console.log('PRELOAD: API exposée');