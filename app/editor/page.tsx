'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import JSZip from 'jszip'
import Editor from '@monaco-editor/react'
import { GenerationPlan, GenerationStep, ModificationDetail} from '../../lib/anthropic'
import { generateProject } from '../../lib/generate-client'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
  timestamp: Date
}

interface ProjectFile {
  path: string
  content: string
  type?: string
}

// Fonction pour générer le HTML de preview React (en dehors du composant) - UNUSED for now
/* function generateReactPreviewHTML(files: ProjectFile[]): string {
  const cssFile = files.find(f => f.path.includes('.css'))

  // Créer un module map pour tous les fichiers JS/JSX
  const moduleMap: Record<string, string> = {}
  files.forEach(f => {
    if (f.path.match(/\.(jsx?|tsx?)$/)) {
      const modulePath = f.path.startsWith('/') ? f.path : '/' + f.path
      moduleMap[modulePath] = f.content
    }
  })

  const moduleMapJSON = JSON.stringify(moduleMap)
  const cssContent = cssFile ? cssFile.content : ''

  const html = '<!DOCTYPE html>' +
'<html lang="en">' +
'<head>' +
'  <meta charset="UTF-8">' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'  <title>React Preview</title>' +
'  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>' +
'  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>' +
'  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>' +
'  <style>' +
'    * { margin: 0; padding: 0; box-sizing: border-box; }' +
'    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; }' +
     cssContent +
'  </style>' +
'</head>' +
'<body>' +
'  <div id="root"></div>' +
'  <script type="text/babel">' +
'    const { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext, useReducer } = React;' +
'    const modules = ' + moduleMapJSON + ';' +
'    const moduleCache = {};' +
'    ' +
'    function requireModule(path) {' +
'      let normalizedPath = path;' +
'      if (!path.startsWith(\'/\')) { normalizedPath = \'/src/\' + path; }' +
'      if (!path.match(/\\\\.(jsx?|tsx?)$/)) {' +
'        if (modules[normalizedPath + \'.jsx\']) { normalizedPath = normalizedPath + \'.jsx\'; }' +
'        else if (modules[normalizedPath + \'.js\']) { normalizedPath = normalizedPath + \'.js\'; }' +
'      }' +
'      ' +
'      if (moduleCache[normalizedPath]) { return moduleCache[normalizedPath]; }' +
'      ' +
'      const code = modules[normalizedPath];' +
'      if (!code) { console.error(\'Module not found:\', path, \'tried:\', normalizedPath); return {}; }' +
'      ' +
'      let transformedCode = code;' +
'      ' +
'      transformedCode = transformedCode.replace(/import\\s+React(?:\\s*,\\s*\\{[^}]*\\})?\\s+from\\s+[\"\']react[\"\']/g, "");' +
'      transformedCode = transformedCode.replace(/import\\s+\\{([^}]+)\\}\\s+from\\s+[\"\']react[\"\']/g, "const {$1} = React");' +
'      transformedCode = transformedCode.replace(/import\\s+([\\w]+)\\s+from\\s+[\"\']([^\"\']+)[\"\']/g, (match, name, importPath) => {' +
'        return `const ${name} = requireModule("${importPath}")`;' +
'      });' +
'      transformedCode = transformedCode.replace(/import\\s+\\{([^}]+)\\}\\s+from\\s+[\"\']([^\"\']+)[\"\']/g, (match, imports, importPath) => {' +
'        const module = `requireModule("${importPath}")`;' +
'        return `const {${imports}} = ${module}`;' +
'      });' +
'      ' +
'      const wrappedCode = "(function() {\\n" + transformedCode.replace(/export\\s+default\\s+/g, "return ").replace(/export\\s+\\{([^}]+)\\}/g, "return {$1}").replace(/export\\s+(const|let|var|function|class)\\s+/g, "$1 ") + "\\n})()";' +
'      ' +
'      try {' +
'        const babelResult = Babel.transform(wrappedCode, { presets: [\'react\'] });' +
'        const jsCode = babelResult.code;' +
'        ' +
'        const func = new Function("requireModule", "React", "useState", "useEffect", "useCallback", "useMemo", "useRef", "createContext", "useContext", "useReducer", jsCode);' +
'        const result = func(requireModule, React, useState, useEffect, useCallback, useMemo, useRef, createContext, useContext, useReducer);' +
'        moduleCache[normalizedPath] = result;' +
'        return result;' +
'      } catch (err) {' +
'        console.error(\'Error executing module:\', normalizedPath, err);' +
'        console.log(\'Wrapped code:\', wrappedCode);' +
'        return {};' +
'      }' +
'    }' +
'    ' +
'    const App = requireModule(\'/src/App.jsx\');' +
'    const root = ReactDOM.createRoot(document.getElementById(\'root\'));' +
'    root.render(React.createElement(App));' +
'  </script>' +
'</body>' +
'</html>'

  return html
} */

