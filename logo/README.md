# Wapify Logo

Ce dossier contient le logo officiel de Wapify sous forme de composant React réutilisable.

## Utilisation

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

## Props

- `className?: string` - Classes CSS pour le SVG (par défaut: "w-6 h-6")
- `size?: number` - Taille en pixels (remplace width/height)
- `withText?: boolean` - Afficher le logo avec le texte "Wapify" (par défaut: false)
- `textClassName?: string` - Classes CSS pour le texte (par défaut: "text-2xl font-bold text-wapify-text")

## Design du Logo

Le logo Wapify est un éclair (⚡) symbolisant :
- La rapidité de développement
- La puissance de l'IA
- L'énergie et l'innovation

Le logo utilise un dégradé de `wapify-accent` à `wapify-accent-dark` pour un effet moderne et dynamique.
