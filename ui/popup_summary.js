let currentSummary = '';

// AI Summary button
document.getElementById('btn-ai').addEventListener('click', async () => {
  const tabId = tabManager.getActiveTabId();
  if (!tabId) return;
  
  try {
    const selectedText = await window.electronAPI.getSelectedText(tabId);
    
    if (!selectedText || selectedText.trim().length < 50) {
      showAiPopup();
      showAiError('Veuillez sélectionner au moins 50 caractères de texte sur la page.');
      return;
    }
    
    showAiPopup();
    showAiLoading();
    
    const result = await window.electronAPI.summarizeText(selectedText);
    
    hideAiLoading();
    
    if (result.success) {
      showAiResult(result.summary);
    } else {
      showAiError(result.error || 'Erreur lors de la génération du résumé');
    }
  } catch (err) {
    hideAiLoading();
    showAiError('Erreur: ' + err.message);
  }
});

function showAiPopup() {
  const popup = document.getElementById('ai-popup');
  popup.classList.remove('hidden');
  
  document.getElementById('ai-loading').classList.add('hidden');
  document.getElementById('ai-result').classList.add('hidden');
  document.getElementById('ai-error').classList.add('hidden');
  document.getElementById('ai-actions').classList.add('hidden');
}

function showAiLoading() {
  document.getElementById('ai-loading').classList.remove('hidden');
  document.getElementById('ai-result').classList.add('hidden');
  document.getElementById('ai-error').classList.add('hidden');
  document.getElementById('ai-actions').classList.add('hidden');
}

function hideAiLoading() {
  document.getElementById('ai-loading').classList.add('hidden');
}

function showAiResult(summary) {
  currentSummary = summary;
  const resultDiv = document.getElementById('ai-result');
  resultDiv.textContent = summary;
  resultDiv.classList.remove('hidden');
  document.getElementById('ai-error').classList.add('hidden');
  document.getElementById('ai-actions').classList.remove('hidden');
}

function showAiError(error) {
  const errorDiv = document.getElementById('ai-error');
  errorDiv.textContent = error;
  errorDiv.classList.remove('hidden');
  document.getElementById('ai-result').classList.add('hidden');
  document.getElementById('ai-actions').classList.add('hidden');
}

document.getElementById('close-popup').addEventListener('click', () => {
  document.getElementById('ai-popup').classList.add('hidden');
});

document.getElementById('btn-copy-summary').addEventListener('click', () => {
  if (currentSummary) {
    navigator.clipboard.writeText(currentSummary).then(() => {
      showNotification('Résumé copié dans le presse-papiers');
    }).catch(err => {
      showAiError('Erreur de copie: ' + err.message);
    });
  }
});

document.getElementById('ai-popup').addEventListener('click', (e) => {
  if (e.target.id === 'ai-popup') {
    document.getElementById('ai-popup').classList.add('hidden');
  }
});