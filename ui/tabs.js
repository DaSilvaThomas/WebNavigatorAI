// Fonctions utilitaires
function updateSecurityIndicator(url) {
  const indicator = document.getElementById('security-indicator');
  if (!indicator || !url) return;

  try {
    const isSecure = new URL(url).protocol === 'https:';
    indicator.style.color = isSecure ? 'green' : 'red';
  } catch {
    indicator.style.color = 'grey';
  }
}

class TabManager {
  constructor() {
    console.log('TabManager init');
    
    if (!window.electronAPI) {
      console.error('electronAPI manquante !');
      return;
    }
    
    this.tabs = new Map();
    this.activeTabId = null;
    this.tabCounter = 0;
    this.tabsBar = document.getElementById('tabs-bar');
    this.newTabBtn = document.getElementById('btn-new-tab');
    this.contentArea = document.querySelector('.content-area');
    
    this.init();
  }
  
  init() {
    this.newTabBtn.addEventListener('click', () => {
      console.log('Nouveau tab');
      this.createTab();
    });
    
    this.createTab();
  }
  
  async createTab(url = null) {
    console.log('Création tab');
    this.tabCounter++;
    const tabId = `tab-${this.tabCounter}`;
    
    const config = window.electronAPI.getConfig();
    const targetUrl = url || config.defaultUrl;
    
    // Créer le webview element
    const webview = document.createElement('webview');
    webview.id = `webview-${tabId}`;
    webview.src = targetUrl;
    webview.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
    `;

    // Ajouter le preload absolu
    const preloadPath = window.electronAPI.getWebviewPreloadPath();
    webview.setAttribute('preload', preloadPath);
    
    // Ajouter les attributs de sécurité
    // webview.setAttribute('disablewebsecurity', 'false');
    
    const tabData = {
      id: tabId,
      url: targetUrl,
      title: 'Nouvel onglet',
      webview: webview
    };
    
    this.tabs.set(tabId, tabData);
    
    // Créer l'élément d'onglet dans la barre
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.id = `tab-${tabId}`;
    tabElement.innerHTML = `
      <svg class="tab-favicon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
      </svg>
      <span class="tab-title">${tabData.title}</span>
      <button class="tab-close">×</button>
    `;
    
    tabElement.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        this.switchTab(tabId);
      }
    });
    
    tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tabId);
    });
    
    this.tabsBar.insertBefore(tabElement, this.newTabBtn);
    this.contentArea.appendChild(webview);
    
    // FIX: Forcer l'iframe du shadow DOM à prendre toute la hauteur
    // Attendre que le webview soit complètement initialisé
    setTimeout(() => {
      try {
        const shadowRoot = webview.shadowRoot;
        if (shadowRoot) {
          // Injecter du style dans le shadow root
          let style = shadowRoot.querySelector('style.custom-webview-style');
          if (!style) {
            style = document.createElement('style');
            style.className = 'custom-webview-style';
            style.textContent = `
              :host {
                display: flex !important;
                flex-direction: column !important;
              }
              iframe {
                flex: 1 1 auto !important;
                width: 100% !important;
                height: 100% !important;
                border: 0 !important;
              }
            `;
            shadowRoot.appendChild(style);
          }
        }
      } catch (err) {
        console.warn('Impossible de modifier le shadow DOM:', err);
      }
    }, 100);
    
    // Attacher les événements au webview
    this.attachWebviewEvents(tabId, webview);
    
    this.switchTab(tabId);
  }
  
  attachWebviewEvents(tabId, webview) {
    // Event: webview prêt - Re-forcer le style du shadow DOM
    webview.addEventListener('dom-ready', () => {
      // Injecter CSS dans la page chargée
      webview.insertCSS(`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: auto !important;
        }
      `);
      
      // Re-forcer le style du shadow DOM au cas où
      try {
        const shadowRoot = webview.shadowRoot;
        if (shadowRoot) {
          const iframe = shadowRoot.querySelector('iframe');
          if (iframe) {
            iframe.style.cssText = 'flex: 1 1 auto !important; width: 100% !important; height: 100% !important; border: 0 !important;';
          }
        }
      } catch (err) {
        console.warn('Shadow DOM non accessible:', err);
      }
    });
    
    // Event: page chargée
    webview.addEventListener('did-start-loading', () => {
      const btn = document.getElementById('btn-refresh');
      const stopBtn = document.getElementById('btn-stop');
      btn.classList.add('hidden');
      stopBtn.classList.remove('hidden');
    });
    
    webview.addEventListener('did-stop-loading', () => {
      const btn = document.getElementById('btn-refresh');
      const stopBtn = document.getElementById('btn-stop');
      btn.classList.remove('hidden');
      stopBtn.classList.add('hidden');
      
      // Mettre à jour le titre
      const title = webview.getTitle();
      this.updateTabTitle(tabId, title);
    });
    
    // Event: navigation
    webview.addEventListener('did-navigate', (e) => {
      this.updateTabUrl(tabId, e.url);
    });
    
    webview.addEventListener('did-navigate-in-page', (e) => {
      this.updateTabUrl(tabId, e.url);
    });
    
    // Event: titre mis à jour
    webview.addEventListener('page-title-updated', (e) => {
      this.updateTabTitle(tabId, e.title);
    });
    
    // Event: nouveau window (popup)
    webview.addEventListener('new-window', (e) => {
      console.log('Nouvelle fenêtre:', e.url);
      this.createTab(e.url);
    });
  }
  
  updateTabUrl(tabId, url) {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.url = url;
      if (tabId === this.activeTabId) {
        document.getElementById('url-bar').value = url;
        updateSecurityIndicator(url);
        addToHistory({ url, title: tab.title });
      }
    }
  }
  
  updateTabTitle(tabId, title) {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.title = title || 'Nouvel onglet';
      const tabElement = document.getElementById(`tab-${tabId}`);
      if (tabElement) {
        const titleElement = tabElement.querySelector('.tab-title');
        titleElement.textContent = tab.title;
      }
    }
  }
  
  switchTab(tabId) {
    // Désactiver tous les onglets visuellement
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    const tabElement = document.getElementById(`tab-${tabId}`);
    if (tabElement) {
      tabElement.classList.add('active');
    }
    
    // Cacher tous les webviews et afficher celui actif
    this.tabs.forEach((tab, id) => {
      if (tab.webview) {
        if (id === tabId) {
          tab.webview.style.display = 'block';
          // IMPORTANT: Remettre le focus sur le webview actif
          setTimeout(() => {
            try {
              tab.webview.focus();
            } catch (err) {
              console.warn('Impossible de focus le webview:', err);
            }
          }, 50);
        } else {
          tab.webview.style.display = 'none';
        }
      }
    });
    
    this.activeTabId = tabId;
    const tabData = this.tabs.get(tabId);
    if (tabData) {
      document.getElementById('url-bar').value = tabData.url;
      updateSecurityIndicator(tabData.url);
      
      // Restaurer le niveau de zoom
      if (tabData.zoomLevel !== undefined) {
        this.updateZoomDisplay(tabData.zoomLevel);
      }
    }
  }
  
  closeTab(tabId) {
    if (this.tabs.size <= 1) return;
    
    const tabElement = document.getElementById(`tab-${tabId}`);
    if (tabElement) {
      tabElement.remove();
    }
    
    const tabData = this.tabs.get(tabId);
    if (tabData && tabData.webview) {
      tabData.webview.remove();
    }
    
    this.tabs.delete(tabId);
    
    if (tabId === this.activeTabId) {
      const remainingTabs = Array.from(this.tabs.keys());
      if (remainingTabs.length > 0) {
        this.switchTab(remainingTabs[0]);
      }
    }
  }
  
  getActiveTabId() {
    return this.activeTabId;
  }
  
  getActiveWebview() {
    const tabData = this.tabs.get(this.activeTabId);
    return tabData ? tabData.webview : null;
  }
  
  navigateActiveTab(url) {
    const webview = this.getActiveWebview();
    if (webview) {
      webview.loadURL(url);
    }
  }
  
  goBack() {
    const webview = this.getActiveWebview();
    if (webview && webview.canGoBack()) {
      webview.goBack();
    }
  }
  
  goForward() {
    const webview = this.getActiveWebview();
    if (webview && webview.canGoForward()) {
      webview.goForward();
    }
  }
  
  refresh() {
    const webview = this.getActiveWebview();
    if (webview) {
      webview.reload();
    }
  }
  
  stop() {
    const webview = this.getActiveWebview();
    if (webview) {
      webview.stop();
    }
  }
  
  setZoom(level) {
    const webview = this.getActiveWebview();
    if (webview) {
      webview.setZoomLevel(level);
      
      // Sauvegarder le niveau de zoom pour cet onglet
      const tabData = this.tabs.get(this.activeTabId);
      if (tabData) {
        tabData.zoomLevel = level;
      }
      
      this.updateZoomDisplay(level);
    }
  }
  
  updateZoomDisplay(level) {
    const percentage = Math.round(Math.pow(1.2, level) * 100);
    document.getElementById('zoom-level').textContent = percentage + '%';
  }
  
  async getSelectedText() {
    const webview = this.getActiveWebview();
    if (webview) {
      try {
        const text = await webview.executeJavaScript('window.getSelection().toString()');
        return text;
      } catch (err) {
        console.error('Erreur getSelection:', err);
        return '';
      }
    }
    return '';
  }
}

console.log('Création tabManager');
const tabManager = new TabManager();