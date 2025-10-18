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
 * Générer la structure d'un projet React avec l'AI
 */
export async function generateReactProject(
  prompt: string,
  anthropic: any
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
  - Lucide-react, react-icons, heroicons pour les icônes
  - recharts, chart.js, victory pour les graphiques
  - date-fns, dayjs pour les dates
  - axios, ky pour les requêtes HTTP
  - framer-motion pour les animations
  - react-hook-form, formik pour les formulaires
  - zod, yup pour la validation
  - @tanstack/react-query pour le data fetching
  - zustand, jotai pour le state management
  - clsx, tailwind-merge pour les classes CSS
  - Et toute autre bibliothèque npm pertinente!

🎨 STYLING MODERNE:
  - Utilise Tailwind CSS (configuré via tailwind.config.js)
  - Fichier CSS principal: src/index.css avec @tailwind directives
  - Tu PEUX utiliser des composants UI (shadcn/ui style)
  - Animations avec Tailwind ou Framer Motion

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

🔧 STRUCTURE DE PROJET COMPLÈTE:
- src/App.jsx (composant principal avec routing si nécessaire)
- src/main.jsx (point d'entrée React)
- src/index.css (Tailwind + styles globaux)
- src/components/*.jsx (composants UI réutilisables)
- src/hooks/*.js (custom hooks)
- src/lib/*.js (utilitaires, clients API)
- src/pages/*.jsx (pages si routing)
- public/* (assets statiques)
- index.html (HTML de base)
- package.json (TOUTES les dépendances nécessaires)
- vite.config.js (configuration Vite + React plugin)
- tailwind.config.js (configuration Tailwind)
- postcss.config.js (PostCSS pour Tailwind)
- database/schema.sql (UNIQUEMENT si DB demandée)

⚠️ FICHIERS OBLIGATOIRES À GÉNÉRER:
- vite.config.js (OBLIGATOIRE pour Vite Build)
- tailwind.config.js (OBLIGATOIRE pour Tailwind)
- postcss.config.js (OBLIGATOIRE pour Tailwind)
- src/index.css avec directives @tailwind (OBLIGATOIRE)

💎 EXIGENCES QUALITÉ:
1. Application COMPLÈTE et FONCTIONNELLE (pas de placeholders)
2. Au minimum 30-50 items de données mockées (ex: 40 produits, 30 articles, 50 utilisateurs)
3. Minimum 5-8 sections/pages différentes (pas juste 3!)
4. TOUS les boutons doivent être fonctionnels (pas de boutons morts)
5. Animations et transitions fluides (hover, click, fade-in)
6. Design moderne et professionnel avec Tailwind
7. Responsive mobile-first
8. Loading states et feedback utilisateur
9. Gestion d'erreurs propre
10. Code propre, commenté, organisé

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

✅ RÈGLES À SUIVRE:
1. JavaScript uniquement (pas TypeScript)
2. import.meta.env pour les variables d'environnement Vite
3. Génère TOUJOURS vite.config.js, tailwind.config.js, postcss.config.js
4. Utilise @tailwind directives dans src/index.css
5. Code propre, bien organisé, commenté
6. TOUTES les dépendances npm dans package.json

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
      max_tokens: 50000, // Augmenté pour permettre de grandes apps avec beaucoup de données
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
    // Fallback: générer une structure minimale
    console.log('⚠️ Using fallback structure')
    return generateFallbackStructure(prompt)
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
      if (file.content.length !== originalLength) {
        console.log(`🧹 Cleaned Tailwind imports from ${file.path}`)
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

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
})`
}

/**
 * Générer tailwind.config.js
 */
function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
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

/* Styles globaux personnalisés */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
