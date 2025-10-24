/**
 * Générateur de structure React multi-fichiers
 * NOUVELLE APPROCHE : Plan → Base → Pages (avec mémoire conversationnelle)
 */

import { ProjectFile } from './storage'

/**
 * Interface pour le plan de projet
 */
interface ProjectPlan {
  siteName: string
  techStack: {
    fileExtension: 'tsx' | 'jsx'
    libraries: string[]
    hasDatabase: boolean
  }
  pages: Array<{
    name: string
    path: string
    description: string
    features: string[]
    dataNeeded: string[]
    stateNeeded?: string[]
  }>
  components: {
    ui: string[]
    business: string[]
  }
  routing: {
    routes: Array<{
      path: string
      component: string
    }>
  }
  databaseSchema?: string
}

export interface ReactProjectStructure {
  files: ProjectFile[]
  hasDatabase: boolean
  databaseSchema?: string
}

/**
 * Message dans l'historique de conversation
 */
interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Extraire le JSON d'une réponse AI
 */
function extractJSON(text: string): string {
  // Chercher les blocs ```json first
  const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1]
  }

  // Sinon chercher un objet JSON brut
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response')
  }

  return jsonMatch[0]
}

/**
 * Tente de réparer un JSON tronqué ou mal échappé
 */
function attemptJsonRepair(jsonText: string): string {
  let repaired = jsonText.trim()

  console.log('🔧 Starting JSON repair...')
  console.log('📏 Original length:', repaired.length)

  // 1. Détecter les strings non fermées (cause #1 des erreurs)
  // Chercher les patterns comme: "content": "...texte sans guillemet de fermeture
  const unteriminatedStringMatch = repaired.match(/"content"\s*:\s*"[^"]*$/m)
  if (unteriminatedStringMatch) {
    console.log('🔧 Detected unterminated string, attempting to close it')
    // Ajouter un guillemet de fermeture et continuer
    repaired += '"'
  }

  // 2. Vérifier l'équilibre des accolades et crochets
  const openBraces = (repaired.match(/\{/g) || []).length
  const closeBraces = (repaired.match(/\}/g) || []).length
  const openBrackets = (repaired.match(/\[/g) || []).length
  const closeBrackets = (repaired.match(/\]/g) || []).length

  console.log('🔧 JSON structure:', { openBraces, closeBraces, openBrackets, closeBrackets })

  // 3. Fermer les tableaux ouverts
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    console.log('🔧 Adding missing ]')
    repaired += ']'
  }

  // 4. Fermer les objets ouverts
  for (let i = 0; i < openBraces - closeBraces; i++) {
    console.log('🔧 Adding missing }')
    repaired += '}'
  }

  // 5. Si le JSON se termine par une virgule suivie d'une accolade, c'est probablement tronqué
  if (repaired.match(/,\s*$/)) {
    console.log('🔧 Removing trailing comma')
    repaired = repaired.replace(/,\s*$/, '')
  }

  console.log('✅ Repair complete, new length:', repaired.length)

  return repaired
}

/**
 * ANCIENNES FONCTIONS (2 ÉTAPES) - NON UTILISÉES
 * Conservées pour référence ou rollback si nécessaire
 */

/**
 * Prompt système pour la génération du plan
 */
const PLAN_SYSTEM_PROMPT = `Tu es un expert architecte logiciel pour WAPIFY.

Ta mission : Analyser un prompt utilisateur et créer un PLAN DÉTAILLÉ pour une application React.

Le plan doit être un JSON structuré avec :

1. INFORMATIONS GÉNÉRALES :
   - siteName : nom de l'application
   - techStack : technologie (TypeScript recommandé, libraries npm, base de données oui/non)

2. PAGES :
   - Liste complète des pages nécessaires (3-4 pages max)
   - Pour chaque page : name, path, description, features, données nécessaires, state management

3. COMPOSANTS :
   - ui : Liste des composants UI réutilisables (Button, Card, Input, Badge, etc.)
   - business : Composants métier (Header, Footer, ProductCard, etc.)

4. ROUTING :
   - routes : Liste complète des routes React Router

5. BASE DE DONNÉES (si nécessaire) :
   - databaseSchema : Schéma SQL PostgreSQL (Neon) si applicable

RÈGLES IMPORTANTES :
- Maximum 4 pages (Home + 2-3 secondaires)
- Composants UI : EXACTEMENT Button, Card, Input (RIEN D'AUTRE!)
  ⚠️ NE PAS ajouter Badge, Select, Dialog, etc. - utiliser HTML+Tailwind à la place
- Composants business : UNIQUEMENT Header et Footer (RIEN D'AUTRE!)
  ⚠️ NE PAS ajouter ProductCard, Newsletter, etc. - créer inline dans les pages
- TypeScript (.tsx) par défaut sauf si prompt suggère JavaScript
- Données mockées : 6-8 items minimum par page
- Pas de features avancées (auth complexe, paiement réel, etc.)

FORMAT DE RÉPONSE (JSON uniquement) :
{
  "siteName": "Nom de l'app",
  "techStack": {
    "fileExtension": "tsx",
    "libraries": ["react-router-dom", "lucide-react", "framer-motion", "react-hot-toast"],
    "hasDatabase": false
  },
  "pages": [
    {
      "name": "HomePage",
      "path": "/",
      "description": "Page d'accueil avec hero et produits vedettes",
      "features": ["hero section", "featured products grid", "collections showcase"],
      "dataNeeded": ["6 featured products", "4 collections"],
      "stateNeeded": ["favorites (local useState)", "cart (local useState)"]
    }
  ],
  "components": {
    "ui": ["Button", "Card", "Input", "Badge"],
    "business": ["Header", "Footer", "ProductCard"]
  },
  "routing": {
    "routes": [
      {"path": "/", "component": "HomePage"},
      {"path": "/products", "component": "ProductsPage"}
    ]
  },
  "databaseSchema": "-- SQL if needed"
}

Réponds UNIQUEMENT avec le JSON, rien d'autre.`

