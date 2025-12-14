function showBookmarksPanel() {
  const panel = document.getElementById('bookmarks-panel');
  const list = document.getElementById('bookmarks-list');
  
  panel.classList.remove('hidden');
  
  const bookmarks = window.electronAPI.getBookmarks();
  
  if (bookmarks.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">Aucun favori</p>';
    return;
  }
  
  list.innerHTML = bookmarks.map(item => {
    const date = new Date(item.timestamp);
    const timeStr = date.toLocaleDateString('fr-FR');
    
    return `
      <div class="panel-item" data-url="${item.url}">
        <div class="panel-item-content">
          <div class="panel-item-title">${item.title || 'Sans titre'}</div>
          <div class="panel-item-url">${item.url}</div>
          <div class="panel-item-time">Ajouté le ${timeStr}</div>
        </div>
        <button class="panel-item-remove" data-url="${item.url}" title="Supprimer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');
  
  // Ajouter les événements de clic sur les éléments
  list.querySelectorAll('.panel-item').forEach(item => {
    // Clic sur l'élément pour ouvrir l'URL
    const content = item.querySelector('.panel-item-content');
    content.addEventListener('click', () => {
      const url = item.getAttribute('data-url');
      if (url) {
        // Créer un nouvel onglet avec cette URL
        tabManager.createTab(url);
        // Fermer le panel
        panel.classList.add('hidden');
      }
    });
  });
  
  // Ajouter les événements de suppression
  list.querySelectorAll('.panel-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Empêcher le clic de se propager à l'élément parent
      const url = btn.getAttribute('data-url');
      if (url && confirm('Supprimer ce favori ?')) {
        window.electronAPI.removeBookmark(url);
        showBookmarksPanel(); // Rafraîchir la liste
      }
    });
  });
}