# ✅ Checklist Finale - Avant de dire "générateur ok"

## 🚀 Préparation

### 1. Configuration Environnement
- [ ] Fichier `.env.local` créé avec `ANTHROPIC_API_KEY`
- [ ] Dépendances installées (`npm install`)
- [ ] Serveur de dev lancé (`npm run dev`)
- [ ] Accès à http://localhost:3000/editor

---

## 🧪 Tests de Fonctionnalité (Essentiels)

### Test 1: Génération HTML Simple
- [ ] Aller sur `/editor`
- [ ] Sélectionner Framework: **HTML**
- [ ] Sélectionner Style: **Modern**
- [ ] Template: **Landing Page**
- [ ] Prompt: `"Une landing page pour une app de fitness"`
- [ ] Cliquer "Générer l'app"
- [ ] **Résultat**: Code généré et affiché dans l'iframe

### Test 2: Génération React avec Database
- [ ] Framework: **React**
- [ ] Style: **Modern**
- [ ] Template: **Dashboard**
- [ ] Database: **✓ Coché**
- [ ] Prompt: `"Dashboard avec graphiques et tableau"`
- [ ] Cliquer "Générer l'app"
- [ ] **Résultat**: Code React avec données mock

### Test 3: Génération Vue Minimal
- [ ] Framework: **Vue**
- [ ] Style: **Minimal**
- [ ] Template: **Portfolio**
- [ ] Database: **Non coché**
- [ ] Prompt: `"Portfolio photographe minimaliste"`
- [ ] Cliquer "Générer l'app"
- [ ] **Résultat**: Code Vue épuré

---

## 🎨 Tests d'Interface

### Interface Éditeur
- [ ] Templates sont sélectionnables (highlight au clic)
- [ ] Frameworks sont switchables (bouton actif change)
- [ ] Styles changent visuellement (border + couleur)
- [ ] Checkbox database fonctionne
- [ ] Compteur de caractères s'affiche (0/2000)
- [ ] Bouton "Générer" se désactive si prompt vide

### During Generation
- [ ] Barre de progression s'anime (0% → 100%)
- [ ] Étapes s'affichent et se cochent
- [ ] Spinner tourne
- [ ] Message "Génération..." s'affiche

### After Generation
- [ ] Code s'affiche dans l'iframe
- [ ] Bouton "💾 Télécharger" apparaît
- [ ] Téléchargement fonctionne (fichier .html créé)
- [ ] Preview est interactive (boutons cliquables si applicable)

---

## ❌ Tests d'Erreurs

### Erreur 1: Prompt Vide
- [ ] Laisser le prompt vide
- [ ] Cliquer "Générer"
- [ ] **Attendu**: Message d'erreur rouge s'affiche

### Erreur 2: Prompt Trop Long
- [ ] Taper plus de 2000 caractères
- [ ] **Attendu**: Le compteur affiche 2000/2000 max

