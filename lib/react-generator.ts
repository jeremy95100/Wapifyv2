/**
 * Générateur de structure React multi-fichiers
 */

import { ProjectFile } from './storage'

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

  const systemPrompt = `Tu es un expert développeur React. Tu génères des applications React complètes et modernes.

IMPORTANT: Tu dois générer une structure de projet COMPLÈTE avec plusieurs fichiers séparés.

Structure attendue:
- src/App.jsx (composant principal)
- src/main.jsx (point d'entrée)
- src/components/*.jsx (composants réutilisables)
- src/hooks/*.js (custom hooks si nécessaire)
- src/lib/supabase.js (client Supabase/Neon si DB nécessaire)
- src/styles/App.css (styles)
- index.html (HTML de base)
- package.json (dépendances)
- vite.config.js (config Vite)
- database/schema.sql (si base de données nécessaire)

RÈGLES IMPORTANTES:
1. Utilise React moderne avec hooks
2. Utilise Tailwind CSS pour le styling
3. Si l'app a besoin d'une base de données, génère le schéma SQL dans database/schema.sql
4. Chaque composant dans un fichier séparé
5. Utilise Vite comme bundler
6. Code propre et bien organisé
7. Génère TOUS les fichiers nécessaires

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
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    console.log('📝 AI Response length:', response.length, 'characters')
    console.log('📝 First 500 chars:', response.substring(0, 500))

    // Extraire le JSON de la réponse (chercher un objet JSON complet)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ No JSON found in AI response')
      console.error('Full response:', response)
      throw new Error('No valid JSON found in response')
    }

    console.log('📦 Parsing JSON...')
    const result = JSON.parse(jsonMatch[0])
    console.log('✅ JSON parsed successfully')
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
 * S'assurer que la structure est complète avec tous les fichiers nécessaires
 */
function ensureCompleteStructure(
  result: any,
  prompt: string
): ReactProjectStructure {
  const files: ProjectFile[] = result.files || []

  // Ajouter automatiquement le type si manquant
  files.forEach(file => {
    if (!file.type) {
      file.type = detectFileType(file.path)
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

  // Vérifier si vite.config.js existe
  if (!files.find(f => f.path === 'vite.config.js')) {
    files.push({
      path: 'vite.config.js',
      content: generateViteConfig(),
      type: 'config'
    })
  }

  // Si DB nécessaire, ajouter le client Supabase
  if (result.hasDatabase && !files.find(f => f.path === 'src/lib/supabase.js')) {
    files.push({
      path: 'src/lib/supabase.js',
      content: generateSupabaseClient(),
      type: 'other'
    })
  }

  return {
    files,
    hasDatabase: result.hasDatabase || false,
    databaseSchema: result.databaseSchema
  }
}

/**
 * Générer un index.html de base
 */
function generateIndexHTML(appName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`
}

/**
 * Générer package.json
 */
function generatePackageJSON(appName: string, hasDatabase: boolean): string {
  const dependencies: Record<string, string> = {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }

  if (hasDatabase) {
    dependencies["@supabase/supabase-js"] = "^2.58.0"
  }

  return JSON.stringify({
    name: appName.toLowerCase().replace(/\s+/g, '-'),
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies,
    devDependencies: {
      "@vitejs/plugin-react": "^4.3.4",
      "vite": "^6.0.12"
    }
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
})`
}

/**
 * Générer le client Supabase
 */
function generateSupabaseClient(): string {
  return `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)`
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