/**
 * ÉTAPE 0 : Générer le plan du projet
 */
async function generateProjectPlan(
  prompt: string,
  anthropic: any,
  conversationHistory: ConversationMessage[]
): Promise<ProjectPlan> {
  console.log('📋 Generating project plan...')

  const userMessage = `Analyse ce prompt utilisateur et crée un plan JSON détaillé pour une application React complète :

"${prompt}"

Réponds UNIQUEMENT avec le JSON du plan, rien d'autre.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    temperature: 0.7,
    system: PLAN_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userMessage
      }
    ]
  })

  const responseText = response.content[0].text
  console.log('📝 Plan response length:', responseText.length, 'characters')

  let plan: ProjectPlan
  try {
    const jsonText = extractJSON(responseText)
    plan = JSON.parse(jsonText)
  } catch (error) {
    console.error('❌ Failed to parse plan JSON:', error)
    throw new Error('Failed to generate valid project plan')
  }

  console.log('✅ Plan generated:', plan.siteName)
  console.log('   - Pages:', plan.pages.length)
  console.log('   - UI Components:', plan.components.ui.join(', '))
  console.log('   - Tech:', plan.techStack.fileExtension)

  // Ajouter à l'historique de conversation
  conversationHistory.push({
    role: 'user',
    content: userMessage
  })
  conversationHistory.push({
    role: 'assistant',
    content: `Voici le plan détaillé du projet :\n\n${JSON.stringify(plan, null, 2)}`
  })

  return plan
}

/**
 * Prompt système pour la génération complète du projet
 */
const COMPLETE_SYSTEM_PROMPT = `Tu es un expert développeur React pour WAPIFY.

Tu vas générer UN PROJET REACT COMPLET en suivant un PLAN précis.

Tu DOIS générer TOUS LES FICHIERS en UNE SEULE RÉPONSE :
1. Fichiers de configuration (package.json, vite.config, tailwind.config, postcss.config, tsconfig si TypeScript)
2. TOUS les composants UI (Button, Card, Input avec NAMED EXPORTS)
3. App.tsx avec React Router et imports corrects des pages
4. Composants business (Header, Footer avec DEFAULT EXPORTS)
5. TOUTES les pages du projet (src/pages/*.tsx)
6. Fichiers utils et CSS

RÈGLES CRITIQUES :
- Génère TOUT en une seule réponse JSON
- Suis le plan À LA LETTRE
- Utilise l'extension de fichier spécifiée (.tsx ou .jsx)
- App.tsx doit importer les vraies pages depuis src/pages/
- Composants UI : NAMED EXPORTS (export { Button })
- Header/Footer : DEFAULT EXPORTS (export default Header)
- Pages : DEFAULT EXPORTS (export default HomePage)
- Tailwind CSS avec design system shadcn/ui
- Pas de placeholders ou TODOs

⚠️ RÈGLES TYPESCRIPT/JAVASCRIPT STRICTES (TRÈS IMPORTANT) :
- Assure-toi que TOUS les noms de propriétés sont utilisés de manière COHÉRENTE
- Si tu définis const settings = { activeSessions: 3 }, utilise TOUJOURS settings.activeSessions (PAS activeSession)
- Vérifie qu'il n'y a AUCUNE faute de frappe dans les noms de variables/propriétés
- Le code DOIT compiler sans erreur TypeScript (si .tsx)
- Double-vérifie la cohérence des noms avant de générer le JSON

FORMAT DE RÉPONSE (JSON uniquement) :
{
  "files": [
    {
      "path": "package.json",
      "content": "...",
      "type": "config"
    },
    {
      "path": "src/pages/HomePage.tsx",
      "content": "...",
      "type": "component"
    }
  ]
}

⚠️ RÈGLES JSON STRICTES (TRÈS IMPORTANT) :
CHAQUE guillemet, backslash et retour à la ligne dans le code DOIT être échappé !

Exemples d'échappement CORRECT :
❌ INCORRECT : "content": "const text = "Hello""
✅ CORRECT :   "content": "const text = \\"Hello\\""

❌ INCORRECT : "content": "import React from 'react'
export default App"
✅ CORRECT :   "content": "import React from 'react'\\nexport default App"

❌ INCORRECT : "content": "const path = "C:\\folder\\file""
✅ CORRECT :   "content": "const path = \\"C:\\\\folder\\\\file\\""

RÈGLES ABSOLUES :
1. Tout guillemet " dans le code → \\"
2. Tout backslash \\ dans le code → \\\\
3. Tout retour à la ligne → \\n
4. PAS de backticks dans les strings JSON
5. Ferme TOUTES les strings avec "
6. Vérifie que chaque { a son } et chaque [ a son ]

Si le JSON n'est pas parfaitement valide, la génération ÉCHOUERA !

Réponds UNIQUEMENT avec le JSON, rien d'autre.`

/**
 * GÉNÉRATION UNIFIÉE : Tout le projet en une seule fois
 */
async function generateCompleteProject(
  plan: ProjectPlan,
  anthropic: any
): Promise<ProjectFile[]> {
  console.log('🚀 Generating complete project in one go...')

  const ext = plan.techStack.fileExtension

  // Construire la description détaillée de chaque page
  const pagesDescription = plan.pages.map(page => `
📄 ${page.name} (${page.path}) :
   - Description : ${page.description}
   - Features : ${page.features.join(', ')}
   - Données mockées : ${page.dataNeeded.join(', ')}
   ${page.stateNeeded ? `- State : ${page.stateNeeded.join(', ')}` : ''}`).join('\n')

  const userMessage = `Génère le projet React COMPLET en suivant ce plan :

📋 PROJET : ${plan.siteName}
📦 Tech Stack : ${ext === 'tsx' ? 'TypeScript' : 'JavaScript'} + ${plan.techStack.libraries.join(', ')}

🗂️ FICHIERS À GÉNÉRER :

1. CONFIG (placeholders, ensureRequiredFiles générera les vrais) :
   - package.json (structure minimale avec les libraries)
   - vite.config.${ext === 'tsx' ? 'ts' : 'js'} (placeholder)
   - tailwind.config.js (placeholder)
   - postcss.config.js (placeholder)

2. COMPOSANTS UI (src/components/ui/) - NAMED EXPORTS :
   - Button.${ext} (export { Button })
   - Card.${ext} (export { Card, CardHeader, CardTitle, CardContent })
     ⚠️ IMPORTANT : CardContent doit accepter children?: React.ReactNode (PAS ReactElement)
   - Input.${ext} (export { Input })

3. APP (src/App.${ext}) :
   Imports des pages :
${plan.routing.routes.map(r => `   import ${r.component} from './pages/${r.component}'`).join('\n')}

   Routes :
${plan.routing.routes.map(r => `   <Route path="${r.path}" element={<${r.component} />} />`).join('\n')}

4. COMPOSANTS BUSINESS (src/components/) - DEFAULT EXPORTS :
   - Header.${ext} (navigation simple + logo)
   - Footer.${ext} (footer simple)

5. PAGES (src/pages/) - DEFAULT EXPORTS :
${pagesDescription}

6. UTILS :
   - src/lib/utils.${ext === 'tsx' ? 'ts' : 'js'} (fonction cn() uniquement)

⚠️ RÈGLES STRICTES :
- Composants UI : UNIQUEMENT Button, Card, Input - NAMED EXPORTS
- CardContent children: Toujours utiliser children?: React.ReactNode (pour accepter plusieurs enfants)
- Header/Footer : DEFAULT EXPORTS (export default Header)
- Pages : DEFAULT EXPORTS (export default HomePage)
- Données mockées DANS les pages (6-8 items min)
- State local avec useState (pas de Context)
- Navigation avec Link de react-router-dom
- Icônes de lucide-react
- NE PAS utiliser asChild, NE PAS créer d'autres composants (ProductCard, etc.)
- Design shadcn/ui avec Tailwind

🚨 COHÉRENCE TYPESCRIPT (CRITIQUE) :
- Vérifie qu'il n'y a AUCUNE faute de frappe (ex: activeSessions vs activeSession)
- Si un objet a { count: 5 }, utilise toujours obj.count (pas obj.counts)
- Le code DOIT compiler sans erreur TypeScript

Réponds en JSON : { "files": [...] }`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 32000,  // Increased for Railway workers (no timeout limit)
    temperature: 0.7,
    stream: true,
    system: COMPLETE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userMessage
      }
    ]
  })

  // Collecter la réponse depuis le stream
  let responseText = ''
  for await (const event of response) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      responseText += event.delta.text
    }
  }

  console.log('📝 Base response length:', responseText.length, 'characters')

  let files: ProjectFile[]
  let jsonText = ''
  try {
    jsonText = extractJSON(responseText)
    console.log('📦 Extracted JSON length:', jsonText.length, 'characters')
    const result = JSON.parse(jsonText)
    files = result.files || []
  } catch (parseError) {
    console.error('❌ JSON Parse Error:', parseError)
    console.error('📝 Response preview (last 500 chars):', responseText.slice(-500))

    // Tentative de réparation
    try {
      if (!jsonText) jsonText = extractJSON(responseText)
      console.log('🔧 Attempting JSON repair...')
      const repairedJson = attemptJsonRepair(jsonText)
      console.log('🔧 Repaired JSON length:', repairedJson.length)
      const result = JSON.parse(repairedJson)
      files = result.files || []
      console.log('✅ Repaired JSON parsed successfully!')
    } catch (repairError) {
      console.error('❌ Repair also failed:', repairError)
      console.error('📝 Last 200 chars of JSON:', jsonText.slice(-200))
      throw new Error(`Failed to parse base files JSON: ${parseError}`)
    }
  }

  console.log(`✅ Base generated: ${files.length} files`)

  // Ajouter le type automatiquement si manquant
  files.forEach(file => {
    if (!file.type) {
      file.type = detectFileType(file.path)
    }
  })

  // S'assurer que tous les fichiers requis existent
  files = ensureRequiredFiles(files, plan)

  return files
}

