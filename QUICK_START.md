# 🚀 Quick Start - Générateur Wapify

## Installation Rapide

### 1. Cloner et Installer
```bash
# Déjà fait, mais pour référence:
npm install
```

### 2. Variables d'Environnement
Créer `.env.local` :
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 3. Lancer le Dev Server
```bash
npm run dev
```

### 4. Ouvrir l'Éditeur
```
http://localhost:3000/editor
```

---

## 🎯 Utilisation en 3 Étapes

### Étape 1: Choisir les Options
- **Framework**: HTML, React ou Vue
- **Style**: Modern, Minimal ou Colorful
- **Template** (optionnel): Landing Page, Dashboard, etc.
- **Base de données** (optionnel): Cocher si besoin de données mock

### Étape 2: Décrire l'App
Écrire un prompt détaillé, par exemple:
```
Un dashboard de gestion avec:
- Graphiques de ventes (ligne et barres)
- Tableau des derniers clients
- Statistiques (CA, commandes, produits)
- Filtres par période
```

### Étape 3: Générer et Télécharger
1. Cliquer sur "⚡ Générer l'app"
2. Attendre 10-15 secondes
3. Prévisualiser dans l'iframe
4. Cliquer sur "💾 Télécharger"

---

## 💡 Exemples de Prompts

### Landing Page Simple
```
Une landing page pour une app de fitness avec hero section, 
3 features, témoignages et formulaire d'inscription
```

### Dashboard Analytics
```
Dashboard admin avec graphiques ventes mensuelles, top 5 produits, 
tableau commandes (10 dernières), et KPIs (CA, clients, conversion)
```

### Portfolio Créatif
```
Portfolio photographe avec galerie en grille (12 photos), 
section about avec photo, et formulaire contact
```

### E-commerce
```
Boutique en ligne avec grille produits (20 items), filtres 
catégorie/prix, système panier, et page checkout
```

---

## ⚡ Raccourcis

### Templates Rapides
Au lieu d'écrire tout, sélectionner un template et ajouter juste les détails spécifiques.

### Combinaisons Efficaces

**Site Vitrine**
- Framework: HTML
- Style: Modern
- Template: Landing Page
- DB: Non

**App Complexe**
- Framework: React
- Style: Modern
- Template: Dashboard
- DB: Oui

**Portfolio**
- Framework: HTML
- Style: Minimal
- Template: Portfolio
- DB: Non

---

## 🔧 Résolution de Problèmes

### Le code ne se génère pas
1. ✅ Vérifier l'API key Anthropic dans `.env.local`
2. ✅ Vérifier la console navigateur (F12) pour les erreurs
3. ✅ Essayer avec un prompt plus simple
4. ✅ Vérifier la connexion internet

### Le code semble incomplet
1. ✅ Rendre le prompt plus spécifique
2. ✅ Essayer un framework différent
3. ✅ Retenter la génération

### L'iframe ne s'affiche pas
1. ✅ Vérifier la console pour erreurs JavaScript
2. ✅ S'assurer que le code ne contient pas localStorage
3. ✅ Rafraîchir la page

### Erreur API Anthropic
1. ✅ Vérifier que l'API key est valide
2. ✅ Vérifier les quotas/crédits Anthropic
3. ✅ Attendre quelques minutes (rate limit)

---

## 📚 Ressources

### Documentation
- `GENERATEUR_AMELIORATIONS.md` - Documentation complète
- `EXEMPLES_DE_TESTS.md` - Guide de tests
- `types/wapify.d.ts` - Définitions TypeScript

### Fichiers Principaux
- `lib/anthropic.ts` - Logique de génération
- `app/api/generate/route.ts` - API route
- `app/editor/page.tsx` - Interface éditeur
- `lib/codeUtils.ts` - Utilitaires de validation

### API Endpoints
- `GET /api/generate` - Liste des options disponibles
- `POST /api/generate` - Génère une application

---

## 🎨 Personnalisation

### Ajouter un Template
```typescript
// Dans lib/anthropic.ts
export const TEMPLATES = {
  'mon-template': 'Description détaillée...',
  // ... autres templates
}
```

### Modifier les Couleurs
```typescript
// Dans tailwind.config.ts
colors: {
  wapify: {
    bg: "#F5F3EF",      // Fond
    accent: "#CC785C",  // Accent
    // ... autres couleurs
  },
}
```

### Ajuster les Prompts Système
```typescript
// Dans lib/anthropic.ts
const SYSTEM_PROMPTS = {
  html: `Vos instructions personnalisées...`,
  // ... autres frameworks
}
```

---

## 📊 Métriques de Qualité

### Code Généré Devrait:
- ✅ Être complet (pas de TODO)
- ✅ Fonctionner immédiatement
- ✅ Être responsive
- ✅ Utiliser la palette Wapify
- ✅ Être accessible (ARIA)
- ✅ Ne jamais utiliser localStorage

### Temps de Génération
- Simple: 5-10 secondes
- Moyen: 10-15 secondes
- Complexe: 15-25 secondes

---

## 🚀 Prochaine Étape

Une fois que vous avez testé le générateur et que tout fonctionne:

```
Dis-moi "generateur ok" pour passer au Dashboard Utilisateur
```

Le Dashboard Utilisateur permettra de:
- 🔐 S'authentifier
- 💾 Sauvegarder les projets
- 📊 Voir l'historique
- 🚀 Déployer les apps
- 💳 Gérer les crédits

---

## ⚠️ Important

### Ce qui est Interdit
- ❌ localStorage / sessionStorage
- ❌ Cookies non autorisés
- ❌ APIs externes sans CORS
- ❌ Code malveillant

### Limites
- Max 2000 caractères pour le prompt
- ~8000 tokens max pour le code généré
- Rate limits API Anthropic

---

## 💬 Support

Si problème:
1. Consulter `EXEMPLES_DE_TESTS.md`
2. Vérifier les logs console
3. Tester les exemples fournis
4. Vérifier l'API key

---

**Bonne génération ! 🎉**