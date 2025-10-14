'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import JSZip from 'jszip'
import { GenerationPlan, GenerationStep, ModificationDetail} from '../../lib/anthropic'

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

// Fonction pour générer le HTML de preview React (en dehors du composant)
function generateReactPreviewHTML(files: ProjectFile[]): string {
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
}

export default function EditorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationPlan, setGenerationPlan] = useState<GenerationPlan | null>(null)
  const [steps, setSteps] = useState<GenerationStep[]>([])
  const [subSteps, setSubSteps] = useState<Array<{step: string, status: string, description: string, progress: number}>>([])
  const [modifications, setModifications] = useState<ModificationDetail[]>([])
  const [error, setError] = useState('')
  const [hasAutoGenerated, setHasAutoGenerated] = useState(false)
  const [currentGenerationMessageId, setCurrentGenerationMessageId] = useState<string | null>(null)
  const [showStuckMessage, setShowStuckMessage] = useState(false)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isMultiFile, setIsMultiFile] = useState(false)
  const [projectFiles, setProjectFiles] = useState<Array<{path: string, content: string, type?: string}>>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [hasDatabase, setHasDatabase] = useState(false)
  const [databaseSchema, setDatabaseSchema] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'preview' | 'dashboard'>('preview')
  const [builtPreviewHtml, setBuiltPreviewHtml] = useState<string>('')
  const [isBuilding, setIsBuilding] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const stepsEndRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)
  const lastProgressUpdateTime = useRef<number>(Date.now())
  const stuckMessageTimer = useRef<NodeJS.Timeout | null>(null)

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

  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(messageId)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Highlight temporaire
      messageElement.classList.add('ring-2', 'ring-wapify-accent')
      setTimeout(() => {
        messageElement.classList.remove('ring-2', 'ring-wapify-accent')
      }, 2000)
    }
  }

  // Fonction pour sauvegarder le projet (single-file ou multi-file)
  const saveProject = useCallback(async (code: string, prompt: string) => {
    if ((!code && !isMultiFile) || !prompt || !session?.user?.id) return

    try {
      setIsSaving(true)

      // Utiliser l'ID de l'utilisateur authentifié
      const userId = session.user.id

      if (!projectId) {
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
  }, [projectId, projectName, session, isMultiFile, projectFiles, hasDatabase, databaseSchema])

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
    if (!isGenerating && isMultiFile && projectFiles.length > 0 && messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]
      if (lastUserMessage && !projectId) {
        // Seulement pour les nouveaux projets (pas de projectId encore)
        console.log('💾 Déclenchement sauvegarde auto pour nouveau projet avec', projectFiles.length, 'fichiers')
        console.log('📁 Fichiers à sauvegarder:', projectFiles.map(f => f.path))
        saveProject('', lastUserMessage.content)
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

      if (projectIdFromUrl) {
        // Charger un projet existant
        loadProject(projectIdFromUrl)
      } else if (promptFromUrl && promptFromUrl.trim()) {
        // Ne pas remplir l'input, juste marquer comme auto-généré
        setHasAutoGenerated(true)
        // Lancer la génération immédiatement
        handleGenerateWithPrompt(promptFromUrl)
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
      if (project.framework === 'react' && project.storage_path) {
        console.log(`✅ React project detected with storage_path`)
        // Projet React multi-fichiers
        setIsMultiFile(true)
        setHasDatabase(project.has_database || false)

        // Charger les fichiers depuis l'API
        if (data.files && Array.isArray(data.files)) {
          console.log(`📁 Setting ${data.files.length} files to state`)
          setProjectFiles(data.files)
          setGeneratedCode('multi-file-project') // Indicateur pour afficher Sandpack

          // Sélectionner le premier fichier par défaut
          if (data.files.length > 0) {
            setSelectedFile(data.files[0].path)
          }
        } else {
          console.warn(`⚠️ No files in API response`)
        }
      } else if (project.code) {
        console.log(`📄 HTML single-file project`)
        // Projet HTML single-file
        setIsMultiFile(false)
        setGeneratedCode(project.code)
      } else {
        console.warn(`⚠️ Unknown project type:`, { framework: project.framework, hasCode: !!project.code })
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

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          conversationHistory: messages
        })
      })

      if (!response.ok) {
        throw new Error('Erreur de génération')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Pas de stream disponible')
      }

      let accumulatedCode = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const event = JSON.parse(data)

              if (event.type === 'plan') {
                setGenerationPlan(event.data)
              } else if (event.type === 'modifications') {
                setModifications(event.data)
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
                // Réinitialiser le timer de blocage quand il y a une mise à jour
                lastProgressUpdateTime.current = Date.now()
                setShowStuckMessage(false)

                // Nettoyer l'ancien timer
                if (stuckMessageTimer.current) {
                  clearTimeout(stuckMessageTimer.current)
                }

                // Lancer un nouveau timer de 5 secondes
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
              } else if (event.type === 'code') {
                // Ne plus mettre à jour en temps réel pour éviter l'affichage du markdown
                accumulatedCode += event.data
              } else if (event.type === 'final_code') {
                // Utiliser le code final nettoyé
                console.log('📦 Final code received, length:', event.data.length)
                console.log('📦 First 200 chars:', event.data.substring(0, 200))
                setGeneratedCode(event.data)
              } else if (event.type === 'complete') {
                // Gérer les projets multi-fichiers React ou single-file HTML
                if (event.data.isMultiFile) {
                  console.log('✅ Complete event - React multi-file project')
                  console.log('📁 Files:', event.data.files.length)
                  setIsMultiFile(true)
                  setProjectFiles(event.data.files)
                  setHasDatabase(event.data.hasDatabase || false)
                  setDatabaseSchema(event.data.databaseSchema || null)

                  // Trouver et afficher le fichier App.jsx ou main.jsx par défaut
                  const defaultFile = event.data.files.find((f: any) =>
                    f.path === 'src/App.jsx' || f.path === 'src/main.jsx'
                  ) || event.data.files[0]

                  if (defaultFile) {
                    setSelectedFile(defaultFile.path)
                    setGeneratedCode(defaultFile.content)
                  }
                } else if (event.data.code) {
                  // Single-file HTML project
                  console.log('✅ Complete event with code, length:', event.data.code.length)
                  console.log('✅ First 200 chars:', event.data.code.substring(0, 200))
                  setIsMultiFile(false)
                  setGeneratedCode(event.data.code)
                }

                // Résumé console
                console.log('%c🎉 Génération terminée !', 'font-size: 16px; font-weight: bold; color: #4CAF50;')
                console.log('%c📦 Résumé de l\'application créée:', 'font-weight: bold; color: #2196F3;')
                if (generationPlan) {
                  console.log(`  • Framework: ${generationPlan.framework.toUpperCase()}`)
                  console.log(`  • Style: ${generationPlan.style}`)
                  console.log(`  • Template: ${generationPlan.template}`)
                  if (generationPlan.colorTheme) {
                    console.log(`  • Thème: ${generationPlan.colorTheme.name} (${generationPlan.colorTheme.primary})`)
                  }
                  if (generationPlan.entities.length > 0) {
                    console.log(`  • Entités BD: ${generationPlan.entities.map(e => e.name).join(', ')}`)
                  }
                  if (generationPlan.features.length > 0) {
                    console.log(`  • Features: ${generationPlan.features.slice(0, 3).join(', ')}`)
                  }
                }
                console.log(`  • Lignes de code: ${event.data.code ? Math.round(event.data.code.length / 50) : '?'}`)
                console.log('%c💬 N\'hésitez pas à demander des modifications !', 'font-style: italic; color: #FF9800;')

                // Ajouter la réponse de l'assistant
                const assistantMessage: Message = {
                  role: 'assistant',
                  content: 'Application générée avec succès ! Vous pouvez la voir dans la preview et demander des modifications.',
                  id: `msg-${Date.now()}`,
                  timestamp: new Date()
                }
                setMessages(prev => [...prev, assistantMessage])
              } else if (event.type === 'error') {
                throw new Error(event.data.message)
              }
            } catch (e) {
              console.error('Error parsing event:', e)
            }
          }
        }
      }
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

  // Build automatique du preview React (appelle l'API server-side)
  useEffect(() => {
    if (!isMultiFile || projectFiles.length === 0) {
      return
    }

    // Si pas de projectId, utiliser un ID temporaire pour le cache
    const currentProjectId = projectId || 'temp-' + Date.now()

    const buildPreview = async () => {
      setIsBuilding(true)
      console.log('🔨 Building preview for project:', currentProjectId)

      try {
        const response = await fetch('/api/build-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: projectFiles,
            projectId: currentProjectId
          })
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('❌ Build failed:', error)
          setBuiltPreviewHtml(`<div style="padding: 20px; color: red;">Erreur de build: ${error.details || error.error}</div>`)
          return
        }

        const { html } = await response.json()
        console.log('📦 HTML reçu:', html.length, 'bytes')
        console.log('📝 Premiers 200 chars:', html.substring(0, 200))
        setBuiltPreviewHtml(html)
        console.log('✅ Preview built successfully')
      } catch (error) {
        console.error('❌ Build error:', error)
        setBuiltPreviewHtml(`<div style="padding: 20px; color: red;">Erreur de build: ${error instanceof Error ? error.message : 'Unknown error'}</div>`)
      } finally {
        setIsBuilding(false)
      }
    }

    // Petit délai pour éviter de rebuilder trop souvent pendant la génération
    const timer = setTimeout(buildPreview, 500)
    return () => clearTimeout(timer)
  }, [projectFiles, projectId, isMultiFile])

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

            {messages.map((msg, idx) => (
              <div
                key={idx}
                id={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} transition-all duration-300 rounded-lg`}
              >
                <div className={`max-w-[85%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-wapify-accent text-white'
                    : 'bg-white border-2 border-wapify-border text-wapify-text'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

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
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={!generatedCode ? "Ex: Un dashboard e-commerce..." : "Ex: Ajoute un graphique des ventes..."}
                className="flex-1 px-3 py-2 bg-white border-2 border-wapify-border rounded-lg text-wapify-text placeholder-wapify-text-secondary focus:border-wapify-accent focus:outline-none text-sm"
                disabled={isGenerating}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={isGenerating || !input.trim()}
                className="px-4 py-2 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? '⏳' : '➤'}
              </button>
            </form>
            <div className="text-xs text-wapify-text-secondary mt-1 text-right">
              {input.length}/500
            </div>
          </div>
        </div>

        {/* Middle Panel - Generation Steps */}
        {(isGenerating || generationPlan || steps.length > 0) && (
          <div className="w-80 bg-white border-r-2 border-wapify-border flex flex-col overflow-y-auto">
            <div className="p-4 border-b-2 border-wapify-border sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-wapify-text mb-1">
                {generatedCode ? '✨ Modification en cours' : '🔨 Création en cours'}
              </h3>
              <p className="text-sm text-wapify-text-secondary">
                {generatedCode ? 'Étapes de modification' : 'Étapes de génération'}
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Plan de génération */}
              {generationPlan && (
                <div className="bg-wapify-accent/10 border-2 border-wapify-accent/30 rounded-lg p-4">
                  <h4 className="font-bold text-wapify-accent-dark mb-2">📋 Plan détecté</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">Framework:</span> {generationPlan.framework.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold">Style:</span> {generationPlan.style}
                    </div>
                    <div>
                      <span className="font-semibold">Template:</span> {generationPlan.template}
                    </div>
                    {generationPlan.colorTheme && (
                      <div>
                        <span className="font-semibold">Thème:</span> {generationPlan.colorTheme.name}
                        <div className="flex gap-1.5 mt-1.5">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: generationPlan.colorTheme.primary }}
                            title={`Primary: ${generationPlan.colorTheme.primary}`}
                          ></div>
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: generationPlan.colorTheme.secondary }}
                            title={`Secondary: ${generationPlan.colorTheme.secondary}`}
                          ></div>
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: generationPlan.colorTheme.accent }}
                            title={`Accent: ${generationPlan.colorTheme.accent}`}
                          ></div>
                        </div>
                      </div>
                    )}
                    {generationPlan.entities.length > 0 && (
                      <div>
                        <span className="font-semibold">Entités DB:</span>
                        <ul className="ml-4 mt-1">
                          {generationPlan.entities.map((entity, idx) => (
                            <li key={idx} className="text-xs">• {entity.name} ({entity.fields.length} champs)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modifications détaillées */}
              {modifications.length > 0 && (
                <div className="bg-white border-2 border-wapify-border rounded-lg p-4">
                  <h4 className="font-bold text-wapify-text mb-3">
                    Modifications apportées
                  </h4>
                  <div className="space-y-2.5">
                    {modifications.map((mod, idx) => {
                      const dotColors = {
                        created: 'bg-green-500',
                        modified: 'bg-blue-500',
                        deleted: 'bg-red-500'
                      }
                      const textColors = {
                        created: 'text-green-700',
                        modified: 'text-blue-700',
                        deleted: 'text-red-700'
                      }
                      return (
                        <div key={idx} className="flex items-start gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${dotColors[mod.action]} mt-1.5 flex-shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm ${textColors[mod.action]}`}>
                              {mod.name}
                            </div>
                            <div className="text-xs text-wapify-text-secondary mt-0.5 leading-relaxed">
                              {mod.description}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Étapes principales - Compactées si terminées */}
              <div className="space-y-2">
                {steps.map((step, idx) => {
                  const isCompleted = step.status === 'completed'
                  const isInProgress = step.status === 'in_progress'

                  return (
                    <div key={idx} className={`transition-all duration-300 ${isCompleted ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isInProgress
                            ? 'bg-wapify-accent text-white animate-pulse'
                            : 'bg-wapify-border text-wapify-text-secondary'
                        }`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm ${
                            isCompleted
                              ? 'text-green-600'
                              : isInProgress
                              ? 'text-wapify-accent'
                              : 'text-wapify-text-secondary'
                          }`}>
                            {step.step}
                          </div>
                          {!isCompleted && (
                            <div className="text-xs text-wapify-text-secondary mt-0.5">
                              {step.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Sous-étapes avec barre de progression */}
              {subSteps.length > 0 && (
                <div className="mt-4 space-y-3">
                  {subSteps.map((subStep, idx) => {
                    const isCompleted = subStep.status === 'completed'
                    const isInProgress = subStep.status === 'in_progress'

                    if (isCompleted && idx < subSteps.length - 1) {
                      // Étapes complétées sauf la dernière - version compacte
                      return (
                        <div key={idx} className="flex items-center gap-2 opacity-60">
                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[10px]">✓</span>
                          </div>
                          <div className="text-xs text-green-600 font-medium truncate">{subStep.step}</div>
                        </div>
                      )
                    }

                    // Dernière étape complétée ou étape en cours - version détaillée
                    const isLastStep = idx === subSteps.length - 1
                    const showProgressBar = !isLastStep || subStep.progress > 0

                    return (
                      <div key={idx} className="bg-gradient-to-r from-wapify-accent/10 to-transparent border-l-4 border-wapify-accent rounded-r-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted ? 'bg-green-500' : 'bg-wapify-accent animate-pulse'
                            }`}>
                              <span className="text-white text-xs">{isCompleted ? '✓' : '⋯'}</span>
                            </div>
                            <div className={`font-bold text-sm ${isCompleted ? 'text-green-600' : 'text-wapify-accent'}`}>
                              {subStep.step}
                            </div>
                          </div>
                          {showProgressBar && (
                            <div className={`text-xs font-bold ${isCompleted ? 'text-green-600' : 'text-wapify-accent'}`}>
                              {subStep.progress}%
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-wapify-text-secondary mb-2">
                          {subStep.description}
                        </div>
                        {/* Barre de progression ou message rassurant */}
                        {showProgressBar ? (
                          <div className="h-2 bg-wapify-border rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ease-out ${
                                isCompleted ? 'bg-green-500' : 'bg-wapify-accent'
                              }`}
                              style={{ width: `${subStep.progress}%` }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-wapify-accent animate-pulse">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-wapify-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-1.5 h-1.5 bg-wapify-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-1.5 h-1.5 bg-wapify-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-xs font-medium">Encore quelques secondes...</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Message rassurant si bloqué > 5 secondes */}
              {showStuckMessage && isGenerating && (
                <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-blue-900">L'IA travaille dur...</div>
                      <div className="text-xs text-blue-700 mt-0.5">Génération de code complexe en cours, encore quelques instants !</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Message "Tâches terminées" quand la génération est finie */}
              {!isGenerating && generatedCode && steps.length > 0 && (
                <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg">✓</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-green-900">Tâches terminées !</div>
                      <div className="text-xs text-green-700 mt-0.5">Votre application est prête. Consultez la console pour plus de détails.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ref pour l'auto-scroll */}
              <div ref={stepsEndRef} />
            </div>
          </div>
        )}

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
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 relative overflow-hidden">
            {activeTab === 'preview' ? (
              // PREVIEW TAB
              <>
                {generatedCode ? (
                  isMultiFile && projectFiles.length > 0 ? (
                    // Preview React - Affichage du rendu uniquement
                    <div className="w-full h-full relative">
                      {isBuilding && (
                        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                          <div className="text-center">
                            <div className="w-12 h-12 border-4 border-wapify-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-wapify-text-secondary font-semibold">Build en cours...</p>
                          </div>
                        </div>
                      )}
                      <iframe
                        ref={iframeRef}
                        srcDoc={builtPreviewHtml || '<div style="padding: 20px; color: #999;">En attente du build...</div>'}
                        className="w-full h-full border-none bg-white"
                        sandbox="allow-scripts allow-modals"
                        title="React App Preview"
                      />
                    </div>
                  ) : (
                    // Preview HTML classique avec iframe
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