/**
 * FONCTION PRINCIPALE : Générer le projet React complet
 * APPROCHE SIMPLIFIÉE : Plan → Projet complet (2 étapes seulement)
 */
export async function generateReactProject(
  prompt: string,
  anthropic: any
): Promise<ReactProjectStructure> {
  console.log('🚀 Starting single-call generation process...')

  try {
    // ====================================
    // GÉNÉRATION DIRECTE EN 1 SEUL APPEL
    // ====================================
    console.log('\n🏗️  Generating complete project in one call...')
    const result = await generateProjectDirectly(prompt, anthropic)

    console.log('\n✅ Generation complete!')
    console.log(`   Total files: ${result.files.length}`)

    return result

  } catch (error) {
    console.error('❌ Error in generation process:', error)
    throw error
  }
}

/**
 * NOUVEAU : Génération directe en 1 seul appel (sans étape plan)
 */
async function generateProjectDirectly(
  prompt: string,
  anthropic: any
): Promise<ReactProjectStructure> {
  console.log('📝 Analyzing prompt and generating project...')

  const DIRECT_SYSTEM_PROMPT = `Tu es un expert développeur React pour WAPIFY.

Ta mission : Analyser un prompt utilisateur et générer DIRECTEMENT un projet React complet en une seule réponse.

Tu DOIS générer TOUS LES FICHIERS en UNE SEULE RÉPONSE JSON :
1. Fichiers de configuration (package.json, vite.config, tailwind.config, postcss.config, tsconfig si TypeScript)
2. TOUS les composants UI (Button, Card, Input avec NAMED EXPORTS)
3. App.tsx avec React Router et imports corrects des pages
4. Composants business (Header, Footer avec DEFAULT EXPORTS)
5. TOUTES les pages du projet (3-4 pages max)
6. Fichiers utils et CSS

RÈGLES CRITIQUES :
- Analyse le prompt et décide automatiquement :
  * Combien de pages (3-4 max)
  * Quelles features pour chaque page
  * Si une base de données est nécessaire
  * TypeScript (.tsx) ou JavaScript (.jsx)
- Génère TOUT en une seule réponse JSON
- Composants UI : UNIQUEMENT Button, Card, Input - NAMED EXPORTS
- CardContent children: Toujours utiliser children?: React.ReactNode (pour accepter plusieurs enfants)
- Header/Footer : DEFAULT EXPORTS (export default Header)
- Pages : DEFAULT EXPORTS (export default HomePage)
- App.tsx doit importer les vraies pages depuis src/pages/
- Données mockées DANS les pages (6-8 items min)
- State local avec useState (pas de Context)
- Navigation avec Link de react-router-dom
- Icônes de lucide-react : UNIQUEMENT des icônes qui EXISTENT vraiment (Home, User, Settings, Menu, X, Search, Plus, Trash, Edit, Eye, Heart, Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Mail, Phone, MapPin, Calendar, Clock, Download, Upload, Check, AlertCircle, Info, Bell, LogOut, LogIn, FileText, Image, Video, Music, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown, BarChart, PieChart, Activity, Users, Building, Book, Bookmark, Tag, Filter, Layout, Grid, List, Lock, Unlock, Shield, Database, Server, Globe, Wifi, Code, Terminal, Cpu, HardDrive, etc.)
  ⚠️ NE JAMAIS inventer des noms d'icônes - vérifie qu'elles existent dans lucide-react
- APOSTROPHES : Utilise UNIQUEMENT des apostrophes ASCII standard (') dans tout le code
  ⚠️ NE JAMAIS utiliser d'apostrophes typographiques (' ou ') - elles causent des erreurs TypeScript
  Exemples CORRECTS : "jusqu'à", "L'Oréal", "n'êtes pas" (avec ')
  Exemples INCORRECTS : "jusqu'à", "L'Oréal", "n'êtes pas" (avec ' ou ')
- NE PAS utiliser asChild, NE PAS créer d'autres composants (ProductCard, etc.)
- Design shadcn/ui avec Tailwind
- Pas de placeholders ou TODOs

⚠️ RÈGLES TYPESCRIPT/JAVASCRIPT STRICTES :
- Assure-toi que TOUS les noms de propriétés sont utilisés de manière COHÉRENTE
- Si tu définis const settings = { activeSessions: 3 }, utilise TOUJOURS settings.activeSessions
- Vérifie qu'il n'y a AUCUNE faute de frappe dans les noms de variables/propriétés
- Le code DOIT compiler sans erreur TypeScript (si .tsx)
- Double-vérifie la cohérence des noms avant de générer le JSON

FORMAT DE RÉPONSE (JSON uniquement) :
{
  "siteName": "Nom de l'app",
  "hasDatabase": false,
  "databaseSchema": null,
  "files": [
    {
      "path": "package.json",
      "content": "...",
      "type": "config"
    },
    {
      "path": "src/pages/HomePage.tsx",
      "content": "...",
      "type": "component"
    }
  ]
}

⚠️ RÈGLES JSON STRICTES (TRÈS IMPORTANT) :
CHAQUE guillemet, backslash et retour à la ligne dans le code DOIT être échappé !

Exemples d'échappement CORRECT :
❌ INCORRECT : "content": "const text = "Hello""
✅ CORRECT :   "content": "const text = \\"Hello\\""

❌ INCORRECT : "content": "import React from 'react'
export default App"
✅ CORRECT :   "content": "import React from 'react'\\nexport default App"

❌ INCORRECT : "content": "const path = "C:\\folder\\file""
✅ CORRECT :   "content": "const path = \\"C:\\\\folder\\\\file\\""

RÈGLES ABSOLUES :
1. Tout guillemet " dans le code → \\"
2. Tout backslash \\ dans le code → \\\\
3. Tout retour à la ligne → \\n
4. PAS de backticks dans les strings JSON
5. Ferme TOUTES les strings avec "
6. Vérifie que chaque { a son } et chaque [ a son ]

Si le JSON n'est pas parfaitement valide, la génération ÉCHOUERA !

Réponds UNIQUEMENT avec le JSON, rien d'autre.`

  const userMessage = `Génère un projet React complet basé sur cette description :

${prompt}

Instructions :
- Analyse le prompt et détermine le nombre de pages nécessaires (3-4 max)
- Crée des features appropriées pour chaque page
- Utilise TypeScript (.tsx) par défaut
- Génère des données mockées réalistes (6-8 items minimum)
- Design professionnel avec shadcn/ui et Tailwind CSS
- Navigation fluide avec React Router

Réponds en JSON : { "siteName": "...", "hasDatabase": false, "databaseSchema": null, "files": [...] }`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 32000,
    temperature: 0.7,
    stream: true,
    system: DIRECT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userMessage
      }
    ]
  })

  // Collecter la réponse streamée
  let fullResponse = ''
  for await (const chunk of response) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      fullResponse += chunk.delta.text
    }
  }

  console.log('📝 Base response length:', fullResponse.length, 'characters')

  // Extraire et parser le JSON
  const jsonText = extractJSON(fullResponse)
  console.log('📦 Extracted JSON length:', jsonText.length, 'characters')

  let parsed: any
  try {
    parsed = JSON.parse(jsonText)
  } catch (parseError) {
    console.error('❌ JSON Parse Error:', parseError)
    throw new Error('Failed to parse JSON response from Claude')
  }

  console.log('✅ JSON parsed successfully')

  // Créer un plan minimal pour ensureRequiredFiles
  const minimalPlan: ProjectPlan = {
    siteName: parsed.siteName || 'Wapify App',
    techStack: {
      fileExtension: parsed.files.some((f: any) => f.path.endsWith('.tsx')) ? 'tsx' : 'jsx',
      libraries: ['react', 'react-router-dom', 'tailwind'],
      hasDatabase: parsed.hasDatabase || false
    },
    pages: [],
    components: { ui: ['Button', 'Card', 'Input'], business: ['Header', 'Footer'] },
    routing: { routes: [] },
    databaseSchema: parsed.databaseSchema
  }

  // S'assurer que tous les fichiers requis existent
  const allFiles = ensureRequiredFiles(parsed.files, minimalPlan)

  console.log(`✅ Base generated: ${allFiles.length} files`)

  return {
    files: allFiles,
    hasDatabase: parsed.hasDatabase || false,
    databaseSchema: parsed.databaseSchema
  }
}

