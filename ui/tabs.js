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
    
    this.init();
  }
  
  init() {
    this.newTabBtn.addEventListener('click', () => {
      console.log('Nouveau tab');
      this.createTab();
    });
    
    window.electronAPI.onTabLoading((tabId, loading) => {
      const btn = document.getElementById('btn-refresh');
      const stopBtn = document.getElementById('btn-stop');
      if (loading) {
        btn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
      } else {
        btn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
      }
    });
    
    window.electronAPI.onTabUrl((tabId, url) => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.url = url;
        if (tabId === this.activeTabId) {
          document.getElementById('url-bar').value = url;
          updateSecurityIndicator(url);
          addToHistory({ url, title: tab.title });
        }
      }
    });
    
    window.electronAPI.onTabTitle((tabId, title) => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.title = title;
        const tabElement = document.getElementById(`tab-${tabId}`);
        if (tabElement) {
          const titleElement = tabElement.querySelector('.tab-title');
          titleElement.textContent = title || 'Nouvel onglet';
        }
      }
    });
    
    this.createTab();
  }
  
  async createTab(url = null) {
    console.log('Création tab');
    this.tabCounter++;
    const tabId = `tab-${this.tabCounter}`;
    
    const config = window.electronAPI.getConfig();
    const targetUrl = url || config.defaultUrl;
    
    const tabData = {
      id: tabId,
      url: targetUrl,
      title: 'Nouvel onglet'
    };
    
    this.tabs.set(tabId, tabData);
    
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
    
    await window.electronAPI.createTab(tabId, targetUrl);
    this.switchTab(tabId);
  }
  
  async switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    const tabElement = document.getElementById(`tab-${tabId}`);
    if (tabElement) {
      tabElement.classList.add('active');
    }
    
    this.activeTabId = tabId;
    const tabData = this.tabs.get(tabId);
    if (tabData) {
      document.getElementById('url-bar').value = tabData.url;
      updateSecurityIndicator(tabData.url);
    }
    
    await window.electronAPI.switchTab(tabId);
  }
  
  async closeTab(tabId) {
    if (this.tabs.size <= 1) return;
    
    const tabElement = document.getElementById(`tab-${tabId}`);
    if (tabElement) {
      tabElement.remove();
    }
    
    this.tabs.delete(tabId);
    await window.electronAPI.closeTab(tabId);
    
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
}

console.log('Création tabManager');
const tabManager = new TabManager();