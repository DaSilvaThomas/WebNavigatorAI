console.log('🚀 APP_INIT: Démarrage');

if (!window.electronAPI) {
  console.error('❌ electronAPI non disponible !');
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: Arial;">
      <h1 style="color: #ef4444;">⚠️ Erreur</h1>
      <p>Le preload ne s'est pas chargé.</p>
      <p>Vérifiez que <code>sandbox: false</code> est dans main.js</p>
      <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
        Recharger
      </button>
    </div>
  `;
} else {
  console.log('✅ electronAPI OK');
}