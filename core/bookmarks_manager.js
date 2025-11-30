function showBookmarksPanel() {
  const panel = document.getElementById('bookmarks-panel');
  panel.classList.remove('hidden');
  
  const bookmarks = window.electronAPI.getBookmarks();
  const listDiv = document.getElementById('bookmarks-list');
  listDiv.innerHTML = '';
  
  if (bookmarks.length === 0) {
    listDiv.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">Aucun favori</p>';
    return;
  }
  
  bookmarks.forEach(bookmark => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'panel-item';
    
    itemDiv.innerHTML = `
      <div class="panel-item-content">
        <div class="panel-item-title">${escapeHtml(bookmark.title)}</div>
        <div class="panel-item-url">${escapeHtml(bookmark.url)}</div>
      </div>
      <button class="panel-item-remove" title="Supprimer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    `;
    
    itemDiv.querySelector('.panel-item-content').addEventListener('click', () => {
      const tabId = tabManager.getActiveTabId();
      if (tabId) {
        window.electronAPI.navigateTab(tabId, bookmark.url);
        panel.classList.add('hidden');
      }
    });
    
    itemDiv.querySelector('.panel-item-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Supprimer ce favori ?')) {
        window.electronAPI.removeBookmark(bookmark.url);
        showBookmarksPanel();
      }
    });
    
    listDiv.appendChild(itemDiv);
  });
}