export default function EditorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationPlan, setGenerationPlan] = useState<GenerationPlan | null>(null)
  const [, setSteps] = useState<GenerationStep[]>([])
  const [, setSubSteps] = useState<Array<{step: string, status: string, description: string, progress: number}>>([])
  const [, setModifications] = useState<ModificationDetail[]>([])
  const [error, setError] = useState('')
  const [, setHasAutoGenerated] = useState(false)
  const [, setCurrentGenerationMessageId] = useState<string | null>(null)
  const [, setShowStuckMessage] = useState(false)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isMultiFile, setIsMultiFile] = useState(false)
  const [projectFiles, setProjectFiles] = useState<Array<{path: string, content: string, type?: string}>>([])
  const [hasDatabase, setHasDatabase] = useState(false)
  const [databaseSchema, setDatabaseSchema] = useState<string | null>(null)
  const [dbBranchId, setDbBranchId] = useState<string | null>(null)
  const [dbConnectionString, setDbConnectionString] = useState<string | null>(null)
  const [githubRepo, setGithubRepo] = useState<string | null>(null)
  const [githubRepoFullName, setGithubRepoFullName] = useState<string | null>(null)
  const [githubCloneUrl, setGithubCloneUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'preview' | 'dashboard' | 'code'>('preview')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'public']))

  // Build server states
  const [buildJobId, setBuildJobId] = useState<string | null>(null)
  const [buildUrl, setBuildUrl] = useState<string | null>(null)
  const [buildStatus, setBuildStatus] = useState<'idle' | 'queued' | 'building' | 'completed' | 'failed'>('idle')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const stepsEndRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)
  const lastProgressUpdateTime = useRef<number>(Date.now())
  const stuckMessageTimer = useRef<NodeJS.Timeout | null>(null)
  const hasSavedGeneration = useRef(false) // Track if current generation has been saved

  // Redirection si non authentifié
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Préserver le prompt dans l'URL pour le callback après connexion
      const urlParams = new URLSearchParams(window.location.search)
      const promptFromUrl = urlParams.get('prompt')

      if (promptFromUrl) {
        // Rediriger vers signin avec le prompt et l'URL de callback
        const callbackUrl = `/editor?prompt=${encodeURIComponent(promptFromUrl)}`
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      } else {
        router.push('/auth/signin?callbackUrl=/editor')
      }
    }
  }, [status, router])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }


  // Fonction pour sauvegarder le projet (single-file ou multi-file)
  const saveProject = useCallback(async (code: string, prompt: string) => {
    if ((!code && !isMultiFile) || !prompt || !session?.user?.email) return

    try {
      setIsSaving(true)

      // Utiliser l'ID de l'utilisateur authentifié
      const userId = (session.user as any)?.id || session.user.email

      // Si pas de projectId OU si c'est un ID temporaire (proj-xxx), créer un nouveau projet
      const isTemporaryId = projectId?.startsWith('proj-')

      if (!projectId || isTemporaryId) {
        // Créer un nouveau projet
        const name = projectName || `Projet ${new Date().toLocaleDateString()}`

        const requestBody: any = {
          userId,
          name,
          prompt,
        }

        // Ajouter soit le code (single-file) soit les files (multi-file)
        if (isMultiFile) {
          requestBody.files = projectFiles
          requestBody.framework = 'react'
          requestBody.hasDatabase = hasDatabase
          requestBody.databaseSchema = databaseSchema
        } else {
          requestBody.code = code
        }

        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })

        if (response.ok) {
          const { project } = await response.json()
          setProjectId(project.id)
          setProjectName(project.name)
          setLastSaved(new Date())
          console.log('✅ Projet sauvegardé:', project.id)
          if (project.database_url) {
            console.log('✅ Base de données créée:', project.database_id)
          }

          // Mettre à jour l'URL pour inclure le projectId
          window.history.pushState({}, '', `/editor?projectId=${project.id}`)
          console.log('🔗 URL mise à jour avec projectId:', project.id)
        }
      } else {
        // Mettre à jour le projet existant
        const requestBody: any = {
          projectId,
          status: 'ready',
        }

        // Ajouter les fichiers ou le code selon le type de projet
        if (isMultiFile) {
          requestBody.files = projectFiles
          requestBody.hasDatabase = hasDatabase
          requestBody.databaseSchema = databaseSchema
          if (dbBranchId) requestBody.dbBranchId = dbBranchId
          if (dbConnectionString) requestBody.dbConnectionString = dbConnectionString
          if (githubRepo) requestBody.githubRepo = githubRepo
          if (githubRepoFullName) requestBody.githubRepoFullName = githubRepoFullName
          if (githubCloneUrl) requestBody.githubCloneUrl = githubCloneUrl
        } else {
          requestBody.code = code
        }

        const response = await fetch('/api/projects', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })

        if (response.ok) {
          setLastSaved(new Date())
          console.log('✅ Projet mis à jour:', projectId, 'avec', isMultiFile ? projectFiles.length + ' fichiers' : 'code')
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setIsSaving(false)
    }
  }, [projectId, projectName, session, isMultiFile, projectFiles, hasDatabase, databaseSchema, dbBranchId, dbConnectionString])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Sauvegarde automatique quand le code est généré (single-file)
  useEffect(() => {
    if (!isMultiFile && generatedCode && messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]
      if (lastUserMessage) {
        saveProject(generatedCode, lastUserMessage.content)
      }
    }
  }, [generatedCode, messages, saveProject, isMultiFile])

  // Sauvegarde automatique quand les fichiers sont modifiés (multi-file)
  useEffect(() => {
    // Attendre que la génération soit terminée
    if (!isGenerating && isMultiFile && projectFiles.length > 0 && messages.length > 0 && !hasSavedGeneration.current) {
      const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]
      if (lastUserMessage) {
        // Sauvegarder pour tous les projets (nouveaux et existants)
        console.log('💾 Déclenchement sauvegarde auto pour projet avec', projectFiles.length, 'fichiers')
        console.log('📁 Fichiers à sauvegarder:', projectFiles.map(f => f.path))
        saveProject('', lastUserMessage.content)
        hasSavedGeneration.current = true
      }
    }
  }, [isGenerating, projectFiles, messages, saveProject, isMultiFile, projectId])

  // Fonction pour télécharger le projet React en ZIP
  const downloadProject = useCallback(async () => {
    if (projectFiles.length === 0) {
      alert('Aucun fichier à télécharger')
      return
    }

    try {
      console.log('📦 Création du ZIP avec', projectFiles.length, 'fichiers...')

      // Créer une instance JSZip
      const zip = new JSZip()

      // Ajouter tous les fichiers au ZIP
      projectFiles.forEach(file => {
        // Nettoyer le chemin (enlever le / initial s'il existe)
        const cleanPath = file.path.startsWith('/') ? file.path.slice(1) : file.path
        console.log('  ➕ Ajout:', cleanPath)
        zip.file(cleanPath, file.content)
      })

      // Ajouter un README.md avec les instructions
      const readme = `# ${projectName || 'Projet React'}

Généré par Wapify - https://wapify.app

## Installation

\`\`\`bash
npm install
\`\`\`

## Développement

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Fichiers générés

${projectFiles.map(f => `- ${f.path}`).join('\n')}
`
      zip.file('README.md', readme)

      // Générer le ZIP
      console.log('🔄 Génération du fichier ZIP...')
      const blob = await zip.generateAsync({ type: 'blob' })

      // Créer un lien de téléchargement et le déclencher
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${projectName || 'projet'}-${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('✅ ZIP téléchargé avec succès!')
    } catch (error) {
      console.error('❌ Erreur lors de la création du ZIP:', error)
      alert('Erreur lors de la création du fichier ZIP')
    }
  }, [projectFiles, projectName])

  // Auto-scroll vers la dernière étape
  useEffect(() => {
    if (stepsEndRef.current && isGenerating) {
      // Utiliser un petit délai pour s'assurer que le DOM est mis à jour
      const timer = setTimeout(() => {
        stepsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isGenerating])

  // Charger un projet existant ou auto-génération depuis l'URL
  useEffect(() => {
    // Empêcher la double exécution en mode développement (React Strict Mode)
    if (hasInitialized.current) return
    hasInitialized.current = true

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const projectIdFromUrl = urlParams.get('projectId')
      const promptFromUrl = urlParams.get('prompt')
      const styleFromUrl = urlParams.get('style')

      if (projectIdFromUrl) {
        // Charger un projet existant
        loadProject(projectIdFromUrl)
      } else if (promptFromUrl && promptFromUrl.trim()) {
        // Ne pas remplir l'input, juste marquer comme auto-généré
        setHasAutoGenerated(true)

        // Ajouter les instructions de style au prompt si un style est sélectionné
        let finalPrompt = promptFromUrl
        if (styleFromUrl) {
          const styleInstructions: Record<string, string> = {
            modern: "Use a modern minimalist design with generous whitespace, clean sans-serif typography, subtle animations, and a neutral color palette with accent colors.",
            gradient: "Use bold gradient backgrounds with vibrant colors, smooth color transitions, animated elements with hover effects, and modern glassmorphism with blur effects.",
            dark: "Use a dark mode design with dark backgrounds, neon accent colors for CTAs, high contrast for readability, and strategic highlights.",
            brutalist: "Use a brutalist design with heavy black borders, bold geometric shapes, strong typography hierarchy, and high contrast black and white colors.",
            glassmorphism: "Use glassmorphism design with frosted glass blur effects on cards, soft drop shadows, translucent backgrounds with vibrant colors, and depth layers."
          }
          const instructions = styleInstructions[styleFromUrl]
          if (instructions) {
            finalPrompt = `${promptFromUrl} ${instructions}`
          }
        }

        // Lancer la génération immédiatement
        handleGenerateWithPrompt(finalPrompt)
        // Nettoyer l'URL après récupération
        window.history.replaceState({}, '', '/editor')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProject = async (id: string) => {
    try {
      console.log(`🔄 Loading project: ${id}`)
      const response = await fetch(`/api/projects/${id}`)

      if (!response.ok) {
        throw new Error('Projet introuvable')
      }

      const data = await response.json()
      console.log(`📦 API Response:`, {
        hasProject: !!data.project,
        hasFiles: !!data.files,
        filesLength: data.files?.length || 0,
        framework: data.project?.framework,
        storagePath: data.project?.storage_path
      })

      const project = data.project

      // Charger les données du projet
      setProjectId(project.id)
      setProjectName(project.name)

      // Vérifier si c'est un projet multi-fichiers (React)
      if (project.framework === 'react') {
        console.log(`✅ React project detected`)
        // Projet React multi-fichiers
        setIsMultiFile(true)
        setHasDatabase(project.has_database || false)

        // Charger les fichiers depuis l'API (avec ou sans storage_path)
        if (data.files && Array.isArray(data.files) && data.files.length > 0) {
          console.log(`📁 Setting ${data.files.length} files to state`)
          setProjectFiles(data.files)
          setGeneratedCode('multi-file-project') // Indicateur pour afficher Sandpack

          // Sélectionner le premier fichier par défaut
          if (data.files.length > 0) {
            setSelectedFile(data.files[0].path)
          }
        } else {
          console.error(`❌ No files found for React project`)
          if (!project.storage_path) {
            console.error(`❌ Project has no storage_path - files were never saved`)
          }
          // Afficher un message d'erreur à l'utilisateur
          setError('Ce projet React n\'a aucun fichier sauvegardé. Il s\'agit probablement d\'un ancien projet. Veuillez créer un nouveau projet.')
          setProjectFiles([])
          setGeneratedCode('')
        }
      } else if (project.code) {
        console.log(`📄 HTML single-file project`)
        // Projet HTML single-file
        setIsMultiFile(false)
        setGeneratedCode(project.code)
      } else {
        console.warn(`⚠️ Unknown project type:`, { framework: project.framework, hasCode: !!project.code, hasStoragePath: !!project.storage_path })
      }

      // Ajouter le prompt initial dans les messages
      const initialMessage: Message = {
        role: 'user',
        content: project.prompt,
        id: `msg-${Date.now()}`,
        timestamp: new Date(project.created_at)
      }
      setMessages([initialMessage])

      // Garder le projectId dans l'URL pour les futures sauvegardes
      // window.history.replaceState({}, '', '/editor')
    } catch (err) {
      setError('Impossible de charger ce projet')
      console.error('Error loading project:', err)
    }
  }

  const handleGenerateWithPrompt = useCallback(async (promptText: string) => {
    if (!promptText.trim() || isGenerating) return

    const messageId = `msg-${Date.now()}`
    const userMessage: Message = {
      role: 'user',
      content: promptText,
      id: messageId,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setCurrentGenerationMessageId(messageId)
    setInput('')
    setIsGenerating(true)
    setError('')
    setSteps([])
    setSubSteps([])
    setGenerationPlan(null)
    setModifications([])
    hasSavedGeneration.current = false // Reset save tracker for new generation

    try {
      // Generate projectId if not exists
      const currentProjectId = projectId || `proj-${Date.now()}-${Math.random().toString(36).substring(7)}`
      if (!projectId) {
        setProjectId(currentProjectId)
      }

      // Use async generation with real-time SSE streaming
      const result = await generateProject({
        prompt: promptText,
        conversationHistory: messages,
        projectId: currentProjectId,
        userId: (session?.user as any)?.id || session?.user?.email,
        onProgress: (progress) => {
          // Could update a progress bar here
          console.log(`Generation progress: ${progress}%`)
        },
        onEvent: (event) => {
          // Handle SSE events from sync generation
          if (event.type === 'plan') {
            setGenerationPlan(event.data)
          } else if (event.type === 'modifications') {
            setModifications(event.data)
          } else if (event.type === 'chat_message') {
            const chatMessage: Message = {
              role: 'assistant',
              content: event.data,
              id: `msg-gen-${Date.now()}-${Math.random()}`,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, chatMessage])
          } else if (event.type === 'step') {
            setSteps(prev => {
              const existingIndex = prev.findIndex(s => s.step === event.data.step)
              if (existingIndex >= 0) {
                const newSteps = [...prev]
                newSteps[existingIndex] = event.data
                return newSteps
              }
              return [...prev, event.data]
            })
          } else if (event.type === 'substep') {
            lastProgressUpdateTime.current = Date.now()
            setShowStuckMessage(false)
            if (stuckMessageTimer.current) {
              clearTimeout(stuckMessageTimer.current)
            }
            stuckMessageTimer.current = setTimeout(() => {
              setShowStuckMessage(true)
            }, 5000)
            setSubSteps(prev => {
              const existingIndex = prev.findIndex(s => s.step === event.data.step)
              if (existingIndex >= 0) {
                const newSubSteps = [...prev]
                newSubSteps[existingIndex] = event.data
                return newSubSteps
              }
              return [...prev, event.data]
            })
          }
        }
      })

      // Process result
      if (result.isMultiFile) {
        console.log('✅ Generation complete - React multi-file project')
        console.log('📁 Files:', result.files.length)
        setIsMultiFile(true)
        setProjectFiles(result.files)
        setHasDatabase(result.hasDatabase || false)
        setDatabaseSchema(result.databaseSchema || null)
        if (result.dbBranchId) {
          setDbBranchId(result.dbBranchId)
          console.log('🗄️  Database branch created:', result.dbBranchId)
        }
        if (result.dbConnectionString) {
          setDbConnectionString(result.dbConnectionString)
          console.log('🔗 Database connection ready')
        }
        if (result.githubRepo) {
          setGithubRepo(result.githubRepo)
          setGithubRepoFullName(result.githubRepoFullName || null)
          setGithubCloneUrl(result.githubCloneUrl || null)
          console.log('📦 GitHub repo:', result.githubRepo)
        }

        const defaultFile = result.files.find((f: any) =>
          f.path === 'src/App.jsx' || f.path === 'src/App.tsx' || f.path === 'src/main.jsx'
        ) || result.files[0]

        if (defaultFile) {
          setSelectedFile(defaultFile.path)
          setGeneratedCode(defaultFile.content)
        }
      } else {
        // Legacy single-file support (should not happen anymore)
        console.log('✅ Single-file HTML (legacy)')
        setIsMultiFile(false)
        setGeneratedCode(result.files[0]?.content || '')
      }

      // Success message
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'Application générée avec succès ! Vous pouvez la voir dans la preview et demander des modifications.',
        id: `msg-${Date.now()}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Erreur de génération')

      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Erreur: ${err instanceof Error ? err.message : 'Erreur de génération'}`,
        id: `msg-${Date.now()}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
      setShowStuckMessage(false)
      if (stuckMessageTimer.current) {
        clearTimeout(stuckMessageTimer.current)
        stuckMessageTimer.current = null
      }
    }
  }, [isGenerating, messages, generationPlan])

  const handleGenerate = async () => {
    if (!input.trim() || isGenerating) return
    await handleGenerateWithPrompt(input)
  }

  // Déclencher un build sur le serveur Vite
  const triggerBuild = async (files: Array<{path: string, content: string}>, projId: string) => {
    try {
      console.log('🔨 Triggering build for', files.length, 'files')
      setBuildStatus('queued')

      // Message de chat pour le build
      const buildMessage: Message = {
        role: 'assistant',
        content: '🔨 Compilation avec Vite...',
        id: `msg-build-${Date.now()}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, buildMessage])

      const response = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projId || `temp-${Date.now()}`,
          files,
          projectName: projectName || 'Wapify App'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to trigger build')
      }

      const data = await response.json()
      console.log('✅ Build job created:', data.jobId)
      setBuildJobId(data.jobId)
      setBuildStatus('building')
    } catch (error) {
      console.error('❌ Error triggering build:', error)
      setBuildStatus('failed')
      setError('Échec du démarrage du build')

      // Message d'erreur dans le chat
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ Erreur lors de la compilation',
        id: `msg-build-error-${Date.now()}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // Rebuild un projet existant avec fichiers frais depuis Supabase Storage
  const rebuildProject = async (projId: string) => {
    try {
      console.log('🔄 Rebuilding project with fresh files from Storage:', projId)
      setBuildStatus('queued')
      setError('')

      const response = await fetch(`/api/projects/${projId}/rebuild`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to rebuild project')
      }

      const data = await response.json()
      console.log('✅ Rebuild job created:', data.jobId, `(${data.filesCount} fresh files)`)
      setBuildJobId(data.jobId)
      setBuildStatus('building')
    } catch (error) {
      console.error('❌ Error rebuilding project:', error)
      setBuildStatus('failed')
      setError(error instanceof Error ? error.message : 'Échec du rebuild')
    }
  }

  // Convert Vercel Blob URL to proxy URL
  // Blob URL: https://....blob.vercel-storage.com/{projectId}/{buildId}/{file}
  // Proxy URL: /api/preview/{projectId}/{buildId}/{file}
  const convertToProxyUrl = (blobUrl: string): string => {
    try {
      const url = new URL(blobUrl)
      const pathParts = url.pathname.split('/').filter(Boolean)
      // pathParts = [projectId, buildId, ...filePath]
      if (pathParts.length >= 3) {
        return `/api/preview/${pathParts.join('/')}`
      }
    } catch (e) {
      console.error('Failed to convert URL:', e)
    }
    return blobUrl // Fallback to original
  }

  // Callback quand le build est terminé
  const handleBuildComplete = (url: string) => {
    console.log('✅ Build completed, Blob URL:', url)
    const proxyUrl = convertToProxyUrl(url)
    console.log('📡 Using proxy URL:', proxyUrl)
    setBuildUrl(proxyUrl)
    setBuildStatus('completed')

    // Message de succès dans le chat
    const successMessage: Message = {
      role: 'assistant',
      content: '✅ Build réussi ! Votre application est prête.',
      id: `msg-build-success-${Date.now()}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, successMessage])
  }

  // Callback en cas d'erreur de build
  const handleBuildError = (error: string) => {
    console.error('❌ Build failed:', error)
    setBuildStatus('failed')
    setError(`Erreur de build: ${error}`)

    // Message d'erreur détaillé dans le chat
    const errorMessage: Message = {
      role: 'assistant',
      content: `❌ Erreur de build: ${error}`,
      id: `msg-build-error-${Date.now()}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, errorMessage])
  }

  // Effet pour déclencher le build quand projectFiles change
  useEffect(() => {
    if (isMultiFile && projectFiles.length > 0 && buildStatus === 'idle') {
      // Déclencher le build automatiquement après la génération
      const currentProjectId = projectId || `temp-${Date.now()}`
      triggerBuild(projectFiles, currentProjectId)
    }
  }, [projectFiles, isMultiFile, buildStatus, projectId])

  // Polling du build status
  useEffect(() => {
    if (buildStatus === 'building' && buildJobId) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/build?jobId=${buildJobId}`)
          if (response.ok) {
            const data = await response.json()

            if (data.status === 'completed' && data.url) {
              handleBuildComplete(data.url)
              clearInterval(pollInterval)
            } else if (data.status === 'failed') {
              handleBuildError(data.error || 'Build failed')
              clearInterval(pollInterval)
            }
          }
        } catch (error) {
          console.error('Error polling build status:', error)
        }
      }, 2000) // Poll every 2 seconds

      return () => clearInterval(pollInterval)
    }
  }, [buildStatus, buildJobId, handleBuildComplete, handleBuildError])

  const handleModification = async () => {
    if (!input.trim() || isGenerating || !generatedCode) return

    console.log('🔄 Début de la modification...')
    console.log('📝 Demande:', input.substring(0, 100) + (input.length > 100 ? '...' : ''))

    const messageId = `msg-${Date.now()}`
    const userMessage: Message = {
      role: 'user',
      content: input,
      id: messageId,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setCurrentGenerationMessageId(messageId)
    setInput('')
    setIsGenerating(true)
    setError('')
    setSteps([])
    setModifications([])

    try {
      console.log('📤 Envoi de la requête à l\'API...')
      console.log('📦 Type de projet:', isMultiFile ? 'Multi-file React' : 'Single-file HTML')

      const requestBody: any = {
        modification: userMessage.content,
        conversationHistory: messages,
        isMultiFile
      }

      if (isMultiFile) {
        requestBody.projectFiles = projectFiles
        console.log('📁 Envoi de', projectFiles.length, 'fichiers')
      } else {
        requestBody.currentCode = generatedCode
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        console.error('❌ Erreur HTTP:', response.status, response.statusText)
        throw new Error('Erreur de modification')
      }

      console.log('✅ Connexion établie, réception du stream...')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        console.error('❌ Pas de stream disponible')
        throw new Error('Pas de stream disponible')
      }

      let buffer = ''
      let eventCount = 0

      console.log('⏳ Traitement en cours, veuillez patienter...')

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log('✅ Stream terminé, total d\'événements reçus:', eventCount)
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const event = JSON.parse(data)
              eventCount++

              if (event.type === 'step') {
                console.log('📋 Étape:', event.data.description || event.data.step)
                setSteps(prev => {
                  const existingIndex = prev.findIndex(s => s.step === event.data.step)
                  if (existingIndex >= 0) {
                    const newSteps = [...prev]
                    newSteps[existingIndex] = event.data
                    return newSteps
                  }
                  return [...prev, event.data]
                })
              } else if (event.type === 'complete') {
                if (event.data.isMultiFile && event.data.files) {
                  console.log('✅ Modification multi-fichiers terminée!')
                  console.log('📁 Fichiers modifiés:', event.data.files.length)

                  // Mettre à jour les fichiers du projet
                  setProjectFiles(event.data.files)

                  // Mettre à jour la preview (le fichier principal)
                  const mainFile = event.data.files.find((f: any) =>
                    f.path === 'src/App.jsx' || f.path === 'src/main.jsx'
                  ) || event.data.files[0]

                  if (mainFile) {
                    setGeneratedCode(mainFile.content)
                  }

                  console.log('💾 Fichiers mis à jour, la preview va se reconstruire...')
                } else if (event.data.code) {
                  console.log('✅ Modification terminée avec succès!')
                  console.log('📏 Longueur du nouveau code:', event.data.code.length, 'caractères')
                  console.log('💾 Application du nouveau code...')
                  setGeneratedCode(event.data.code)
                }

                const assistantMessage: Message = {
                  role: 'assistant',
                  content: '✨ Modification appliquée avec succès ! Vérifiez la preview.',
                  id: `msg-${Date.now()}`,
                  timestamp: new Date()
                }
                setMessages(prev => [...prev, assistantMessage])
                console.log('🎉 Modification complétée!')
              } else if (event.type === 'error') {
                console.error('❌ Erreur reçue du serveur:', event.data.message)
                throw new Error(event.data.message)
              }
            } catch (e) {
              console.error('❌ Erreur lors du parsing de l\'événement:', e)
              console.error('📄 Données brutes:', data.substring(0, 200))
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ Erreur lors de la modification:', err)
      console.error('💡 Détails:', err instanceof Error ? err.message : 'Erreur inconnue')
      setError(err instanceof Error ? err.message : 'Erreur de modification')

      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Erreur: ${err instanceof Error ? err.message : 'Erreur de modification'}. Veuillez réessayer ou reformuler votre demande.`,
        id: `msg-${Date.now()}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
      console.log('🔚 Fin du processus de modification')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!generatedCode) {
      handleGenerate()
    } else {
      handleModification()
    }
  }

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wapify-app-${Date.now()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetProject = () => {
    setMessages([])
    setGeneratedCode('')
    setGenerationPlan(null)
    setSteps([])
    setError('')
  }

  // Plus besoin de build - Sandpack gère tout automatiquement! 🎉

  // Debug: Log projectFiles changes
  useEffect(() => {
    console.log(`🔍 projectFiles state changed:`, {
      length: projectFiles.length,
      isMultiFile,
      generatedCode: generatedCode ? 'exists' : 'null',
      files: projectFiles.map(f => f.path)
    })
  }, [projectFiles, isMultiFile, generatedCode])

  // Afficher un loader pendant la vérification de l'authentification
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-wapify-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-wapify-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-wapify-text-secondary">Chargement...</p>
        </div>
      </div>
    )
  }

  // Helper functions for file tree
  interface FileNode {
    name: string
    path: string
    type: 'file' | 'folder'
    children?: FileNode[]
    content?: string
  }

  const buildFileTree = (files: Array<{path: string, content: string}>): FileNode[] => {
    const root: FileNode[] = []

    files.forEach(file => {
      const parts = file.path.split('/')
      let currentLevel = root

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1
        const existingNode = currentLevel.find(node => node.name === part)

        if (existingNode) {
          if (!isFile && existingNode.children) {
            currentLevel = existingNode.children
          }
        } else {
          const newNode: FileNode = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: isFile ? 'file' : 'folder',
            children: isFile ? undefined : [],
            content: isFile ? file.content : undefined
          }
          currentLevel.push(newNode)
          if (!isFile && newNode.children) {
            currentLevel = newNode.children
          }
        }
      })
    })

    return root
  }

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath)
      } else {
        newSet.add(folderPath)
      }
      return newSet
    })
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) return '📘'
    if (fileName.endsWith('.jsx') || fileName.endsWith('.js')) return '📜'
    if (fileName.endsWith('.css')) return '🎨'
    if (fileName.endsWith('.json')) return '📋'
    if (fileName.endsWith('.html')) return '🌐'
    return '📄'
  }

  const renderFileTree = (nodes: FileNode[], depth: number = 0): React.ReactElement[] => {
    return nodes.map((node) => {
      if (node.type === 'folder') {
        const isExpanded = expandedFolders.has(node.path)
        return (
          <div key={node.path}>
            <button
              onClick={() => toggleFolder(node.path)}
              className="w-full text-left px-2 py-1 text-sm transition flex items-center"
              style={{
                paddingLeft: `${depth * 12 + 8}px`,
                color: '#CCCCCC'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A2D2E'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span className="mr-1 text-xs">
                {isExpanded ? '▼' : '▶'}
              </span>
              <span className="mr-2">
                {isExpanded ? '📂' : '📁'}
              </span>
              <span>{node.name}</span>
            </button>
            {isExpanded && node.children && (
              <div>
                {renderFileTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        )
      } else {
        const isSelected = selectedFile === node.path
        return (
          <button
            key={node.path}
            onClick={() => {
              setSelectedFile(node.path)
              setFileContent(node.content || '')
            }}
            className="w-full text-left px-2 py-1 text-sm transition flex items-center"
            style={{
              paddingLeft: `${depth * 12 + 24}px`,
              backgroundColor: isSelected ? '#37373D' : 'transparent',
              color: isSelected ? '#FFFFFF' : '#CCCCCC'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = '#2A2D2E'
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span className="mr-2">
              {getFileIcon(node.name)}
            </span>
            {node.name}
          </button>
        )
      }
    })
  }

  // Ne rien afficher si pas de session
  if (!session) {
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-wapify-bg">
      {/* Top Bar */}
      <div className="h-16 bg-wapify-panel border-b-2 border-wapify-border flex items-center justify-between px-6 flex-shrink-0">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
          <div className="w-9 h-9 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-lg flex items-center justify-center text-lg">
            ⚡
          </div>
          <span className="text-xl font-bold text-wapify-text">Wapify</span>
          <span className="text-wapify-text-secondary">/ AI Generator</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Indicateur de sauvegarde */}
          {lastSaved && (
            <div className="text-sm text-wapify-text-secondary flex items-center gap-2">
              {isSaving ? (
                <>
                  <div className="w-2 h-2 bg-wapify-accent rounded-full animate-pulse"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Sauvegardé {lastSaved.toLocaleTimeString()}</span>
                </>
              )}
            </div>
          )}

          {generatedCode && (
            <>
              <button
                onClick={isMultiFile ? downloadProject : downloadCode}
                className="px-4 py-2 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                📥 Télécharger ZIP
              </button>
              <button
                onClick={resetProject}
                className="px-4 py-2 bg-wapify-border text-wapify-text rounded-lg font-semibold hover:bg-red-100 transition"
              >
                🔄 Nouveau
              </button>
            </>
          )}

          {/* User info and logout */}
          <div className="flex items-center gap-3 ml-3 pl-3 border-l-2 border-wapify-border">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-wapify-border text-wapify-text rounded-lg font-semibold hover:bg-wapify-accent/20 transition text-sm"
            >
              📂 Mes Projets
            </Link>
            <div className="text-sm text-wapify-text-secondary">
              {session?.user?.email}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 py-2 bg-wapify-border text-wapify-text rounded-lg font-semibold hover:bg-red-100 transition text-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel - Chat */}
        <div className="w-96 bg-wapify-panel border-r-2 border-wapify-border flex flex-col">
          <div className="p-4 border-b-2 border-wapify-border flex-shrink-0">
            <h2 className="text-lg font-bold text-wapify-text mb-1">💬 Chat avec l'IA</h2>
            <p className="text-sm text-wapify-text-secondary">
              {!generatedCode
                ? 'Décrivez l\'application que vous voulez créer'
                : 'Demandez des modifications en langage naturel'
              }
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✨</div>
                <p className="text-sm text-wapify-text-secondary">
                  Commencez par décrire votre application...
                </p>
              </div>
            )}

            {(() => {
              // Grouper les messages en sections
              const sections: Array<{type: 'user' | 'section' | 'message' | 'final', data: any}> = []
              let currentSection: any = null

              messages.forEach((msg, idx) => {
                if (msg.role === 'user') {
                  sections.push({type: 'user', data: msg})
                } else if (msg.content.startsWith('SECTION_START:')) {
                  const title = msg.content.replace('SECTION_START:', '')
                  currentSection = {title, description: '', substeps: [], thinking: '', id: `section-${idx}`}
                } else if (msg.content.startsWith('ANALYSIS_THINKING:')) {
                  if (currentSection) {
                    currentSection.thinking = msg.content.replace('ANALYSIS_THINKING:', '')
                  }
                } else if (msg.content.startsWith('ANALYSIS_UNDERSTANDING:')) {
                  if (currentSection) {
                    currentSection.description = msg.content.replace('ANALYSIS_UNDERSTANDING:', '')
                  }
                } else if (msg.content.startsWith('ANALYSIS_SECTION:')) {
                  if (currentSection) {
                    currentSection.substeps.push(msg.content.replace('ANALYSIS_SECTION:', ''))
                  }
                } else if (msg.content.startsWith('PLAN_DESCRIPTION:')) {
                  if (currentSection) {
                    currentSection.description = msg.content.replace('PLAN_DESCRIPTION:', '')
                  }
                } else if (msg.content.startsWith('SUBSTEP:')) {
                  if (currentSection) {
                    currentSection.substeps.push(msg.content.replace('SUBSTEP:', ''))
                  }
                } else if (msg.content === 'SECTION_END') {
                  if (currentSection) {
                    sections.push({type: 'section', data: currentSection})
                    currentSection = null
                  }
                } else if (msg.content.startsWith('FINAL_MESSAGE:')) {
                  sections.push({type: 'final', data: {text: msg.content.replace('FINAL_MESSAGE:', '')}})
                } else {
                  // Message normal
                  sections.push({type: 'message', data: msg})
                }
              })

              // Si une section est toujours ouverte, l'ajouter quand même
              if (currentSection) {
                sections.push({type: 'section', data: currentSection})
              }

              return sections.map((section, idx) => {
                if (section.type === 'user') {
                  const msg = section.data
                  return (
                    <div key={idx} className="flex justify-end animate-fadeIn">
                      <div className="max-w-[85%] rounded-lg p-3 bg-wapify-accent text-white shadow-sm">
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  )
                } else if (section.type === 'section') {
                  const data = section.data
                  const isCollapsed = collapsedSections.has(data.id)

                  return (
                    <div key={idx} className="animate-fadeIn">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        {/* Header de section - clickable */}
                        <button
                          onClick={() => {
                            setCollapsedSections(prev => {
                              const next = new Set(prev)
                              if (next.has(data.id)) {
                                next.delete(data.id)
                              } else {
                                next.add(data.id)
                              }
                              return next
                            })
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
                              ▶
                            </span>
                            <h3 className="font-semibold text-gray-800">{data.title}</h3>
                            {data.thinking && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                💭 Réflexion
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Contenu de la section */}
                        {!isCollapsed && (
                          <div className="px-4 pb-3 border-t border-gray-100">
                            {data.description && (
                              <p className="text-sm text-gray-600 mt-3 mb-3">{data.description}</p>
                            )}
                            {data.substeps.length > 0 && (
                              <div className="space-y-1.5 mt-2">
                                {data.substeps.map((substep: string, sidx: number) => (
                                  <div key={sidx} className="flex items-start gap-2 text-sm">
                                    <span className="text-gray-400 text-xs mt-0.5">•</span>
                                    <span className="text-gray-700">{substep}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                } else if (section.type === 'final') {
                  // Message final élégant
                  const data = section.data
                  return (
                    <div key={idx} className="animate-fadeIn">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-lg">✓</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 leading-relaxed">{data.text}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                } else {
                  // Message normal
                  const msg = section.data
                  return (
                    <div key={idx} className="flex justify-start animate-fadeIn">
                      <div className="max-w-[85%] rounded-lg p-3 bg-white border-2 border-wapify-border text-wapify-text shadow-sm">
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  )
                }
              })
            })()}

            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-wapify-border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-wapify-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-wapify-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-wapify-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t-2 border-wapify-border flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={!generatedCode ? "Décrivez votre application en détail : fonctionnalités, pages, composants, interactions..." : "Ex: Ajoute un graphique des ventes..."}
                className="flex-1 px-3 py-2 bg-white border-2 border-wapify-border rounded-lg text-wapify-text placeholder-wapify-text-secondary focus:border-wapify-accent focus:outline-none text-sm resize-y min-h-[80px]"
                disabled={isGenerating}
                rows={3}
              />
              <button
                type="submit"
                disabled={isGenerating || !input.trim()}
                className="px-4 py-2 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed self-end"
              >
                {isGenerating ? '⏳' : '➤'}
              </button>
            </form>
            <div className="text-xs text-wapify-text-secondary mt-1 text-right">
              {input.length} caractères
            </div>
          </div>
        </div>


        {/* Right Panel - Tabs (Preview & Dashboard) */}
        <div className="flex-1 flex flex-col bg-wapify-bg">
          {/* Tabs Navigation */}
          <div className="bg-wapify-panel border-b-2 border-wapify-border flex-shrink-0">
            <div className="flex items-center gap-1 px-4 pt-3">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-6 py-3 rounded-t-lg font-semibold transition ${
                  activeTab === 'preview'
                    ? 'bg-wapify-bg text-wapify-accent border-t-2 border-x-2 border-wapify-border'
                    : 'bg-transparent text-wapify-text-secondary hover:text-wapify-text'
                }`}
              >
                🎨 Preview
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-3 rounded-t-lg font-semibold transition ${
                  activeTab === 'dashboard'
                    ? 'bg-wapify-bg text-wapify-accent border-t-2 border-x-2 border-wapify-border'
                    : 'bg-transparent text-wapify-text-secondary hover:text-wapify-text'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-6 py-3 rounded-t-lg font-semibold transition ${
                  activeTab === 'code'
                    ? 'bg-wapify-bg text-wapify-accent border-t-2 border-x-2 border-wapify-border'
                    : 'bg-transparent text-wapify-text-secondary hover:text-wapify-text'
                }`}
              >
                💻 Code
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 relative overflow-hidden">
            {activeTab === 'code' ? (
              // CODE TAB - IDE
              <div className="w-full h-full flex">
                {/* File Tree */}
                <div className="w-64 overflow-auto border-r" style={{ backgroundColor: '#252526', color: '#CCCCCC', borderColor: '#808080' }}>
                  <div className="p-2 border-b text-xs font-semibold" style={{ borderColor: '#808080', color: '#858585' }}>
                    EXPLORER
                  </div>
                  <div className="p-2">
                    {projectFiles.length > 0 ? (
                      <div>
                        {renderFileTree(buildFileTree(projectFiles))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No files generated yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 flex flex-col">
                  {selectedFile ? (
                    <>
                      <div className="px-4 py-2 text-sm border-b flex items-center justify-between" style={{ backgroundColor: '#3C3C3C', color: '#CCCCCC', borderColor: '#808080' }}>
                        <span>{selectedFile}</span>
                        <button
                          onClick={async () => {
                            if (!projectId) {
                              alert('Please save the project first')
                              return
                            }

                            try {
                              // Update file in state
                              const updatedFiles = projectFiles.map(f =>
                                f.path === selectedFile ? { ...f, content: fileContent } : f
                              )
                              setProjectFiles(updatedFiles)

                              // Save to server
                              const userId = (session?.user as any)?.id || session?.user?.email
                              const response = await fetch(`/api/projects/${projectId}/files`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  userId,
                                  files: updatedFiles
                                })
                              })

                              if (response.ok) {
                                alert('✅ File saved successfully!')
                                setLastSaved(new Date())

                                // Trigger rebuild after save
                                if (window.confirm('File saved! Do you want to rebuild the app to see changes?')) {
                                  await rebuildProject(projectId)
                                }
                              } else {
                                throw new Error('Failed to save file')
                              }
                            } catch (error) {
                              alert('❌ Error saving file: ' + (error as Error).message)
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition"
                        >
                          💾 Save
                        </button>
                      </div>
                      <Editor
                        height="100%"
                        language={
                          selectedFile.endsWith('.tsx') || selectedFile.endsWith('.ts') ? 'typescript' :
                          selectedFile.endsWith('.jsx') || selectedFile.endsWith('.js') ? 'javascript' :
                          selectedFile.endsWith('.css') ? 'css' :
                          selectedFile.endsWith('.json') ? 'json' :
                          selectedFile.endsWith('.html') ? 'html' : 'plaintext'
                        }
                        theme="vs-dark"
                        value={fileContent}
                        onChange={(value) => setFileContent(value || '')}
                        beforeMount={(monaco) => {
                          monaco.editor.defineTheme('vscode-dark-plus', {
                            base: 'vs-dark',
                            inherit: true,
                            rules: [
                              { token: 'comment', foreground: '6A9955' },
                              { token: 'keyword', foreground: '569CD6' },
                              { token: 'string', foreground: 'CE9178' },
                              { token: 'number', foreground: 'B5CEA8' },
                              { token: 'variable', foreground: '9CDCFE' },
                              { token: 'function', foreground: 'DCDCAA' },
                              { token: 'type', foreground: '4EC9B0' },
                            ],
                            colors: {
                              'editor.background': '#1E1E1E',
                              'editor.foreground': '#D4D4D4',
                              'editorCursor.foreground': '#AEAFAD',
                              'editor.lineHighlightBackground': '#333333',
                              'editor.selectionBackground': '#264F78',
                              'editorLineNumber.foreground': '#858585',
                              'editorLineNumber.activeForeground': '#C6C6C6',
                            }
                          })
                          monaco.editor.setTheme('vscode-dark-plus')
                        }}
                        options={{
                          minimap: { enabled: true },
                          fontSize: 14,
                          fontFamily: 'Consolas, "Courier New", monospace',
                          lineHeight: 22,
                          lineNumbers: 'on',
                          roundedSelection: false,
                          scrollBeyondLastLine: false,
                          readOnly: false,
                          automaticLayout: true,
                          cursorBlinking: 'blink',
                          cursorStyle: 'line',
                          matchBrackets: 'always',
                        }}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="text-6xl mb-4">💻</div>
                        <p>Select a file to start editing</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'preview' ? (
              // PREVIEW TAB
              <>
                {generatedCode ? (
                  isMultiFile && projectFiles.length > 0 ? (
                    // Preview React avec Vite Build
                    <div className="w-full h-full relative bg-white">
                      {buildStatus === 'queued' || buildStatus === 'building' ? (
                        // Afficher un loader pendant le build
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Compilation en cours...</p>
                          </div>
                        </div>
                      ) : buildStatus === 'completed' && buildUrl ? (
                        // Afficher l'app compilée
                        <iframe
                          src={buildUrl}
                          className="w-full h-full border-none"
                          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin allow-downloads"
                          title="App Preview"
                        />
                      ) : buildStatus === 'failed' ? (
                        // Afficher l'erreur
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center p-8">
                            <div className="text-6xl mb-4">❌</div>
                            <h3 className="text-2xl font-bold text-red-600 mb-2">Échec du build</h3>
                            <p className="text-gray-600 mb-4">{error || 'Une erreur est survenue'}</p>
                            <button
                              onClick={() => {
                                if (projectId) {
                                  // Projet existant : utiliser rebuildProject pour récupérer les fichiers frais
                                  rebuildProject(projectId)
                                } else if (projectFiles.length > 0) {
                                  // Projet temporaire : utiliser les fichiers du state
                                  setBuildStatus('idle')
                                  triggerBuild(projectFiles, `temp-${Date.now()}`)
                                }
                              }}
                              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                            >
                              🔄 Réessayer
                            </button>
                          </div>
                        </div>
                      ) : (
                        // État idle (ne devrait pas arriver)
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Preview HTML classique avec iframe (legacy, si jamais on supporte HTML)
                    <iframe
                      ref={iframeRef}
                      srcDoc={generatedCode}
                      className="w-full h-full border-none"
                      sandbox="allow-scripts"
                      title="App Preview"
                    />
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-center p-8">
                    <div>
                      <div className="text-6xl mb-4 opacity-50">🚀</div>
                      <h3 className="text-2xl font-bold text-wapify-text mb-2">
                        Décrivez votre app
                      </h3>
                      <p className="text-wapify-text-secondary max-w-md">
                        L'IA va automatiquement choisir le meilleur framework, style et structure de base de données pour votre projet
                      </p>
                      <div className="mt-6 grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
                        <div className="p-3 bg-white border-2 border-wapify-border rounded-lg">
                          <div className="text-sm font-semibold text-wapify-text">✨ Exemples:</div>
                          <div className="text-xs text-wapify-text-secondary mt-1">
                            "Dashboard e-commerce avec graphiques"
                          </div>
                        </div>
                        <div className="p-3 bg-white border-2 border-wapify-border rounded-lg">
                          <div className="text-sm font-semibold text-wapify-text">🤖 IA Intelligente</div>
                          <div className="text-xs text-wapify-text-secondary mt-1">
                            Choisit React, style moderne, DB auto
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // DASHBOARD TAB
              <div className="w-full h-full p-6 overflow-auto bg-white">
                <h3 className="text-2xl font-bold text-wapify-text mb-6">
                  📊 Dashboard du Projet
                </h3>

                {/* Analytics Section */}
                <div className="mb-8 p-6 bg-wapify-bg border-2 border-wapify-border rounded-lg">
                  <h4 className="text-xl font-bold text-wapify-text mb-4">📈 Analytics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white border border-wapify-border rounded-lg">
                      <div className="text-2xl font-bold text-wapify-accent">0</div>
                      <div className="text-sm text-wapify-text-secondary">Utilisateurs actifs</div>
                    </div>
                    <div className="p-4 bg-white border border-wapify-border rounded-lg">
                      <div className="text-2xl font-bold text-wapify-accent">0</div>
                      <div className="text-sm text-wapify-text-secondary">Visites aujourd'hui</div>
                    </div>
                    <div className="p-4 bg-white border border-wapify-border rounded-lg">
                      <div className="text-2xl font-bold text-wapify-accent">-</div>
                      <div className="text-sm text-wapify-text-secondary">Top pays</div>
                    </div>
                    <div className="p-4 bg-white border border-wapify-border rounded-lg">
                      <div className="text-2xl font-bold text-wapify-accent">-</div>
                      <div className="text-sm text-wapify-text-secondary">Device principal</div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-wapify-text-secondary italic">
                    ⚠️ Analytics en temps réel - À implémenter dans Phase 3
                  </p>
                </div>

                {/* Data Management Section */}
                <div className="mb-8 p-6 bg-wapify-bg border-2 border-wapify-border rounded-lg">
                  <h4 className="text-xl font-bold text-wapify-text mb-4">🗄️ Gestion des Données</h4>
                  {hasDatabase && databaseSchema ? (
                    <div>
                      <p className="text-wapify-text mb-4">Base de données détectée pour ce projet</p>
                      <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                        {databaseSchema}
                      </pre>
                      <p className="mt-4 text-sm text-wapify-text-secondary italic">
                        ⚠️ Interface CRUD - À implémenter dans Phase 2
                      </p>
                    </div>
                  ) : (
                    <p className="text-wapify-text-secondary">
                      Aucune base de données détectée pour ce projet
                    </p>
                  )}
                </div>

                {/* API Endpoints Section */}
                <div className="p-6 bg-wapify-bg border-2 border-wapify-border rounded-lg">
                  <h4 className="text-xl font-bold text-wapify-text mb-4">🔌 API Endpoints</h4>
                  <p className="text-wapify-text-secondary mb-4">
                    {projectId ? `Base URL: https://api.wapify.app/v1/${projectId}` : 'Projet non sauvegardé'}
                  </p>
                  <p className="text-sm text-wapify-text-secondary italic">
                    ⚠️ API auto-générée - À implémenter dans Phase 4
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-sm text-red-600">❌ {error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