/**
 * Détecte automatiquement le type d'un fichier basé sur son chemin
 */
function detectFileType(path: string): string {
  if (path.includes('/components/') || path.includes('/pages/') || path.match(/src\/App\.(jsx?|tsx?)$/)) {
    return 'component'
  }
  if (path.includes('/hooks/') || path.match(/use[A-Z]\w+\.(js|ts)$/)) {
    return 'hook'
  }
  if (path.match(/\.(css|scss|sass|less)$/)) {
    return 'style'
  }
  if (path.match(/(package\.json|vite\.config|tsconfig|\.eslintrc|\.prettierrc|tailwind|postcss)/)) {
    return 'config'
  }
  return 'other'
}

/**
 * S'assurer que tous les fichiers requis existent
 */
function ensureRequiredFiles(files: ProjectFile[], plan: ProjectPlan): ProjectFile[] {
  const ext = plan.techStack.fileExtension
  const isTypeScript = ext === 'tsx'

  // Vérifier index.html
  if (!files.find(f => f.path === 'index.html')) {
    files.push({
      path: 'index.html',
      content: generateIndexHTML(plan.siteName, ext),
      type: 'other'
    })
  }

  // Vérifier package.json
  if (!files.find(f => f.path === 'package.json')) {
    files.push({
      path: 'package.json',
      content: generatePackageJSON(plan),
      type: 'config'
    })
  }

  // Vérifier et FORCER le remplacement de vite.config (l'AI génère souvent un mauvais)
  const viteConfigPath = isTypeScript ? 'vite.config.ts' : 'vite.config.js'
  const existingViteConfigIndex = files.findIndex(f => f.path.includes('vite.config'))
  if (existingViteConfigIndex >= 0) {
    // Remplacer le fichier existant par le bon
    files[existingViteConfigIndex] = {
      path: viteConfigPath,
      content: generateViteConfig(isTypeScript),
      type: 'config'
    }
  } else {
    files.push({
      path: viteConfigPath,
      content: generateViteConfig(isTypeScript),
      type: 'config'
    })
  }

  // Vérifier et FORCER tailwind.config.js
  const existingTailwindIndex = files.findIndex(f => f.path.includes('tailwind.config'))
  if (existingTailwindIndex >= 0) {
    files[existingTailwindIndex] = {
      path: 'tailwind.config.js',
      content: generateTailwindConfig(),
      type: 'config'
    }
  } else {
    files.push({
      path: 'tailwind.config.js',
      content: generateTailwindConfig(),
      type: 'config'
    })
  }

  // Vérifier et FORCER postcss.config.js
  const existingPostcssIndex = files.findIndex(f => f.path.includes('postcss.config'))
  if (existingPostcssIndex >= 0) {
    files[existingPostcssIndex] = {
      path: 'postcss.config.js',
      content: generatePostCSSConfig(),
      type: 'config'
    }
  } else {
    files.push({
      path: 'postcss.config.js',
      content: generatePostCSSConfig(),
      type: 'config'
    })
  }

  // Vérifier et FORCER tsconfig.json (si TypeScript)
  if (isTypeScript) {
    const existingTsconfigIndex = files.findIndex(f => f.path.includes('tsconfig.json'))
    if (existingTsconfigIndex >= 0) {
      files[existingTsconfigIndex] = {
        path: 'tsconfig.json',
        content: generateTSConfig(),
        type: 'config'
      }
    } else {
      files.push({
        path: 'tsconfig.json',
        content: generateTSConfig(),
        type: 'config'
      })
    }
  }

  // Vérifier src/index.css
  if (!files.find(f => f.path === 'src/index.css')) {
    files.push({
      path: 'src/index.css',
      content: generateIndexCSS(),
      type: 'style'
    })
  }

  // Vérifier src/main
  const mainPath = `src/main.${ext}`
  if (!files.find(f => f.path === mainPath)) {
    files.push({
      path: mainPath,
      content: generateMainFile(ext),
      type: 'other'
    })
  }

  // Nettoyer les imports Tailwind et border-border dans les CSS
  files.forEach(file => {
    if (file.path.match(/\.(css|scss|sass)$/)) {
      file.content = cleanTailwindImports(file.content)
    }
  })

  return files
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

  // Supprimer @apply border-border qui cause des erreurs
  cleaned = cleaned.replace(/^\s*\*\s*\{\s*@apply\s+border-border;\s*\}\s*$/gm, '')
  cleaned = cleaned.replace(/@apply\s+border-border;?/g, '')

  // Nettoyer les lignes vides multiples
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n')

  return cleaned.trim()
}

