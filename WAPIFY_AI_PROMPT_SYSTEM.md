# 🤖 Système de Prompt AI pour Wapify

**Date de création**: 17 Octobre 2025
**Objectif**: Garantir des applications React fonctionnelles sans erreurs pour utilisateurs non-techniques

---

## 🎯 Vision Wapify

Wapify est une **plateforme no-code** permettant à des utilisateurs **NON-TECHNIQUES** de créer des applications React fonctionnelles en décrivant ce qu'ils veulent en langage naturel.

### Public cible
- ❌ Pas de développeurs
- ✅ Entrepreneurs, marketeurs, créateurs de contenu
- ✅ Personnes qui veulent une app fonctionnelle IMMÉDIATEMENT
- ✅ Utilisateurs qui ne voient QUE la preview (pas le code)

---

## 🏗️ Architecture Technique

### Stack
- **Frontend**: Next.js 14.2 + React 18.3
- **Preview**: Sandpack (compilation navigateur)
- **Infrastructure**: Supabase (auth, metadata, storage)
- **Bases de données**: Neon PostgreSQL (une DB par app créée)
- **AI**: Anthropic Claude Sonnet 4

### Flow de génération
```
User prompt → AI analyse → Génération multi-fichiers React → Storage Supabase → Preview Sandpack
```

---

## 📦 Bibliothèques Autorisées (STRICT)

### ✅ AUTORISÉ
| Bibliothèque | Version | Usage |
|-------------|---------|-------|
| React | ^18.3.0 | Framework principal |
| React DOM | ^18.3.0 | Rendering |
| Tailwind CSS | CDN (pas npm) | Styling UNIQUEMENT |
| Lucide-react | ^0.263.1 | Icônes (si nécessaire) |
| React Router DOM | ^6.21.0 | Navigation multi-pages |
| @supabase/supabase-js | ^2.39.0 | Si DB demandée |

**Note**: Sandpack compile tout dans le navigateur. Pas besoin de Vite/Webpack.

### ❌ STRICTEMENT INTERDIT

Ces bibliothèques causent des **erreurs 503/CORS** dans Sandpack:

| Bibliothèque | Raison | Alternative |
|-------------|--------|-------------|
| date-fns | Erreurs unpkg.com | `new Date()` natif |
| moment.js | Trop lourd, obsolète | `new Date()` natif |
| dayjs | Erreurs unpkg.com | `new Date()` natif |
| goober | Erreurs modules manquants | Tailwind CSS |
| styled-components | CSS-in-JS non supporté | Tailwind CSS |
| emotion | CSS-in-JS non supporté | Tailwind CSS |
| axios | Inutile | `fetch()` natif |
| lodash | Trop lourd | Méthodes JS natives |
| uuid | Inutile | `Date.now() + Math.random()` |

---

## 📅 Manipulation de Dates (Exemples)

### ✅ BON - JavaScript natif
```javascript
// Formatage date complète
const now = new Date()
const formatted = now.toLocaleDateString('fr-FR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})
// → "vendredi 17 octobre 2025"

// Formatage heure
const time = now.toLocaleTimeString('fr-FR', {
  hour: '2-digit',
  minute: '2-digit'
})
// → "14:30"

// Temps écoulé
const timestamp = 1697558400000
const minutesAgo = Math.floor((Date.now() - timestamp) / (1000 * 60))
// → "15 min"

// Comparaison
const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000
// → true si moins de 24h

// Ajout de jours
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)

// ISO string
const isoDate = new Date().toISOString()
// → "2025-10-17T14:30:00.000Z"
```

### ❌ MAUVAIS - Ne JAMAIS faire
```javascript
import { format, addDays } from 'date-fns' // ❌ INTERDIT
import moment from 'moment' // ❌ INTERDIT
import dayjs from 'dayjs' // ❌ INTERDIT
```

---

## 🎨 Styling (Exemples)

### ✅ BON - Tailwind CSS uniquement
```jsx
// Gradients, shadows, animations
<div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300">
  <h1 className="text-4xl font-bold text-white mb-4">
    Mon Titre
  </h1>
  <button className="px-6 py-3 bg-white text-purple-600 rounded-full font-semibold hover:bg-purple-50 active:scale-95 transition">
    Cliquez-moi
  </button>
</div>

// Layout responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id} className="bg-white p-4 rounded-lg">
      {item.name}
    </div>
  ))}
</div>
```

