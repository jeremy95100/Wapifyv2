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
      "content": "// contenu du fichier"
    },
    {
      "path": "src/main.jsx",
      "content": "// contenu"
    }
    // ... autres fichiers
  ],
  "hasDatabase": true/false,
  "databaseSchema": "CREATE TABLE ... (si hasDatabase=true)"
}

Génère une application React complète et professionnelle.`

  const userPrompt = `Génère une application React complète pour: ${prompt}

Réponds UNIQUEMENT avec un JSON valide contenant tous les fichiers nécessaires.`

  try {
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

    // Extraire le JSON de la réponse
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const result = JSON.parse(jsonMatch[0])

    // Ajouter les fichiers de configuration par défaut s'ils manquent
    const structure = ensureCompleteStructure(result, prompt)

    return structure
  } catch (error) {
    console.error('Error generating React project:', error)
    // Fallback: générer une structure minimale
    return generateFallbackStructure(prompt)
  }
}

/**
 * S'assurer que la structure est complète avec tous les fichiers nécessaires
 */
function ensureCompleteStructure(
  result: any,
  prompt: string
): ReactProjectStructure {
  const files: ProjectFile[] = result.files || []

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
 * Structure de fallback en cas d'erreur
 */
function generateFallbackStructure(prompt: string): ReactProjectStructure {
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
import './styles/App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,
        type: 'other'
      },
      {
        path: 'src/App.jsx',
        content: `import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ${prompt}
        </h1>
        <p className="text-gray-600">
          Application générée automatiquement. Personnalisez-la selon vos besoins.
        </p>
      </div>
    </div>
  )
}`,
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