### Erreur 3: Framework Invalide (via API)
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","framework":"angular"}'
```
- [ ] **Attendu**: JSON avec erreur framework invalide

---

## 📊 Tests de Qualité du Code

### Pour chaque génération, vérifier:
- [ ] Le code est **complet** (pas de `// TODO` ou `...`)
- [ ] Le code est **fonctionnel** (pas d'erreur console)
- [ ] Le code est **responsive** (tester avec DevTools mobile)
- [ ] Les couleurs **Wapify** sont utilisées (#F5F3EF, #CC785C)
- [ ] **PAS** de `localStorage` ou `sessionStorage`
- [ ] Si database=true, des **données mock** sont présentes

---

## 🔧 Tests Techniques

### Test API GET
```bash
curl http://localhost:3000/api/generate
```
- [ ] Retourne JSON avec templates, frameworks, styles

### Test API POST
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A simple landing page","framework":"html"}'
```
- [ ] Retourne JSON avec `success: true` et `code`

### Console Browser (F12)
- [ ] Aucune erreur JavaScript
- [ ] Aucune erreur 404
- [ ] Aucune erreur CORS

---

## 📱 Tests Responsive

### Tester avec DevTools (F12 → Toggle Device Toolbar)
- [ ] iPhone SE (375px) → Interface s'adapte
- [ ] iPad (768px) → Interface s'adapte
- [ ] Desktop (1920px) → Interface utilise l'espace

---

## 🚀 Tests Avancés (Optionnels)

### Combinaisons Diverses
- [ ] HTML + Modern + Landing Page
- [ ] React + Colorful + E-commerce + DB
- [ ] Vue + Minimal + Portfolio
- [ ] HTML + Modern + Dashboard + DB
- [ ] React + Minimal + Blog

### Prompts Complexes
```
Un dashboard analytics avec:
- Graphique ligne de ventes mensuelles (12 mois)
- Top 5 produits en barres
- 3 KPIs: CA, clients, conversions
- Tableau dernières commandes (10 lignes)
- Filtres: jour/semaine/mois
```
- [ ] Génère un code complet avec toutes les features

---

## 📚 Vérification Documentation

- [ ] `GENERATEUR_AMELIORATIONS.md` existe
- [ ] `EXEMPLES_DE_TESTS.md` existe
- [ ] `QUICK_START.md` existe
- [ ] `RESUME_AMELIORATIONS.md` existe
- [ ] `types/wapify.d.ts` existe
- [ ] Tous les fichiers sont lisibles

---

## ⚡ Tests de Performance

### Temps de Génération
- [ ] Simple (Landing Page): < 15 secondes
- [ ] Moyen (Dashboard): < 20 secondes
- [ ] Complexe (E-commerce + DB): < 30 secondes

### Taille du Code
- [ ] HTML simple: 2-5 KB
- [ ] React complexe: 5-15 KB
- [ ] Tous < 50 KB

---

## 🎯 Critères de Validation Finale

### TOUS ces critères doivent être validés:

#### Fonctionnalité ✅
- [x] Au moins 1 génération HTML réussie
- [x] Au moins 1 génération React réussie
- [x] Au moins 1 génération Vue réussie
- [x] Option database fonctionne
- [x] Téléchargement fonctionne
- [x] Preview s'affiche correctement

#### Qualité ✅
- [x] Code généré est complet
- [x] Code généré fonctionne
- [x] Pas de localStorage utilisé
- [x] Palette Wapify appliquée
- [x] Design responsive

#### Interface ✅
- [x] Templates sélectionnables
- [x] Frameworks switchables
- [x] Erreurs gérées et affichées
- [x] Progress bar animée
- [x] Aucune erreur console

#### Robustesse ✅
- [x] Gestion erreur prompt vide
- [x] Gestion erreur API
- [x] Validation des inputs
- [x] Messages clairs

---

## 🎊 Une fois TOUS les tests passés:

### Commande Finale
```
✅ generateur ok
```

Puis on passera au **Dashboard Utilisateur** avec:
- 🔐 Système d'authentification NextAuth
- 💾 Sauvegarde projets dans Supabase
- 📊 Historique et statistiques
- 🚀 Système de déploiement Vercel
- 💳 Gestion des crédits utilisateur
- 👤 Profil utilisateur

---

## 💡 Astuces pour les Tests

### Si un test échoue:
1. Vérifier la console navigateur (F12)
2. Vérifier les logs serveur (terminal)
3. Vérifier que `ANTHROPIC_API_KEY` est valide
4. Retenter avec un prompt plus simple
5. Vérifier la connexion internet

### Scripts de Test Rapide
```bash
# Bash
chmod +x scripts/test-api.sh
./scripts/test-api.sh

# Node.js
node scripts/test-api.js
```

---

## 📸 Screenshot Recommandés (pour toi)

Prendre des screenshots de:
- [ ] Interface éditeur complète
- [ ] Génération en cours (progress bar)
- [ ] Code généré dans l'iframe
- [ ] Dashboard généré fonctionnel
- [ ] Tests API réussis

---

**Bonne chance avec les tests ! 🚀**

Une fois tout validé, tu pourras dire **"générateur ok"** et on attaquera le Dashboard Utilisateur ! 🎯