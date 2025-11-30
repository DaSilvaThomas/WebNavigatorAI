let currentZoomLevel = 0;

console.log('🔧 Toolbar init');

document.getElementById('btn-back').addEventListener('click', () => {
  const tabId = tabManager.getActiveTabId();
  if (tabId) window.electronAPI.tabBack(tabId);
});

document.getElementById('btn-forward').addEventListener('click', () => {
  const tabId = tabManager.getActiveTabId();
  if (tabId) window.electronAPI.tabForward(tabId);
});

document.getElementById('btn-refresh').addEventListener('click', () => {
  const tabId = tabManager.getActiveTabId();
  if (tabId) window.electronAPI.tabRefresh(tabId);
});

document.getElementById('btn-stop').addEventListener('click', () => {
  const tabId = tabManager.getActiveTabId();
  if (tabId) window.electronAPI.tabStop(tabId);
});

const urlBar = document.getElementById('url-bar');
urlBar.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const input = urlBar.value.trim();
    const tabId = tabManager.getActiveTabId();
    if (tabId && input) {
      const url = formatUrl(input);
      window.electronAPI.navigateTab(tabId, url);
    }
  }
});

function formatUrl(input) {
  if (!input) return '';
  
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
  
  if (input.includes('.') && !input.includes(' ')) {
    return 'https://' + input;
  }
  
  const config = window.electronAPI.getConfig();
  return config.searchEngine + encodeURIComponent(input);
}

function updateSecurityIndicator(url) {
  const indicator = document.getElementById('security-indicator');
  if (url.startsWith('https://')) {
    indicator.classList.remove('insecure');
    indicator.title = 'Connexion sécurisée';
  } else {
    indicator.classList.add('insecure');
    indicator.title = 'Connexion non sécurisée';
  }
}

document.getElementById('btn-zoom-in').addEventListener('click', () => {
  console.log('🔍 Zoom +');
  currentZoomLevel += 0.5;
  if (currentZoomLevel > 3) currentZoomLevel = 3;
  applyZoom();
});

document.getElementById('btn-zoom-out').addEventListener('click', () => {
  console.log('🔍 Zoom -');
  currentZoomLevel -= 0.5;
  if (currentZoomLevel < -3) currentZoomLevel = -3;
  applyZoom();
});

function applyZoom() {
  const tabId = tabManager.getActiveTabId();
  if (tabId) {
    window.electronAPI.tabZoom(tabId, currentZoomLevel);
    const percentage = Math.round(Math.pow(1.2, currentZoomLevel) * 100);
    document.getElementById('zoom-level').textContent = percentage + '%';
    console.log('✅ Zoom:', percentage + '%');
  }
}

document.getElementById('btn-bookmark').addEventListener('click', () => {
  const tabId = tabManager.getActiveTabId();
  if (tabId) {
    const tab = tabManager.tabs.get(tabId);
    if (tab) {
      const added = window.electronAPI.addBookmark({
        url: tab.url,
        title: tab.title
      });
      
      if (added) {
        showNotification('Ajouté aux favoris');
      } else {
        showNotification('Déjà dans les favoris');
      }
    }
  }
});

document.getElementById('btn-history').addEventListener('click', () => {
  showHistoryPanel();
});

document.getElementById('close-history').addEventListener('click', () => {
  document.getElementById('history-panel').classList.add('hidden');
});

document.getElementById('btn-bookmarks').addEventListener('click', () => {
  showBookmarksPanel();
});

document.getElementById('close-bookmarks').addEventListener('click', () => {
  document.getElementById('bookmarks-panel').classList.add('hidden');
});

function showNotification(message) {
  const existingNotif = document.querySelector('.notification');
  if (existingNotif) existingNotif.remove();
  
  const notif = document.createElement('div');
  notif.className = 'notification';
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #374151;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: fadeInOut 2s ease;
  `;
  
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateX(-50%) translateY(10px); }
    10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;
document.head.appendChild(style);