/**
 * Générer index.html
 */
function generateIndexHTML(appName: string, ext: string): string {
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
    <script type="module" src="/src/main.${ext}"></script>
  </body>
</html>`
}

/**
 * Générer package.json
 */
function generatePackageJSON(plan: ProjectPlan): string {
  const isTypeScript = plan.techStack.fileExtension === 'tsx'

  const dependencies: Record<string, string> = {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }

  // Ajouter les libraries du plan
  plan.techStack.libraries.forEach(lib => {
    if (lib === 'react-router-dom') dependencies[lib] = "^6.26.1"
    else if (lib === 'lucide-react') dependencies[lib] = "^0.400.0"
    else if (lib === 'framer-motion') dependencies[lib] = "^11.3.24"
    else if (lib === 'react-hot-toast') dependencies[lib] = "^2.4.1"
    else if (lib === 'clsx') dependencies[lib] = "^2.1.1"
    else if (lib === 'tailwind-merge') dependencies[lib] = "^2.4.0"
    else dependencies[lib] = "latest"
  })

  const devDependencies: Record<string, string> = {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.3.4",
    "tailwindcss": "^3.4.7",
    "postcss": "^8.4.40",
    "autoprefixer": "^10.4.20"
  }

  if (isTypeScript) {
    devDependencies["@types/react"] = "^18.3.3"
    devDependencies["@types/react-dom"] = "^18.3.0"
    devDependencies["@types/node"] = "^20.10.0"
    devDependencies["typescript"] = "^5.2.2"
  }

  return JSON.stringify({
    name: plan.siteName.toLowerCase().replace(/\s+/g, '-'),
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
 * Générer vite.config
 */
function generateViteConfig(isTypeScript: boolean): string {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
${isTypeScript ? "import path from 'path'\nimport { fileURLToPath } from 'url'\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url))" : "import path from 'path'\nimport { fileURLToPath } from 'url'\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url))"}

export default defineConfig({
  plugins: [react()],
  base: './',
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
    assetsDir: 'assets'
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
 * Générer tsconfig.json
 */
function generateTSConfig(): string {
  return `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}`
}

/**
 * Générer src/index.css
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
 * Générer src/main
 */
function generateMainFile(ext: string): string {
  const isTypeScript = ext === 'tsx'
  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App${isTypeScript ? '' : '.jsx'}'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')${isTypeScript ? '!' : ''}).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`
}