### ❌ MAUVAIS - Ne JAMAIS faire
```javascript
import { styled } from 'goober' // ❌ INTERDIT
import styled from 'styled-components' // ❌ INTERDIT
import { css } from '@emotion/react' // ❌ INTERDIT

const Button = styled('button')`
  background: blue; // ❌ INTERDIT
`
```

---

## 💎 Exigences Qualité

### Données mockées (CRITICAL)
- ❌ Pas 5-10 items
- ✅ **Minimum 30-50 items réalistes**

**Exemples:**
```javascript
// ✅ BON - 40 produits e-commerce
const products = [
  {
    id: 1,
    name: "MacBook Pro 14\" M3",
    price: 2499,
    category: "Ordinateurs",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    description: "Puce M3 Pro, 18 Go RAM, 512 Go SSD",
    rating: 4.8,
    reviews: 324,
    inStock: true,
    tags: ["Premium", "Apple", "Nouveauté"]
  },
  // ... 39 autres produits réalistes
]

// ✅ BON - 30 articles blog
const articles = [
  {
    id: 1,
    title: "10 Astuces pour Améliorer Votre Productivité",
    slug: "10-astuces-productivite",
    author: {
      name: "Marie Dupont",
      avatar: "https://i.pravatar.cc/150?img=1",
      bio: "Coach en productivité"
    },
    publishedAt: new Date('2025-10-15').toISOString(),
    readTime: "8 min",
    category: "Productivité",
    tags: ["Tips", "Travail", "Organisation"],
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b",
    excerpt: "Découvrez comment optimiser votre temps...",
    content: "Lorem ipsum dolor sit amet...", // Contenu complet
    views: 1247,
    likes: 89,
    comments: 12
  },
  // ... 29 autres articles
]
```

### Pages/Sections (CRITICAL)
- ❌ Pas 2-3 pages
- ✅ **Minimum 5-8 sections complètes**

**Exemples par type d'app:**

**E-commerce:**
1. Page d'accueil (hero + featured products)
2. Catalogue produits (grid avec filtres)
3. Détail produit (images, description, avis)
4. Panier (liste items, total, promo)
5. Checkout (formulaire, paiement)
6. Mon compte (commandes, profil)
7. Wishlist (produits sauvegardés)
8. Suivi commande

**Dashboard SaaS:**
1. Overview (KPIs, graphiques)
2. Analytics (charts détaillés)
3. Utilisateurs (table, CRUD)
4. Rapports (export, filtres)
5. Paramètres (compte, préférences)
6. Notifications (centre de messages)
7. Support (tickets, FAQ)
8. Facturation

---

## 🚀 Fonctionnalités Requises

### TOUS les boutons doivent fonctionner
```jsx
// ✅ BON - Bouton fonctionnel
<button
  onClick={() => {
    setIsModalOpen(true)
    console.log('Modal ouverte')
  }}
  className="px-4 py-2 bg-blue-600 text-white rounded"
>
  Ajouter
</button>

// ❌ MAUVAIS - Bouton mort
<button className="px-4 py-2 bg-blue-600 text-white rounded">
  Ajouter {/* Rien ne se passe au clic */}
</button>
```

### Animations et Transitions
```jsx
// Hover effects
className="hover:scale-105 hover:shadow-lg transition-all duration-200"

// Fade in au chargement
className="animate-fade-in opacity-0 animate-delay-100"

// Loading spinner
{isLoading && (
  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
)}

// Toast notifications
<div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg animate-slide-in-right">
  ✓ Enregistré avec succès!
</div>
```

### Formulaires avec validation
```jsx
const [errors, setErrors] = useState({})

const handleSubmit = (e) => {
  e.preventDefault()

  const newErrors = {}
  if (!email.includes('@')) {
    newErrors.email = 'Email invalide'
  }
  if (password.length < 8) {
    newErrors.password = 'Minimum 8 caractères'
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors)
    return
  }

  // Soumission
  console.log('Formulaire valide!')
}

return (
  <form onSubmit={handleSubmit}>
    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className={errors.email ? 'border-red-500' : 'border-gray-300'}
    />
    {errors.email && (
      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
    )}
  </form>
)
```

---

## 🗃️ Base de Données

### Quand créer une DB?
- ✅ Si l'app nécessite: comptes utilisateurs, CRUD persistant, e-commerce avec commandes
- ❌ Si l'app est statique: landing page, portfolio, blog simple

