function addToHistory(entry) {
  if (!entry.url || entry.url === 'about:blank') return;
  
  // Vérifier que l'API est disponible
  if (!window.electronAPI || !window.electronAPI.addHistory) {
    console.error('API historique non disponible');
    return;
  }
  
  window.electronAPI.addHistory(entry);
  console.log('Ajouté à l\'historique:', entry.url);
}

function showHistoryPanel() {
  const panel = document.getElementById('history-panel');
  const list = document.getElementById('history-list');
  
  panel.classList.remove('hidden');
  
  const history = window.electronAPI.getHistory();
  
  if (history.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">Aucun historique</p>';
    return;
  }
  
  list.innerHTML = history.map(item => {
    const date = new Date(item.timestamp);
    const timeStr = date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    return `
      <div class="panel-item" data-url="${item.url}">
        <div class="panel-item-content">
          <div class="panel-item-title">${item.title || 'Sans titre'}</div>
          <div class="panel-item-url">${item.url}</div>
          <div class="panel-item-time">${timeStr}</div>
        </div>
      </div>
    `;
  }).join('');
  
  // Ajouter les événements de clic sur les éléments
  list.querySelectorAll('.panel-item').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.getAttribute('data-url');
      if (url) {
        // Créer un nouvel onglet avec cette URL
        tabManager.createTab(url);
        // Fermer le panel
        panel.classList.add('hidden');
      }
    });
  });
}

document.getElementById('btn-clear-history').addEventListener('click', () => {
  if (confirm('Voulez-vous vraiment effacer tout l\'historique ?')) {
    window.electronAPI.clearHistory();
    showHistoryPanel();
  }
});