// ============================================
// AGENT VALIDATEUR (INDÉPENDANT)
// ============================================

/**
 * Interface pour les erreurs détectées
 */
interface DetectedError {
  file: string
  line?: number
  type: 'asChild_prop' | 'missing_component' | 'missing_export' | 'other'
  description: string
}

/**
 * Prompt système pour l'agent validateur
 */
const VALIDATOR_SYSTEM_PROMPT = `Tu es un AGENT VALIDATEUR et CORRECTEUR de code React pour WAPIFY.

Ta mission : Analyser un fichier généré et CORRIGER automatiquement les erreurs détectées.

ERREURS COURANTES À CORRIGER :

1. PROP 'asChild' SUR BUTTON (pas supportée) :
   ❌ INCORRECT : <Button asChild><Link to="/path">Texte</Link></Button>
   ✅ CORRECT : <Button onClick={() => navigate('/path')}>Texte</Button>
   OU : <Link to="/path"><button className="px-4 py-2 bg-primary text-white rounded">Texte</button></Link>

2. IMPORTS DE COMPOSANTS NON EXISTANTS :
   ❌ INCORRECT : import { Badge, Select, Dialog } from '@/components/ui/...'
   ✅ CORRECT : Remplacer par HTML + Tailwind
   - Badge : <span className="bg-primary text-white px-2 py-1 rounded text-xs">Texte</span>
   - Select : <select className="px-3 py-2 border rounded">...</select>
   - Dialog : Utiliser conditional rendering avec div + overlay

3. COMPOSANTS BUSINESS NON EXISTANTS :
   ❌ INCORRECT : import ProductCard from '@/components/ProductCard'
   ✅ CORRECT : Créer le composant inline dans la page ou utiliser Card

4. EXPORTS MANQUANTS :
   ❌ INCORRECT : Fichier sans export default
   ✅ CORRECT : Ajouter 'export default ComponentName' à la fin

RÈGLES DE CORRECTION :
- CORRIGE UNIQUEMENT les erreurs détectées
- NE MODIFIE PAS le reste du code fonctionnel
- GARDE le style, la structure et la logique d'origine
- Utilise UNIQUEMENT Button, Card, Input comme composants UI
- Pour la navigation : import { useNavigate } from 'react-router-dom'

FORMAT DE RÉPONSE :
Retourne le fichier corrigé COMPLET en JSON :
{
  "corrected": true,
  "content": "... code corrigé complet ..."
}

Si aucune correction nécessaire :
{
  "corrected": false,
  "content": "... code original ..."
}`

