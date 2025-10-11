# 🧪 Exemples de Tests pour le Générateur Wapify

## Tests à effectuer dans l'interface

### 1. Test Landing Page Simple
**Configuration :**
- Framework: HTML
- Style: Modern
- Database: Non
- Template: Landing Page

**Prompt :**
```
Une landing page pour une application de fitness avec un hero section, 3 features principales, et un formulaire d'inscription
```

**Résultat attendu :**
- Page complète avec hero attractif
- 3 cartes de features avec icônes
- Formulaire fonctionnel
- Design moderne avec gradients

---

### 2. Test Dashboard avec Données
**Configuration :**
- Framework: React
- Style: Modern
- Database: Oui
- Template: Dashboard

**Prompt :**
```
Un dashboard admin avec graphiques de ventes mensuelles, tableau des derniers clients, et statistiques (CA, clients, produits)
```

**Résultat attendu :**
- Composant React fonctionnel
- Données mock intégrées
- Graphiques visuels
- Cartes de statistiques
- Tableau interactif

---

### 3. Test Portfolio Minimal
**Configuration :**
- Framework: HTML
- Style: Minimal
- Database: Non
- Template: Portfolio

**Prompt :**
```
Portfolio minimaliste pour un photographe avec galerie d'images, section about, et contact
```

**Résultat attendu :**
- Design épuré
- Galerie responsive
- Typographie soignée
- Beaucoup d'espace blanc

---

### 4. Test E-commerce Coloré
**Configuration :**
- Framework: Vue
- Style: Colorful
- Database: Oui
- Template: E-commerce

**Prompt :**
```
Une boutique de vêtements avec grille de produits, filtres par catégorie et prix, et panier d'achat
```

**Résultat attendu :**
- Composant Vue avec Composition API
- Produits colorés et attractifs
- Système de filtres fonctionnel
- Panier avec gestion d'état
- Design vibrant

---

### 5. Test Custom Sans Template
**Configuration :**
- Framework: React
- Style: Modern
- Database: Oui
- Template: Aucun

**Prompt :**
```
Une application de todo list avec catégories, possibilité d'ajouter/supprimer des tâches, filtres (toutes/actives/complétées), et compteur de tâches
```

**Résultat attendu :**
- App todo complète et fonctionnelle
- Toutes les fonctionnalités demandées
- État géré avec useState
- Interface moderne

---

### 6. Test Blog Article
**Configuration :**
- Framework: HTML
- Style: Minimal
- Database: Oui
- Template: Blog

**Prompt :**
```
Un blog tech avec liste d'articles, système de tags, barre de recherche, et page article individuelle avec commentaires
```

**Résultat attendu :**
- Layout blog complet
- Articles mock
- Recherche fonctionnelle
- Tags cliquables
- Section commentaires

---

## Tests d'Erreurs à Vérifier

### Test 1: Prompt Vide
- Laisser le prompt vide
- Cliquer sur Générer
- **Attendu:** Message d'erreur "Veuillez décrire votre application"

### Test 2: Prompt Trop Long
- Entrer plus de 2000 caractères
- **Attendu:** Compteur limite à 2000, bouton Générer devrait gérer l'erreur

### Test 3: Prompt Trop Vague
- Entrer juste "un site web"
- **Attendu:** Code généré mais possiblement basique, devrait suggérer d'être plus spécifique

---

## Critères de Qualité du Code Généré

### ✅ Le code doit :
1. **Être complet** - Pas de `// TODO` ou de placeholders
2. **Être fonctionnel** - Tous les boutons/interactions marchent
3. **Être responsive** - S'adapte aux mobiles
4. **Avoir du style** - Utilise la palette Wapify
5. **Pas de localStorage** - Ne jamais utiliser localStorage/sessionStorage
6. **Avoir des données** - Si database=true, inclure des données mock réalistes
7. **Être commenté** - Pour les parties complexes
8. **Être accessible** - Labels ARIA, alt texts, etc.

### ❌ Le code ne doit PAS :
1. Contenir des imports externes non gérés
2. Utiliser localStorage ou sessionStorage
3. Avoir des fonctions non implémentées
4. Être coupé ou incomplet
5. Avoir des erreurs de syntaxe

---

## Tests de Performance

### Test de Temps de Génération
- Lancer un chronomètre
- Générer une app dashboard complète
- **Attendu:** Moins de 15 secondes

### Test de Taille de Code
- Générer plusieurs apps
- Vérifier la taille du code
- **Attendu:** 2-10 KB pour HTML simple, 5-20 KB pour React complexe

---

## Tests d'Interface Utilisateur

### Test 1: Sélection de Template
- Cliquer sur un template
- Vérifier qu'il est surligné
- Cliquer à nouveau
- **Attendu:** Template désélectionné

### Test 2: Changement de Framework
- Sélectionner React
- Vérifier le bouton actif
- Changer pour Vue
- **Attendu:** Transition fluide, génération différente

### Test 3: Download du Code
- Générer une app
- Cliquer sur "💾 Télécharger"
- **Attendu:** Fichier .html téléchargé avec bon nom

### Test 4: Progress Bar
- Générer une app
- Observer la barre de progression
- **Attendu:** Animation fluide de 0 à 100%, étapes qui avancent

---

## Commandes de Test Rapides

```bash
# Test 1: Vérifier que l'API répond
curl -X GET http://localhost:3000/api/generate

# Test 2: Test de génération simple
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A simple landing page","framework":"html"}'

# Test 3: Test avec toutes les options
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt":"Dashboard with charts",
    "framework":"react",
    "style":"modern",
    "includeDatabase":true,
    "useTemplate":"dashboard"
  }'
```

---

## Checklist avant de dire "générateur ok"

- [ ] Tous les frameworks fonctionnent (HTML, React, Vue)
- [ ] Tous les styles sont différents (Modern, Minimal, Colorful)
- [ ] Les templates génèrent du code approprié
- [ ] L'option Database ajoute bien des données mock
- [ ] Les erreurs sont bien gérées et affichées
- [ ] Le téléchargement fonctionne
- [ ] La preview s'affiche correctement dans l'iframe
- [ ] La barre de progression est fluide
- [ ] Le code généré est de qualité
- [ ] Aucune erreur console dans le navigateur
- [ ] Le design est cohérent avec Wapify
- [ ] Responsive sur mobile (tester avec DevTools)

---

## Notes Importantes

### Variables d'environnement requises
```env
ANTHROPIC_API_KEY=sk-ant-...
```

### Si problèmes de génération
1. Vérifier que l'API key Anthropic est valide
2. Vérifier les logs dans la console
3. Tester avec un prompt plus simple
4. Vérifier la connexion internet

### Améliorations futures possibles
- [ ] Streaming en temps réel du code
- [ ] Édition inline du code généré
- [ ] Comparaison de versions
- [ ] Export en plusieurs formats
- [ ] Intégration GitHub
- [ ] Aperçu mobile/tablet dans l'iframe