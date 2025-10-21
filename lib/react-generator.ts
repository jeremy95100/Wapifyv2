/**
 * Générateur de structure React multi-fichiers
 */

import { ProjectFile } from './storage'

/**
 * Tente de réparer un JSON tronqué
 */
function attemptJsonRepair(jsonText: string): string {
  let repaired = jsonText.trim()

  // Compter les accolades ouvertes et fermées
  const openBraces = (repaired.match(/\{/g) || []).length
  const closeBraces = (repaired.match(/\}/g) || []).length
  const openBrackets = (repaired.match(/\[/g) || []).length
  const closeBrackets = (repaired.match(/\]/g) || []).length

  console.log('🔧 JSON structure:', { openBraces, closeBraces, openBrackets, closeBrackets })

  // Si une chaîne est ouverte mais non fermée, la fermer
  // Chercher la dernière quote non échappée
  const lastQuoteIndex = repaired.lastIndexOf('"')
  const beforeLastQuote = repaired.substring(0, lastQuoteIndex)
  const afterLastQuote = repaired.substring(lastQuoteIndex + 1)

  // Compter les quotes non échappées avant la dernière
  const quotesBeforeLast = (beforeLastQuote.match(/(?<!\\)"/g) || []).length

  // Si nombre impair de quotes, il manque une quote de fermeture
  if (quotesBeforeLast % 2 === 0 && !afterLastQuote.includes('"')) {
    console.log('🔧 Adding missing closing quote')
    repaired += '"'
  }

  // Fermer les tableaux ouverts
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    console.log('🔧 Adding missing ]')
    repaired += ']'
  }

  // Fermer les objets ouverts
  for (let i = 0; i < openBraces - closeBraces; i++) {
    console.log('🔧 Adding missing }')
    repaired += '}'
  }

  return repaired
}

export interface ReactProjectStructure {
  files: ProjectFile[]
  hasDatabase: boolean
  databaseSchema?: string
}

/**
 * Générer la structure d'un projet React avec l'AI - EN 2 ÉTAPES
 * Nouvelle approche: 2 appels séparés pour éviter le timeout
 */
export async function generateReactProject(
  prompt: string,
  anthropic: any
): Promise<ReactProjectStructure> {
  console.log('🔄 Starting 2-step generation process...')

  // ÉTAPE 1: Structure de base + Config + Home (tokens réduits)
  console.log('📦 Step 1: Generating base structure + HomePage...')
  const step1Result = await generateReactProjectSingleCall(
    `${prompt}

⚠️ ÉTAPE 1/2 - GÉNÈRE UNIQUEMENT:
- Fichiers de configuration (package.json, vite, tailwind, postcss)
- index.html, src/main.jsx, src/index.css
- src/App.jsx avec React Router (avec 1-2 routes seulement pour HomePage)
- src/pages/HomePage.jsx COMPLÈTE et FONCTIONNELLE avec 4-6 items de données
- src/components/ui/*.jsx (Button, Card uniquement - composants UI de base)
- src/lib/utils.js (fonction cn())

NE GÉNÈRE PAS ENCORE les pages secondaires (Products, Cart, etc.) - elles seront générées en étape 2!`,
    anthropic,
    15000 // Tokens réduits pour étape 1
  )

  console.log(`✅ Step 1 complete: ${step1Result.files.length} files`)

  // ÉTAPE 2: Pages secondaires uniquement
  console.log('📦 Step 2: Generating secondary pages...')
  const step2Result = await generateReactProjectSingleCall(
    `${prompt}

⚠️ ÉTAPE 2/2 - GÉNÈRE UNIQUEMENT LES PAGES SECONDAIRES:
- src/pages/ProductsPage.jsx (ou équivalent selon le type d'app)
- src/pages/CartPage.jsx (si e-commerce)
- Composants UI supplémentaires si nécessaire
- 4-6 items de données pour ces pages

🚨 RÈGLES CRITIQUES POUR L'ÉTAPE 2:
1. NE CRÉE PAS de nouveaux Contexts (CartContext, AuthContext, etc.) - ils n'existeront pas!
2. Utilise UNIQUEMENT useState/useEffect locaux dans chaque page
3. Chaque page doit être 100% AUTONOME et ne dépendre d'AUCUN fichier externe sauf:
   - React Router (Link, useNavigate)
   - Composants UI de base (Button, Card)
   - lucide-react pour les icônes
4. Les données mockées doivent être DANS LA PAGE (const products = [...])
5. NE PAS importer de contexts, hooks customs, ou services qui n'existent pas

EXEMPLE CORRECT pour ProductsPage:
- const products = [...] // Données dans la page
- const [cart, setCart] = useState([]) // État local
- const addToCart = (item) => setCart([...cart, item]) // Fonction locale

EXEMPLE INTERDIT:
- import { useCart } from '../contexts/CartContext' // ❌ N'existe pas!
- import { useAuth } from '../hooks/useAuth' // ❌ N'existe pas!

NE RÉGÉNÈRE PAS les fichiers de config, App.jsx, HomePage, etc. - ils existent déjà!
Utilise les mêmes imports React Router, les mêmes composants UI que l'étape 1.`,
    anthropic,
    15000 // Tokens réduits pour étape 2
  )

  console.log(`✅ Step 2 complete: ${step2Result.files.length} files`)

  // Fusionner les résultats (étape 1 + étape 2)
  const mergedFiles = [...step1Result.files]

  // Ajouter les fichiers de l'étape 2 (en évitant les doublons)
  for (const file of step2Result.files) {
    const existingIndex = mergedFiles.findIndex(f => f.path === file.path)
    if (existingIndex === -1) {
      // Fichier n'existe pas, l'ajouter
      mergedFiles.push(file)
      console.log(`➕ Adding new file from step 2: ${file.path}`)
    } else {
      // Fichier existe déjà - garder celui de l'étape 1 (sauf pour App.jsx qu'on veut updater)
      if (file.path === 'src/App.jsx') {
        mergedFiles[existingIndex] = file // Remplacer App.jsx avec routes complètes
        console.log(`🔄 Updated App.jsx with routes from step 2`)
      } else {
        console.log(`⏭️  Skipping duplicate file: ${file.path}`)
      }
    }
  }

  console.log(`✅ Total files generated: ${mergedFiles.length}`)

  return {
    files: mergedFiles,
    hasDatabase: step1Result.hasDatabase || step2Result.hasDatabase,
    databaseSchema: step1Result.databaseSchema || step2Result.databaseSchema
  }
}

/**
 * Fonction originale renommée - fait un seul appel à Claude
 */
async function generateReactProjectSingleCall(
  prompt: string,
  anthropic: any,
  maxTokens: number = 25000
): Promise<ReactProjectStructure> {

  const systemPrompt = `Tu es un expert développeur React pour WAPIFY, une plateforme no-code pour utilisateurs NON-TECHNIQUES.

🎯 MISSION WAPIFY:
Tu crées des applications React COMPLÈTES, FONCTIONNELLES et VISUELLEMENT IMPRESSIONNANTES pour des utilisateurs qui ne connaissent RIEN au code.
L'application sera compilée avec Vite Build Server (npm install + vite build) donc TOUTES les dépendances npm sont supportées.

📦 BIBLIOTHÈQUES DISPONIBLES:
✅ TU PEUX UTILISER TOUTES LES BIBLIOTHÈQUES NPM POPULAIRES:
  - React 18.3+ avec tous les hooks
  - React Router DOM pour la navigation
  - Tailwind CSS (configuré via PostCSS, pas CDN)

📱 UI & COMPOSANTS:
  - lucide-react, react-icons, @heroicons/react pour les icônes
  - @radix-ui/react-* (dialog, dropdown, select, etc.) - primitives UI accessibles
  - framer-motion pour animations sophistiquées
  - react-hot-toast, sonner pour notifications toast
  - vaul pour drawer mobile
  - cmdk pour command palette (⌘K)

📊 DATA & VISUALISATION:
  - recharts, tremor pour dashboards et graphiques
  - @tanstack/react-table pour tables avancées
  - react-virtualized, @tanstack/react-virtual pour infinite scroll

📝 FORMULAIRES & VALIDATION:
  - react-hook-form (recommandé) ou formik
  - zod, yup pour validation schemas

🔄 STATE & DATA FETCHING:
  - zustand, jotai pour state management
  - @tanstack/react-query pour data fetching et cache

📅 DATES & UTILITAIRES:
  - date-fns, dayjs pour manipulation de dates
  - clsx, tailwind-merge, cn pour classes CSS
  - axios, ky pour requêtes HTTP

🎨 AUTRES:
  - react-dropzone pour upload fichiers
  - react-dnd pour drag & drop
  - Et toute autre bibliothèque npm pertinente!

🎨 STYLING ULTRA-MODERNE (shadcn/ui style):
  - Tailwind CSS avec variables CSS personnalisées (--background, --foreground, --primary, etc.)
  - Design system shadcn/ui: utilise bg-background, text-foreground, border-border, etc.
  - Dark mode natif supporté (.dark class)
  - Composants UI réutilisables (Button, Card, Dialog, Input, etc.)
  - Animations sophistiquées avec Framer Motion ou Tailwind
  - Classes utilitaires: cn() pour merge de classes conditionnelles

EXEMPLE:
  // src/index.css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

📅 MANIPULATION DE DATES:
  - Utilise date-fns ou dayjs (recommandé)
  - Format: formatRelative(), formatDistance(), etc.

EXEMPLE:
  import { format, formatDistance } from 'date-fns'
  import { fr } from 'date-fns/locale'

  const formatted = format(new Date(), 'PPP', { locale: fr })
  const timeAgo = formatDistance(date, new Date(), { addSuffix: true, locale: fr })

🔧 STRUCTURE DE PROJET MODERNE:
- src/App.tsx (composant principal avec routing)
- src/main.tsx (point d'entrée React)
- src/index.css (Tailwind + CSS variables + styles globaux)
- src/components/ui/*.tsx (composants UI primitifs: Button, Card, Dialog, Input, etc.)
- src/components/*.tsx (composants métier réutilisables)
- src/hooks/*.ts (custom hooks)
- src/lib/utils.ts (fonction cn() et utilitaires)
- src/lib/*.ts (clients API, services)
- src/pages/*.tsx (pages pour routing)
- src/contexts/*.tsx (React Context pour state global)
- src/types/*.ts (TypeScript types/interfaces)
- public/* (assets statiques)
- index.html (HTML de base)
- package.json (TOUTES les dépendances + devDependencies)
- vite.config.ts (configuration Vite + React + path aliases)
- tailwind.config.js (config Tailwind avec shadcn/ui variables)
- postcss.config.js (PostCSS pour Tailwind)
- tsconfig.json (TypeScript config)
- database/schema.sql (UNIQUEMENT si DB demandée)

⚠️ FICHIERS OBLIGATOIRES À GÉNÉRER:
- vite.config.js (OBLIGATOIRE pour Vite Build)
- tailwind.config.js (OBLIGATOIRE - utilise le template EXACT ci-dessous)
- postcss.config.js (OBLIGATOIRE pour Tailwind)
- src/index.css avec directives @tailwind (OBLIGATOIRE - utilise le template EXACT ci-dessous)

📋 TEMPLATE OBLIGATOIRE tailwind.config.js (COPIER EXACTEMENT):
\`\`\`js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
\`\`\`

📋 TEMPLATE OBLIGATOIRE src/index.css (COPIER EXACTEMENT):
\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  body {
    @apply bg-background text-foreground;
  }
}
\`\`\`

⚠️ CRITIQUE: TU DOIS utiliser ces templates EXACTEMENT! Ne change PAS les variables CSS!

💎 EXIGENCES QUALITÉ (GÉNÉRATION EN 2 ÉTAPES):
1. Application COMPLÈTE et FONCTIONNELLE (ZÉRO placeholders ou TODOs)
2. 6-8 items de données mockées par page (qualité > quantité)
3. TOTAL: 3-4 pages (Home + 2-3 pages secondaires selon prompt)
4. TOUS les boutons fonctionnels avec feedback visuel immédiat
5. Animations simples mais efficaces (hover states, transitions basiques)
6. Design system cohérent (espacements, couleurs, typographie)
7. Responsive mobile-first (testable sur iPhone/Android)
8. Loading states simples (spinner ou texte, PAS de skeletons complexes)
9. Toast notifications pour actions importantes (react-hot-toast simple)
10. Formulaires avec validation basique (required, pattern)
11. Accessibility de base (aria-labels essentiels, semantic HTML)
12. Code propre, bien organisé, commenté en français
13. ⚠️ PAS DE: Wishlist avancées, Reviews/Ratings complexes, User Profiles détaillés, Advanced Filters
14. ⚠️ FOCUS: Fonctionnalités CORE - Chaque page doit être COMPLÈTE

🗃️ BASE DE DONNÉES:
- Si la demande nécessite une base de données → génère database/schema.sql
- Utilise des données mockées pour la preview (useState pour le CRUD)
- La vraie DB Neon sera connectée lors du déploiement final
- Tu PEUX générer src/lib/db.js avec client PostgreSQL si nécessaire

⚠️ SCHÉMA SQL POUR NEON POSTGRESQL (CRITIQUE):
- NE PAS utiliser le schéma "auth" (n'existe pas dans Neon)
- Utiliser UNIQUEMENT le schéma "public" par défaut
- NE PAS créer de tables auth.users (créer public.users à la place)
- NE PAS utiliser les extensions Supabase (pgjwt, etc.)
- NE PAS utiliser Row Level Security (RLS) ni CREATE POLICY
- Utiliser PostgreSQL standard uniquement (CREATE TABLE, CREATE INDEX, etc.)

✅ STACK TECHNIQUE:
1. TypeScript par défaut (.tsx, .ts) pour excellente DX et type safety
2. ESLint configuré pour React + TypeScript
3. Path aliases (@/components, @/lib, @/hooks, etc.)
4. import.meta.env.VITE_* pour variables d'environnement
5. Génère TOUJOURS: vite.config.ts, tailwind.config.js, postcss.config.js, tsconfig.json
6. Utilise @tailwind directives dans src/index.css
7. TOUTES les dépendances npm dans package.json (avec versions compatibles)

⚠️ CONFIGURATION TYPESCRIPT (tsconfig.json):
- Set "noUnusedLocals": false (to avoid unused variable errors)
- Set "noUnusedParameters": false
- Set "strict": false (for easier builds)
- Include React types and DOM types
- Allow JSX

⚠️ PACKAGE.JSON BUILD SCRIPT (CRITIQUE):
- ❌ NE JAMAIS utiliser "build": "tsc && vite build"
- ✅ TOUJOURS utiliser "build": "vite build" UNIQUEMENT
- Raison: tsc bloque le build sur des erreurs TypeScript mineures (unused imports, etc.)
- Vite fait déjà la vérification TypeScript nécessaire pendant le build

⚠️ RÈGLES JSX CRITIQUES (OBLIGATOIRE):
1. ❌ NE JAMAIS utiliser de SVG inline en data URL dans className
   Exemple INTERDIT: className="bg-[url('data:image/svg+xml,...')]"
2. ✅ Pour les backgrounds patterns: utilise des gradients CSS ou Tailwind patterns
3. ✅ Si SVG nécessaire: créer un fichier .svg séparé dans public/patterns/
4. ❌ NE JAMAIS mettre de guillemets doubles imbriqués dans className
5. ✅ Utilise des background gradients Tailwind: bg-gradient-to-br, from-blue-500, etc.

🚨 RÈGLE CRITIQUE - COHÉRENCE IMPORTS/FICHIERS (OBLIGATOIRE):
CHAQUE import dans un fichier DOIT avoir son fichier correspondant dans le JSON!

❌ INTERDIT - Import sans fichier:
App.tsx: import HomePage from './pages/HomePage'
→ Mais PAS de fichier src/pages/HomePage.tsx dans le JSON

✅ CORRECT - Import avec fichier:
App.tsx: import HomePage from './pages/HomePage'
→ JSON DOIT contenir: { "path": "src/pages/HomePage.tsx", "content": "...", "type": "component" }

🔥 VÉRIFICATIONS OBLIGATOIRES AVANT DE RÉPONDRE:

1. COHÉRENCE IMPORTS/FICHIERS:
   - Liste TOUS les imports dans TOUS les fichiers
   - Pour CHAQUE import, vérifie qu'il existe dans le JSON
   - Si un import manque → GÉNÈRE le fichier correspondant
   - Utilise TOUJOURS l'extension .tsx pour les composants React

2. PAGES FONCTIONNELLES (CRITIQUE):
   - Pour CHAQUE page générée (Home, Products, Cart, etc.):
     * Vérifie que la page a du CONTENU RÉEL (pas juste un titre)
     * Vérifie que les données sont affichées (produits, infos, etc.)
     * Vérifie que la navigation fonctionne (liens React Router)
   - ❌ INTERDIT: Page vide ou "Coming soon" ou "Work in progress"
   - ✅ OBLIGATOIRE: Chaque page doit être COMPLÈTE et FONCTIONNELLE

3. BOUTONS FONCTIONNELS (CRITIQUE):
   - Pour CHAQUE bouton dans l'interface:
     * Vérifie qu'il a un onClick avec logique RÉELLE
     * Vérifie que la fonction existe et fait quelque chose
   - ❌ INTERDIT: <button>Ajouter au panier</button> (sans onClick)
   - ❌ INTERDIT: onClick={() => {}} (fonction vide)
   - ✅ OBLIGATOIRE: onClick={() => addToCart(product)} (action réelle)

4. NAVIGATION (CRITIQUE):
   - TOUS les liens de navigation DOIVENT être des <Link> de React Router
   - ❌ INTERDIT: <div onClick={() => navigate('/about')}>About</div>
   - ❌ INTERDIT: <span onClick={handleClick}>Contact</span>
   - ❌ INTERDIT: <button onClick={() => router.push('/page')}>Page</button>
   - ✅ OBLIGATOIRE: <Link to="/about">About</Link>
   - ✅ OBLIGATOIRE: import { Link } from 'react-router-dom'
   - Vérifie que chaque <Link to="..."> a sa route correspondante dans <Routes>
   - Vérifie que chaque page est accessible et complète

EXEMPLES:
- INTERDIT: Page vide ou placeholder text
- INTERDIT: Bouton sans onClick handler
- INTERDIT: Navigation avec div/span onClick au lieu de Link
- OBLIGATOIRE: Page avec données et composants fonctionnels
- OBLIGATOIRE: Bouton avec onClick qui appelle fonction réelle
- OBLIGATOIRE: Navigation avec Link React Router uniquement

Format de réponse JSON:
{
  "files": [
    {
      "path": "src/App.jsx",
      "content": "// contenu du fichier",
      "type": "component"
    },
    {
      "path": "src/main.jsx",
      "content": "// contenu",
      "type": "other"
    },
    {
      "path": "src/components/Button.jsx",
      "content": "// contenu",
      "type": "component"
    },
    {
      "path": "src/hooks/useData.js",
      "content": "// contenu",
      "type": "hook"
    },
    {
      "path": "src/styles/App.css",
      "content": "// contenu",
      "type": "style"
    }
    // ... autres fichiers
  ],
  "hasDatabase": true/false,
  "databaseSchema": "CREATE TABLE ... (si hasDatabase=true)"
}

TYPES DE FICHIERS:
- "component": Fichiers dans src/components/ ou src/App.jsx, src/pages/
- "hook": Fichiers dans src/hooks/
- "style": Fichiers .css, .scss
- "config": package.json, vite.config.js, etc.
- "other": Tous les autres fichiers

Génère une application React complète et professionnelle.`

  const userPrompt = `Génère une application React complète pour: ${prompt}

Réponds UNIQUEMENT avec un JSON valide contenant tous les fichiers nécessaires.`

  try {
    console.log('🤖 Calling AI to generate React project...')
    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens, // Paramétrable selon l'étape (15k pour step1/step2)
      temperature: 0.7,
      stream: true, // Activer le streaming pour éviter le timeout de 10 minutes
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })

    // Collecter la réponse depuis le stream
    let response = ''
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        response += event.delta.text
      }
    }

    console.log('📝 AI Response length:', response.length, 'characters')
    console.log('📝 First 500 chars:', response.substring(0, 500))

    // Extraire le JSON de la réponse
    // Chercher les blocs ```json first
    let jsonText = ''
    const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1]
      console.log('📦 Found JSON in code block')
    } else {
      // Sinon chercher un objet JSON brut
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('❌ No JSON found in AI response')
        console.error('Full response:', response)
        throw new Error('No valid JSON found in response')
      }
      jsonText = jsonMatch[0]
      console.log('📦 Found JSON in raw response')
    }

    console.log('📦 Parsing JSON... (length:', jsonText.length, 'chars)')
    let result
    try {
      result = JSON.parse(jsonText)
      console.log('✅ JSON parsed successfully')
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError)
      console.error('JSON text length:', jsonText.length)
      console.error('Last 200 chars:', jsonText.substring(jsonText.length - 200))

      // Tentative de réparation du JSON tronqué
      console.log('🔧 Attempting to repair truncated JSON...')
      const repairedJson = attemptJsonRepair(jsonText)
      try {
        result = JSON.parse(repairedJson)
        console.log('✅ Repaired JSON parsed successfully!')
      } catch (repairError) {
        console.error('❌ Failed to repair JSON:', repairError)
        throw new Error(`Failed to parse AI response as JSON: ${parseError}`)
      }
    }

    console.log('📁 Files count:', result.files?.length || 0)
    console.log('🗄️ Has database:', result.hasDatabase)

    // Ajouter les fichiers de configuration par défaut s'ils manquent
    const structure = ensureCompleteStructure(result, prompt)

    return structure
  } catch (error) {
    console.error('❌ Error generating React project:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    // Log détaillé de l'erreur pour debugging
    console.error('🔍 DETAILED ERROR ANALYSIS:')
    console.error('- Prompt:', prompt)
    console.error('- Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('- Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))

    // ⚠️ IMPORTANT: Ne PAS utiliser le fallback silencieusement
    // Throw l'erreur pour qu'elle soit visible dans les logs Vercel
    throw new Error(`Failed to generate React project: ${error instanceof Error ? error.message : 'Unknown error'}`)

    // Fallback désactivé temporairement pour voir l'erreur réelle
    // console.log('⚠️ Using fallback structure')
    // return generateFallbackStructure(prompt)
  }
}