/**
 * Détecter les erreurs dans un fichier
 */
function detectErrors(file: ProjectFile): DetectedError[] {
  const errors: DetectedError[] = []
  const lines = file.content.split('\n')

  // Détecter la prop asChild
  lines.forEach((line, index) => {
    if (line.includes('asChild')) {
      errors.push({
        file: file.path,
        line: index + 1,
        type: 'asChild_prop',
        description: `Ligne ${index + 1}: utilise la prop 'asChild' qui n'est pas supportée sur Button`
      })
    }
  })

  // Détecter les imports de composants non existants
  const forbiddenComponents = ['Badge', 'Select', 'Dialog', 'Tabs', 'Sheet', 'Popover', 'Dropdown', 'Accordion']
  lines.forEach((line, index) => {
    if (line.includes('import') && line.includes('@/components/ui/')) {
      forbiddenComponents.forEach(comp => {
        if (line.includes(comp)) {
          errors.push({
            file: file.path,
            line: index + 1,
            type: 'missing_component',
            description: `Ligne ${index + 1}: importe ${comp} qui n'existe pas (utilise HTML+Tailwind à la place)`
          })
        }
      })
    }
  })

  // Détecter les composants business non existants
  const forbiddenBusinessComponents = ['ProductCard', 'Newsletter', 'Hero', 'Testimonials', 'Features']
  lines.forEach((line, index) => {
    if (line.includes('import') && line.includes('@/components/')) {
      forbiddenBusinessComponents.forEach(comp => {
        if (line.includes(comp)) {
          errors.push({
            file: file.path,
            line: index + 1,
            type: 'missing_component',
            description: `Ligne ${index + 1}: importe ${comp} qui n'existe pas (crée le composant inline dans la page)`
          })
        }
      })
    }
  })

  // Détecter export manquant (pour les composants/pages)
  if (file.type === 'component' && !file.content.includes('export default')) {
    errors.push({
      file: file.path,
      type: 'missing_export',
      description: 'Fichier component sans export default'
    })
  }

  return errors
}

