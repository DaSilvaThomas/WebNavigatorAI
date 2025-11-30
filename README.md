# WebNavigator AI

Navigateur web desktop moderne avec résumé IA intégré, développé avec Electron et Node.js.

## Fonctionnalités

- **Navigation multi-onglets** - Gérez plusieurs pages simultanément
- **Barre URL intelligente** - Recherche rapide et navigation directe
- **Contrôles de navigation** - Précédent, Suivant, Actualiser, Stop
- **Historique persistant** - Stocké en JSON local
- **Favoris** - Sauvegardez vos sites préférés
- **Zoom global** - Ajustez la taille d'affichage
- **Résumé IA** - Résumez automatiquement le texte sélectionné
- **Indicateur HTTPS** - Vérifiez la sécurité des connexions
- **Design moderne** - Interface fluide, arrondie et minimaliste

## Prérequis

- **Node.js** v16 ou supérieur
- **npm** v7 ou supérieur
- **Windows** 10/11 (pour le build)

## Installation

```bash
# 1. Cloner ou extraire le projet
cd WebNavigatorAI

# 2. Installer les dépendances
npm install

# 3. Lancer l'application en mode développement
npm start
```

## Build pour Windows

```bash
# Créer l'installeur Windows
npm run build
```

L'exécutable se trouvera dans le dossier `dist/`.

## Structure du projet

```
WebNavigatorAI/
├── main.js              # Point d'entrée Electron + config
├── preload.js           # API sécurisée Node.js
├── package.json         # Dépendances et scripts
├── package-lock.json
├── README.md
├── node_modules/
├── ui/
│   ├── app_init.js
│   ├── main_window.html # Interface principale
│   ├── main_window.css  # Styles
│   ├── tabs.js          # Gestion des onglets
│   ├── toolbar.js       # Barre d'outils
│   └── popup_summary.js # Popup résumé IA
├── core/
│   ├── navigation.js         # Utilitaires navigation
│   ├── history_manager.js    # Gestion historique
│   └── bookmarks_manager.js  # Gestion favoris
└── data/
    ├── history.json     # Historique (créé auto)
    └── bookmarks.json   # Favoris (créé auto)
```

## Configuration du résumé IA

Par défaut, l'application utilise l'API gratuite HuggingFace (modèle `facebook/bart-large-cnn`).

**Pour améliorer les performances:**

1. Créez un compte gratuit sur [HuggingFace](https://huggingface.co)
2. Générez un token API
3. Modifiez `config.js`:

```javascript
AI_API_KEY: 'hf_VotreTokenIci'
```

## Utilisation

### Navigation
- Entrez une URL ou recherchez directement depuis la barre
- Utilisez les boutons Précédent/Suivant pour naviguer
- Cliquez sur le cadenas pour vérifier la sécurité HTTPS

### Onglets
- Cliquez sur **+** pour ouvrir un nouvel onglet
- Cliquez sur **×** pour fermer un onglet
- Cliquez sur un onglet pour l'activer

### Résumé IA
1. Sélectionnez du texte sur une page web (minimum 50 caractères)
2. Cliquez sur le bouton **IA** (icône couches) dans la barre d'outils
3. Attendez la génération du résumé
4. Copiez le résumé avec le bouton dédié

### Historique & Favoris
- Cliquez sur l'icône **horloge** pour voir l'historique
- Cliquez sur l'icône **marque-page** pour voir les favoris
- Ajoutez la page actuelle aux favoris avec le bouton dans la barre URL

### Zoom
- Utilisez les boutons **+** et **-** pour ajuster le zoom
- Le niveau de zoom s'affiche au centre

## Développement

### Scripts disponibles

```bash
npm start        # Lancer en mode développement
npm run build    # Build Windows (NSIS installer)
```

### Personnalisation

**Moteur de recherche** - Modifiez `preload.js`:
```javascript
SEARCH_ENGINE: 'https://duckduckgo.com/?q='
```

**URL par défaut** - Modifiez `main.js` et `preload.js`:
```javascript
DEFAULT_URL: 'https://votre-site.com'
```

## Sécurité

- Contexte isolé activé
- Pas d'intégration Node.js dans le renderer
- API sécurisée via preload script
- Validation des URLs
- Protection contre XSS