/**
 * Détecte automatiquement le type d'un fichier basé sur son chemin
 */
function detectFileType(path: string): string {
  // Composants
  if (path.includes('/components/') ||
      path.includes('/pages/') ||
      path.match(/src\/App\.(jsx?|tsx?)$/)) {
    return 'component'
  }

  // Hooks
  if (path.includes('/hooks/') || path.match(/use[A-Z]\w+\.(js|ts)$/)) {
    return 'hook'
  }

  // Styles
  if (path.match(/\.(css|scss|sass|less)$/)) {
    return 'style'
  }

  // Config
  if (path.match(/(package\.json|vite\.config|tsconfig|\.eslintrc|\.prettierrc)/)) {
    return 'config'
  }

  // Autres
  return 'other'
}

/**
 * Nettoyer les imports Tailwind dans les fichiers CSS
 */
function cleanTailwindImports(content: string): string {
  let cleaned = content

  // Supprimer les imports Tailwind (format @import)
  cleaned = cleaned.replace(/@import\s+['"]tailwindcss\/base['"];?/g, '')
  cleaned = cleaned.replace(/@import\s+['"]tailwindcss\/components['"];?/g, '')
  cleaned = cleaned.replace(/@import\s+['"]tailwindcss\/utilities['"];?/g, '')
  cleaned = cleaned.replace(/@import\s+['"]tailwindcss['"];?/g, '')

  // Nettoyer les lignes vides multiples
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n')

  return cleaned.trim()
}

/**
 * S'assurer que la structure est complète avec tous les fichiers nécessaires
 */
function ensureCompleteStructure(
  result: any,
  prompt: string
): ReactProjectStructure {
  const files: ProjectFile[] = result.files || []

  // Ajouter automatiquement le type si manquant et nettoyer les CSS
  files.forEach(file => {
    if (!file.type) {
      file.type = detectFileType(file.path)
    }

    // Nettoyer les imports Tailwind dans les fichiers CSS
    if (file.path.match(/\.(css|scss|sass)$/)) {
      const originalLength = file.content.length
      file.content = cleanTailwindImports(file.content)

      // 🔧 POST-PROCESSING: Supprimer @apply border-border qui cause des erreurs
      if (file.content.includes('@apply border-border')) {
        console.log(`🔧 Removing problematic @apply border-border from ${file.path}`)
        // Supprimer la ligne entière contenant @apply border-border
        file.content = file.content.replace(/^\s*\*\s*\{\s*@apply\s+border-border;\s*\}\s*$/gm, '')
        // Supprimer aussi les variations
        file.content = file.content.replace(/@apply\s+border-border;?/g, '')
      }

      if (file.content.length !== originalLength) {
        console.log(`🧹 Cleaned CSS in ${file.path}`)
      }
    }
  })

  // Vérifier si index.html existe
  if (!files.find(f => f.path === 'index.html')) {
    files.push({
      path: 'index.html',
      content: generateIndexHTML(prompt),
      type: 'other'
    })
  }

  // Vérifier si package.json existe
  if (!files.find(f => f.path === 'package.json')) {
    files.push({
      path: 'package.json',
      content: generatePackageJSON(prompt, result.hasDatabase),
      type: 'config'
    })
  }

  // Ajouter vite.config.js (OBLIGATOIRE pour Vite Build)
  if (!files.find(f => f.path === 'vite.config.js')) {
    files.push({
      path: 'vite.config.js',
      content: generateViteConfig(),
      type: 'config'
    })
  }

  // Ajouter tailwind.config.js (OBLIGATOIRE pour Tailwind)
  if (!files.find(f => f.path === 'tailwind.config.js')) {
    files.push({
      path: 'tailwind.config.js',
      content: generateTailwindConfig(),
      type: 'config'
    })
  }

  // Ajouter postcss.config.js (OBLIGATOIRE pour Tailwind)
  if (!files.find(f => f.path === 'postcss.config.js')) {
    files.push({
      path: 'postcss.config.js',
      content: generatePostCSSConfig(),
      type: 'config'
    })
  }

  // Ajouter src/index.css (OBLIGATOIRE pour Tailwind)
  if (!files.find(f => f.path === 'src/index.css')) {
    files.push({
      path: 'src/index.css',
      content: generateIndexCSS(),
      type: 'style'
    })
  }

  // Vérifier que src/main.jsx importe index.css
  const mainFile = files.find(f => f.path === 'src/main.jsx' || f.path === 'src/main.js')
  if (mainFile && !mainFile.content.includes("index.css")) {
    console.log('⚠️ Adding index.css import to main.jsx')
    mainFile.content = `import './index.css'\n${mainFile.content}`
  }

  return {
    files,
    hasDatabase: result.hasDatabase || false,
    databaseSchema: result.databaseSchema
  }
}

/**
 * Générer un index.html de base pour Vite Build
 */
function generateIndexHTML(appName: string): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
}

/**
 * Générer package.json pour Vite Build
 */
function generatePackageJSON(appName: string, hasDatabase: boolean): string {
  const dependencies: Record<string, string> = {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.21.0",
    "lucide-react": "^0.263.1"
  }

  const devDependencies: Record<string, string> = {
    "@types/node": "^20.10.0",
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.12",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16"
  }

  return JSON.stringify({
    name: appName.toLowerCase().replace(/\s+/g, '-'),
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies,
    devDependencies
  }, null, 2)
}

/**
 * Générer vite.config.js
 */
function generateViteConfig(): string {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: './', // IMPORTANT: Use relative paths for deployments
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})`
}

/**
 * Générer tailwind.config.js
 */
function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}`
}

/**
 * Générer postcss.config.js
 */
function generatePostCSSConfig(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
}

/**
 * Générer src/index.css avec directives Tailwind
 */
function generateIndexCSS(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  body {
    @apply bg-background text-foreground;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

* {
  box-sizing: border-box;
}`
}

/**
 * Générer le client Supabase
 * Note: Les variables d'environnement seront injectées par Wapify lors du déploiement
 */
function generateSupabaseClient(): string {
  return `import { createClient } from '@supabase/supabase-js'

// Variables mockées pour la preview Sandpack
// Wapify injectera les vraies valeurs lors du déploiement
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://mock.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'mock-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Pour la preview, le supabase client retournera toujours des erreurs
// Les hooks doivent utiliser des données mockées en fallback
console.log('📦 Supabase client initialisé (mode mock pour preview)')
`
}

/**
 * Structure de fallback en cas d'erreur - Génère une vraie app basique
 */
function generateFallbackStructure(prompt: string): ReactProjectStructure {
  // Analyser le prompt pour créer une app basique appropriée
  const lowerPrompt = prompt.toLowerCase()
  const isTodo = lowerPrompt.includes('todo') || lowerPrompt.includes('tâche') || lowerPrompt.includes('task')
  const isTimer = lowerPrompt.includes('chrono') || lowerPrompt.includes('timer') || lowerPrompt.includes('minuteur')
  const isAlarm = lowerPrompt.includes('alarm') || lowerPrompt.includes('réveil')

  let appContent = `import React, { useState } from 'react'

export default function App() {
  const [activeTab, setActiveTab] = useState('todo')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <h1 className="text-4xl font-bold mb-2">${prompt}</h1>
            <p className="text-purple-100">Application générée automatiquement</p>
          </div>

          {/* Navigation */}
          <div className="flex border-b">
            ${isTodo ? `<button
              onClick={() => setActiveTab('todo')}
              className={\`flex-1 py-4 px-6 font-semibold transition \${
                activeTab === 'todo'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }\`}
            >
              📝 Todo List
            </button>` : ''}
            ${isTimer ? `<button
              onClick={() => setActiveTab('timer')}
              className={\`flex-1 py-4 px-6 font-semibold transition \${
                activeTab === 'timer'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }\`}
            >
              ⏱️ Chronomètre
            </button>` : ''}
            ${isAlarm ? `<button
              onClick={() => setActiveTab('alarm')}
              className={\`flex-1 py-4 px-6 font-semibold transition \${
                activeTab === 'alarm'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }\`}
            >
              ⏰ Alarmes
            </button>` : ''}
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'todo' && <TodoList />}
            {activeTab === 'timer' && <Timer />}
            {activeTab === 'alarm' && <AlarmList />}
          </div>
        </div>
      </div>
    </div>
  )
}

function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Exemple de tâche', done: false },
    { id: 2, text: 'Cliquez pour marquer comme fait', done: false }
  ])
  const [input, setInput] = useState('')

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, done: false }])
      setInput('')
    }
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id))
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Ajouter une tâche..."
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
        />
        <button
          onClick={addTodo}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
        >
          Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {todos.map(todo => (
          <div
            key={todo.id}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
              className="w-5 h-5"
            />
            <span className={\`flex-1 \${todo.done ? 'line-through text-gray-400' : 'text-gray-800'}\`}>
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Timer() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  React.useEffect(() => {
    let interval = null
    if (running) {
      interval = setInterval(() => {
        setSeconds(s => s + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [running])

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`
  }

  return (
    <div className="text-center">
      <div className="text-7xl font-bold text-purple-600 mb-8 font-mono">
        {formatTime(seconds)}
      </div>
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => setRunning(!running)}
          className={\`px-8 py-4 rounded-lg font-bold text-lg transition \${
            running
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }\`}
        >
          {running ? '⏸️ Pause' : '▶️ Start'}
        </button>
        <button
          onClick={() => { setSeconds(0); setRunning(false) }}
          className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold text-lg transition"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  )
}

function AlarmList() {
  const [alarms, setAlarms] = useState([
    { id: 1, time: '07:00', label: 'Réveil matin', active: true },
    { id: 2, time: '12:30', label: 'Pause déjeuner', active: false }
  ])

  const toggleAlarm = (id) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, active: !a.active } : a))
  }

  return (
    <div className="space-y-4">
      {alarms.map(alarm => (
        <div
          key={alarm.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex-1">
            <div className="text-3xl font-bold text-gray-800">{alarm.time}</div>
            <div className="text-gray-600">{alarm.label}</div>
          </div>
          <button
            onClick={() => toggleAlarm(alarm.id)}
            className={\`px-6 py-2 rounded-lg font-semibold transition \${
              alarm.active
                ? 'bg-green-600 text-white'
                : 'bg-gray-300 text-gray-600'
            }\`}
          >
            {alarm.active ? 'ON' : 'OFF'}
          </button>
        </div>
      ))}
    </div>
  )
}`

  return {
    files: [
      {
        path: 'index.html',
        content: generateIndexHTML(prompt),
        type: 'other'
      },
      {
        path: 'src/main.jsx',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,
        type: 'other'
      },
      {
        path: 'src/App.jsx',
        content: appContent,
        type: 'component'
      },
      {
        path: 'src/styles/App.css',
        content: `/* Styles globaux */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
        type: 'style'
      },
      {
        path: 'package.json',
        content: generatePackageJSON(prompt, false),
        type: 'config'
      },
      {
        path: 'vite.config.js',
        content: generateViteConfig(),
        type: 'config'
      }
    ],
    hasDatabase: false
  }
}