/**
 * Corriger un fichier avec l'AI
 */
async function fixFileWithAI(
  file: ProjectFile,
  errors: DetectedError[],
  anthropic: any
): Promise<string> {
  console.log(`  🔧 Correction de ${file.path} (${errors.length} erreur(s))...`)

  const errorDescriptions = errors.map(e => `- ${e.description}`).join('\n')

  const userMessage = `FICHIER À CORRIGER : ${file.path}

ERREURS DÉTECTÉES :
${errorDescriptions}

CODE ACTUEL :
\`\`\`
${file.content}
\`\`\`

CORRIGE ces erreurs en suivant les règles du système. Retourne le code corrigé complet en JSON.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    temperature: 0.3,
    system: VALIDATOR_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userMessage
      }
    ]
  })

  const responseText = response.content[0].text

  try {
    const jsonText = extractJSON(responseText)
    const result = JSON.parse(jsonText)

    if (result.corrected) {
      console.log(`  ✅ ${file.path} corrigé`)
    } else {
      console.log(`  ℹ️  ${file.path} : aucune correction nécessaire`)
    }

    return result.content
  } catch (parseError) {
    console.error(`  ❌ Échec parsing correction pour ${file.path}:`, parseError)
    // En cas d'échec, retourner le contenu original
    return file.content
  }
}

/**
 * AGENT VALIDATEUR : Analyser et corriger tous les fichiers
 * Cette fonction est INDÉPENDANTE du générateur
 */
export async function validateAndFixProject(
  files: ProjectFile[],
  anthropic: any
): Promise<ProjectFile[]> {
  console.log('\n🔍 ========================================')
  console.log('🔍 AGENT VALIDATEUR - Analyse du projet')
  console.log('🔍 ========================================\n')

  const filesToCheck = files.filter(f =>
    f.type === 'component' &&
    (f.path.includes('/pages/') || f.path.includes('/components/'))
  )

  console.log(`📋 Fichiers à vérifier : ${filesToCheck.length}`)

  let totalErrors = 0
  let totalCorrected = 0

  for (const file of filesToCheck) {
    const errors = detectErrors(file)

    if (errors.length > 0) {
      totalErrors += errors.length
      console.log(`\n⚠️  ${file.path} : ${errors.length} erreur(s) détectée(s)`)
      errors.forEach(err => console.log(`   ${err.description}`))

      // Corriger avec l'AI
      try {
        const correctedContent = await fixFileWithAI(file, errors, anthropic)
        file.content = correctedContent
        totalCorrected++
      } catch (error) {
        console.error(`   ❌ Échec correction de ${file.path}:`, error)
      }

      // Petit délai pour éviter rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    } else {
      console.log(`✅ ${file.path} : aucune erreur`)
    }
  }

  console.log('\n🔍 ========================================')
  console.log(`🔍 RÉSULTAT : ${totalErrors} erreur(s) détectée(s)`)
  console.log(`🔍           ${totalCorrected} fichier(s) corrigé(s)`)
  console.log('🔍 ========================================\n')

  return files
}