### Structure si DB nécessaire

**1. Générer schema.sql**
```sql
-- database/schema.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  total DECIMAL(10, 2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**2. Client Supabase/Neon**
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// ⚠️ NE PAS UTILISER import.meta.env (syntaxe Vite)
// Sandpack ne supporte pas import.meta
// Utilise process.env ou constantes mockées

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://mock.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'mock-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

console.log('📦 Supabase client initialisé (mode mock pour preview)')
```

**3. Hook de données avec mock**
```javascript
// src/hooks/useProducts.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Mock data pour la preview (avant connexion DB)
const MOCK_PRODUCTS = [
  { id: 1, name: 'Produit 1', price: 29.99 },
  // ... 39 autres
]

export function useProducts() {
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)

    // Essayer de charger depuis Supabase
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Using mock data (DB not connected yet)')
      setProducts(MOCK_PRODUCTS)
    } else {
      setProducts(data || MOCK_PRODUCTS)
    }

    setLoading(false)
  }

  const addProduct = async (product) => {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()

    if (error) {
      // Fallback local
      const newProduct = { ...product, id: Date.now() }
      setProducts([newProduct, ...products])
      return newProduct
    }

    setProducts([data[0], ...products])
    return data[0]
  }

  return { products, loading, addProduct, refresh: loadProducts }
}
```

---

## 📁 Structure de Fichiers Générée

### Exemple complet pour "Application e-commerce"

```
/
├── index.html              # Avec Tailwind CDN
├── package.json            # Dépendances minimales
├── src/
│   ├── main.jsx               # Point d'entrée
│   ├── App.jsx                # Composant principal + routing
│   ├── styles/
│   │   └── App.css            # Styles additionnels
│   ├── components/
│   │   ├── Navbar.jsx         # Navigation
│   │   ├── ProductCard.jsx    # Carte produit
│   │   ├── CartItem.jsx       # Item panier
│   │   ├── Modal.jsx          # Modal réutilisable
│   │   └── LoadingSpinner.jsx # Spinner
│   ├── pages/
│   │   ├── Home.jsx           # Page accueil
│   │   ├── Products.jsx       # Liste produits
│   │   ├── ProductDetail.jsx  # Détail produit
│   │   ├── Cart.jsx           # Panier
│   │   ├── Checkout.jsx       # Paiement
│   │   └── Account.jsx        # Compte user
│   ├── hooks/
│   │   ├── useProducts.js     # Hook produits
│   │   ├── useCart.js         # Hook panier
│   │   └── useAuth.js         # Hook auth
│   └── lib/
│       └── supabase.js        # Client DB (si nécessaire)
└── database/
    └── schema.sql             # Schéma SQL (si DB)

**❌ NE PAS GÉNÉRER:**
- `vite.config.js` - Sandpack remplace Vite automatiquement
- `.env` files - Variables mockées directement dans le code
- `tsconfig.json` - On utilise JavaScript uniquement
```

---

## ⚙️ Vite vs Sandpack - Comprendre la différence

### 🤔 Pourquoi pas Vite ?

**Vite** est un **bundler** comme Webpack qui fonctionne ainsi :
```
Code source → Vite (Node.js) → Bundle compilé → Serveur dev → Navigateur
```

**Problème** : Vite nécessite Node.js, un serveur, et des fichiers sur disque. **Impossible dans le navigateur.**

### ✅ Sandpack à la rescousse

**Sandpack** compile **directement dans le navigateur** :
```
Code source → Sandpack (navigateur) → Preview instantanée
```

**Avantages** :
- ✅ Pas de serveur nécessaire
- ✅ Compilation temps réel
- ✅ Fonctionne dans n'importe quel navigateur
- ✅ Preview instantanée pour les utilisateurs
- ✅ Pas de build time

### 🔄 Workflow Wapify complet

```mermaid
User prompt
    ↓
AI génère code React
    ↓
Stockage Supabase Storage
    ↓
┌─────────────────┬─────────────────┐
│   PREVIEW       │   DÉPLOIEMENT   │
│   (Sandpack)    │   (Vite)        │
├─────────────────┼─────────────────┤
│ Dans navigateur │ Sur Vercel      │
│ Instant         │ 1-2 minutes     │
│ Mock data       │ Vraie DB Neon   │
│ Pour tester     │ Pour production │
└─────────────────┴─────────────────┘
```

