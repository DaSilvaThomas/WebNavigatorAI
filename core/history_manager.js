function addToHistory(entry) {
  if (!entry.url || !entry.title) return;
  
  window.electronAPI.addHistory({
    url: entry.url,
    title: entry.title
  });
}

function showHistoryPanel() {
  const panel = document.getElementById('history-panel');
  panel.classList.remove('hidden');
  
  const history = window.electronAPI.getHistory();
  const listDiv = document.getElementById('history-list');
  listDiv.innerHTML = '';
  
  if (history.length === 0) {
    listDiv.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">Aucun historique</p>';
    return;
  }
  
  history.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'panel-item';
    
    const date = new Date(item.timestamp);
    const timeStr = formatRelativeTime(date);
    
    itemDiv.innerHTML = `
      <div class="panel-item-content">
        <div class="panel-item-title">${escapeHtml(item.title)}</div>
        <div class="panel-item-url">${escapeHtml(item.url)}</div>
        <div class="panel-item-time">${timeStr}</div>
      </div>
    `;
    
    itemDiv.addEventListener('click', () => {
      const tabId = tabManager.getActiveTabId();
      if (tabId) {
        window.electronAPI.navigateTab(tabId, item.url);
        panel.classList.add('hidden');
      }
    });
    
    listDiv.appendChild(itemDiv);
  });
}

document.getElementById('btn-clear-history').addEventListener('click', () => {
  if (confirm('Effacer tout l\'historique ?')) {
    window.electronAPI.clearHistory();
    showHistoryPanel();
  }
});

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}