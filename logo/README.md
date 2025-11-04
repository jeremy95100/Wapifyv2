# Wapify Logo

Ce dossier contient tous les assets du logo officiel de Wapify.

## 📁 Fichiers disponibles

### Composant React (pour le code)
- **`WapifyLogo.tsx`** - Composant React réutilisable
- **`index.ts`** - Fichier d'export

### Fichiers vectoriels
- **`wapify-logo.svg`** - Logo SVG brut

### Images PNG (icônes)

#### Avec fond dégradé :
- `wapify-logo-icon-small.png` (64x64) - Favicon
- `wapify-logo-icon-medium.png` (128x128) - Icône app mobile
- `wapify-logo-icon-large.png` (256x256) - Icône app desktop
- `wapify-logo-icon-xlarge.png` (512x512) - Haute résolution
- `wapify-logo-social-square.png` (1200x1200) - Photo de profil réseaux sociaux

#### Fond transparent :
- `wapify-logo-icon-small-transparent.png` (64x64)
- `wapify-logo-icon-medium-transparent.png` (128x128)
- `wapify-logo-icon-large-transparent.png` (256x256)
- `wapify-logo-icon-xlarge-transparent.png` (512x512)
- `wapify-logo-social-square-transparent.png` (1200x1200)

### Bannières réseaux sociaux
- `wapify-twitter-header.png` (1500x500) - En-tête Twitter/X
- `wapify-facebook-cover.png` (820x312) - Couverture Facebook
- `wapify-linkedin-banner.png` (1584x396) - Bannière LinkedIn
- `wapify-youtube-banner.png` (2560x1440) - Bannière YouTube

## 🎨 Utilisation du composant React

### Import

```tsx
import { WapifyLogo } from '@/logo'
```

### Exemples

#### Logo seul
```tsx
<WapifyLogo className="w-6 h-6" />
```

#### Logo avec texte
```tsx
<WapifyLogo withText={true} />
```

#### Logo avec texte personnalisé
```tsx
<WapifyLogo
  withText={true}
  textClassName="text-3xl font-bold text-wapify-text"
/>
```

#### Logo avec taille spécifique
```tsx
<WapifyLogo size={48} />
```

### Props

- `className?: string` - Classes CSS pour le SVG (par défaut: "w-6 h-6")
- `size?: number` - Taille en pixels (remplace width/height)
- `withText?: boolean` - Afficher le logo avec le texte "Wapify" (par défaut: false)
- `textClassName?: string` - Classes CSS pour le texte (par défaut: "text-2xl font-bold text-wapify-text")

## 🔧 Générer de nouvelles versions PNG

Si tu as besoin de régénérer les PNG ou créer de nouvelles tailles :

```bash
# Installer les dépendances
npm install canvas --save-dev

# Générer les icônes PNG
node logo/generate-png.js

# Générer les bannières réseaux sociaux
node logo/generate-social-banners.js
```

## 🎯 Guide d'utilisation par plateforme

### Réseaux sociaux
- **Photo de profil** : `wapify-logo-social-square.png` (1200x1200)
- **Twitter/X header** : `wapify-twitter-header.png`
- **Facebook cover** : `wapify-facebook-cover.png`
- **LinkedIn banner** : `wapify-linkedin-banner.png`
- **YouTube banner** : `wapify-youtube-banner.png`

### Applications
- **Favicon** : `wapify-logo-icon-small.png` (64x64)
- **App mobile** : `wapify-logo-icon-medium.png` (128x128)
- **App desktop** : `wapify-logo-icon-large.png` (256x256)
- **Haute résolution** : `wapify-logo-icon-xlarge.png` (512x512)

### Web et documents
- **SVG** : `wapify-logo.svg` (vectoriel, taille infinie)
- **Fond transparent** : Versions `-transparent.png`

## 🌈 Design du Logo

Le logo Wapify est un éclair (⚡) symbolisant :
- ⚡ **Rapidité** - Développement en quelques minutes
- 🚀 **Puissance** - IA de pointe (Claude Sonnet 4.5)
- ✨ **Innovation** - Technologie révolutionnaire

### Couleurs officielles
- **Accent** : `#6366f1` (Indigo)
- **Accent Dark** : `#4f46e5` (Indigo foncé)
- **Arrière-plan** : `#0f0f1a` (Noir bleuté)

Le logo utilise un dégradé de `wapify-accent` à `wapify-accent-dark` pour un effet moderne et dynamique.