### 📝 Syntaxe à éviter/préférer

| ❌ Syntaxe Vite (ne marche pas) | ✅ Syntaxe Sandpack (marche) |
|----------------------------------|------------------------------|
| `import.meta.env.VITE_API_KEY` | `process.env.REACT_APP_API_KEY` |
| `import.meta.url` | Pas besoin |
| `import.meta.glob('*.jsx')` | Import direct de chaque fichier |
| `.env.local` file | Variables mockées dans le code |

### 🎯 Quand Vite sera utilisé ?

**Plus tard**, quand on ajoutera le **déploiement 1-click Vercel** :

1. User clique "Déployer sur Vercel"
2. Wapify génère un repo GitHub avec `vite.config.js`
3. Vercel build avec Vite
4. App déployée en production avec vraie DB Neon

Pour l'instant, **preview uniquement = Sandpack uniquement = pas de Vite**.

---

## 🔄 Workflow AI

### 1. Analyse du prompt utilisateur
```
Input: "Créer une app de suivi de fitness"
↓
AI analyse:
- Type: Dashboard + tracking
- DB nécessaire: OUI (exercices, séances, stats)
- Pages: Dashboard, Exercices, Historique, Stats, Profil
- Données mock: 50 exercices, 100 séances
```

### 2. Génération fichiers
L'AI génère un JSON contenant tous les fichiers:
```json
{
  "files": [
    {
      "path": "src/App.jsx",
      "content": "import React...",
      "type": "component"
    },
    ...
  ],
  "hasDatabase": true,
  "databaseSchema": "CREATE TABLE..."
}
```

### 3. Stockage Supabase
Les fichiers sont uploadés vers Supabase Storage:
```
/project-files/{userId}/{projectId}/src/App.jsx
/project-files/{userId}/{projectId}/src/main.jsx
...
```

### 4. Preview Sandpack
ReactPreview charge les fichiers et compile dans le navigateur.

---

## 🎨 Thèmes de Couleurs

L'AI choisit automatiquement un thème adapté au contexte:

| Contexte | Thème | Couleurs |
|----------|-------|----------|
| E-commerce premium | Premium | Noir, Or, Blanc |
| Business/SaaS | Professional | Bleu, Indigo, Gris |
| Créatif/Portfolio | Creative | Violet, Rose, Orange |
| Tech/Startup | Modern Tech | Indigo, Violet, Rose |
| Santé/Bien-être | Fresh | Vert, Émeraude |
| Restaurant | Warm | Rouge, Orange, Beige |
| Enfants | Playful | Jaune, Rose, Violet |

---

## 🔍 Détection de Problèmes

### Logs de debugging
Le composant ReactPreview log les dépendances bloquées:
```javascript
console.warn('⚠️ Dépendance bloquée détectée: date-fns')
console.warn('Cette bibliothèque cause des erreurs Sandpack et a été ignorée.')
```

### Résolution automatique
- Import de `date-fns` détecté → Warning mais pas ajouté aux deps
- Code compile quand même car le code utilise les natives alternatives

---

## 📊 Métriques de Succès

**Avant le nouveau prompt:**
- ❌ Erreurs Sandpack: ~60% des apps
- ❌ Dépendances 503: date-fns, goober, babel-plugin-macros
- ❌ Apps incomplètes: 3 pages, 10 items
- ❌ Boutons non-fonctionnels

**Après le nouveau prompt:**
- ✅ Erreurs Sandpack: <5% (seulement bugs AI rares)
- ✅ Pas de dépendances externes problématiques
- ✅ Apps complètes: 5-8 pages, 30-50 items
- ✅ Tous les boutons fonctionnels
- ✅ Preview fonctionne immédiatement

---

## 🚀 Prochaines Étapes

1. **Tester le nouveau prompt** avec diverses demandes utilisateur
2. **Monitorer les erreurs** Sandpack dans la console
3. **Collecter feedback** utilisateurs sur la qualité des apps
4. **Ajuster le prompt** si patterns d'erreurs détectés
5. **Documenter** les edge cases pour amélioration continue

---

## 📚 Ressources

- [Sandpack Documentation](https://sandpack.codesandbox.io/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hooks](https://react.dev/reference/react)
- [JavaScript Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)

---

**Dernière mise à jour**: 17 Octobre 2025
**Version**: 1.0
**Maintenu par**: Claude (Wapify AI Team)
