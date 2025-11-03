import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory, currentCode, projectFiles } = await req.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not configured')
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 503 }
      )
    }

    // Detect user language
    const detectLanguage = (text: string): string => {
      const frenchWords = ['le', 'la', 'les', 'un', 'une', 'des', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'est', 'sont', 'avoir', 'être', 'faire', 'créer', 'modifier', 'ajouter', 'bouton', 'page', 'couleur']
      const englishWords = ['the', 'a', 'an', 'is', 'are', 'can', 'will', 'create', 'add', 'modify', 'button', 'page', 'color', 'make', 'change']

      const lowerText = text.toLowerCase()
      const frenchCount = frenchWords.filter(word => lowerText.includes(word)).length
      const englishCount = englishWords.filter(word => lowerText.includes(word)).length

      return frenchCount > englishCount ? 'fr' : 'en'
    }

    const userLanguage = detectLanguage(message)

    // Build context for Claude based on detected language
    let systemPrompt = userLanguage === 'fr'
      ? `Tu es Wapify AI, un assistant spécialisé dans la génération et modification d'applications React.

Ton rôle :
- Générer des applications React complètes à partir de descriptions
- Modifier des applications existantes (couleurs, styles, textes, structure)
- Ajouter de nouvelles fonctionnalités
- Répondre de manière simple et naturelle, SANS jargon technique

IMPORTANT :
- Réponds en français de manière conversationnelle
- Sois concis et direct (2-4 phrases maximum)
- NE RETOURNE JAMAIS DE CODE dans ta réponse
- Explique simplement ce que tu vas créer ou modifier
- Ne pose des questions que si vraiment nécessaire pour clarifier
- N'utilise PAS de termes techniques compliqués
- Le code sera généré automatiquement après ta réponse

`
      : `You are Wapify AI, an assistant specialized in generating and modifying React applications.

Your role:
- Generate complete React applications from descriptions
- Modify existing applications (colors, styles, text, structure)
- Add new features
- Respond in a simple and natural way, WITHOUT technical jargon

IMPORTANT:
- Respond in English in a conversational manner
- Be concise and direct (2-4 sentences maximum)
- NEVER return code in your response
- Simply explain what you will create or modify
- Only ask questions if really necessary for clarification
- Do NOT use complicated technical terms
- The code will be generated automatically after your response

`

    // Add current code context if available
    if (currentCode) {
      systemPrompt += `\nCode actuel de l'application (single-file):\n${currentCode.substring(0, 3000)}\n`
    }

    if (projectFiles && projectFiles.length > 0) {
      systemPrompt += `\nFichiers du projet multi-fichiers:\n`
      projectFiles.slice(0, 5).forEach((file: any) => {
        systemPrompt += `\n--- ${file.path} ---\n${file.content.substring(0, 1000)}\n`
      })
    }

    // First, ask Claude to think about what the user wants (understanding phase)
    const thinkingPrompt = userLanguage === 'fr'
      ? `Analyse cette demande et explique ce que tu as compris sous forme de points clés:

"${message}"

Format ta réponse comme ceci:
• Point clé 1
• Point clé 2
• Point clé 3 (si nécessaire)

Utilise un langage simple, sans jargon technique. Sois concis (3-4 points maximum).`
      : `Analyze this request and explain what you understood as key points:

"${message}"

Format your response like this:
• Key point 1
• Key point 2
• Key point 3 (if needed)

Use simple language, no technical jargon. Be concise (3-4 points maximum).`

    const thinkingResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: thinkingPrompt
      }]
    })

    let thinking = ''
    const thinkingContent = thinkingResponse.content[0]
    if (thinkingContent.type === 'text') {
      thinking = thinkingContent.text
    }

    // Build conversation history for Claude
    const messages: Anthropic.MessageParam[] = []

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })
      })
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    })

    // Now call Claude for the actual response
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages
    })

    const content = response.content[0]
    let aiResponse = ''

    if (content.type === 'text') {
      aiResponse = content.text
    }

    // Detect if this is asking for code generation/modification
    const needsCodeGeneration = detectCodeGenerationIntent(message, aiResponse)

    // Generate detailed plan if code generation is needed
    let generationPlan = null
    if (needsCodeGeneration) {
      generationPlan = await generateDetailedPlan(message, anthropic)
    }

    return NextResponse.json({
      response: aiResponse,
      thinking: thinking,
      needsCodeGeneration,
      generationPlan
    })

  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

// Detect if the user's message requires actual code generation/modification
function detectCodeGenerationIntent(userMessage: string, aiResponse: string): boolean {
  const lowerMessage = userMessage.toLowerCase()

  // Strong action keywords that clearly indicate code modification
  const strongActionKeywords = [
    'change', 'modifie', 'modifier', 'ajoute', 'ajouter', 'add', 'remove', 'enlève', 'enleve',
    'supprime', 'remplace', 'replace', 'crée', 'créer', 'cree', 'creer', 'create',
    'fais', 'faire', 'fait', 'mets', 'mettre', 'met', 'rends', 'rendre'
  ]

  // Visual/style modification keywords
  const styleKeywords = [
    'couleur', 'color', 'style', 'taille', 'size', 'police', 'font',
    'background', 'fond', 'border', 'bordure', 'padding', 'margin',
    'rouge', 'bleu', 'vert', 'jaune', 'noir', 'blanc', 'orange', 'violet',
    'red', 'blue', 'green', 'yellow', 'black', 'white'
  ]

  // UI element keywords
  const uiKeywords = [
    'bouton', 'button', 'page', 'component', 'composant', 'section',
    'header', 'footer', 'menu', 'navbar', 'formulaire', 'form',
    'input', 'champ', 'texte', 'text', 'image', 'icon', 'icone', 'icône'
  ]

  // Feature/functionality keywords
  const featureKeywords = [
    'fonction', 'fonctionnalité', 'fonctionnalite', 'feature',
    'animation', 'transition', 'effet', 'effect', 'interaction'
  ]

  // Check for strong action verbs
  const hasStrongAction = strongActionKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    return regex.test(lowerMessage)
  })

  // Check for style modifications
  const hasStyleIntent = styleKeywords.some(keyword =>
    lowerMessage.includes(keyword)
  )

  // Check for UI element mentions
  const hasUIIntent = uiKeywords.some(keyword =>
    lowerMessage.includes(keyword)
  )

  // Check for feature additions
  const hasFeatureIntent = featureKeywords.some(keyword =>
    lowerMessage.includes(keyword)
  )

  // Check if it's purely a question (less likely to need code generation)
  const questionStarters = ['comment', 'pourquoi', 'quoi', 'what', 'why', 'how', 'est-ce que', 'c\'est quoi']
  const isPureQuestion = (lowerMessage.includes('?') ||
    questionStarters.some(q => lowerMessage.startsWith(q))) &&
    !hasStrongAction

  // If it's a pure question without action intent, no code generation needed
  if (isPureQuestion && !hasStrongAction) {
    return false
  }

  // If strong action + any modification context = needs code generation
  if (hasStrongAction && (hasStyleIntent || hasUIIntent || hasFeatureIntent)) {
    return true
  }

  // If has strong action alone, probably needs code generation
  if (hasStrongAction) {
    return true
  }

  // Otherwise, no code generation needed (pure conversation)
  return false
}

// Generate a detailed plan of what will be created
async function generateDetailedPlan(userMessage: string, anthropic: Anthropic) {
  try {
    const planningPrompt = `Analyse cette demande et génère un plan détaillé de ce qui va être créé.

Demande de l'utilisateur: "${userMessage}"

Retourne un JSON avec cette structure exacte (SANS markdown, juste le JSON brut):
{
  "tasks": [
    {
      "id": "task-1",
      "title": "Nom court de la tâche",
      "description": "Description simple sans jargon technique",
      "type": "page" | "component" | "database" | "style",
      "status": "pending"
    }
  ]
}

Règles:
- Utilise un langage simple et compréhensible
- PAS de termes techniques (API, composants React, etc)
- Décris QUOI sera créé, pas COMMENT
- Type "page" pour les pages
- Type "component" pour les éléments réutilisables (formulaire, menu, etc)
- Type "database" pour le stockage de données
- Type "style" pour l'apparence générale
- Maximum 8 tâches

Exemple pour "créer une app de blog":
{
  "tasks": [
    {"id": "task-1", "title": "Page d'accueil", "description": "Affiche la liste des articles de blog", "type": "page", "status": "pending"},
    {"id": "task-2", "title": "Page d'article", "description": "Affiche le contenu complet d'un article", "type": "page", "status": "pending"},
    {"id": "task-3", "title": "Formulaire d'écriture", "description": "Permet d'écrire et publier un nouvel article", "type": "component", "status": "pending"},
    {"id": "task-4", "title": "Menu de navigation", "description": "Permet de naviguer entre les pages", "type": "component", "status": "pending"},
    {"id": "task-5", "title": "Stockage des articles", "description": "Sauvegarde les articles créés", "type": "database", "status": "pending"},
    {"id": "task-6", "title": "Design et couleurs", "description": "Applique un style moderne et professionnel", "type": "style", "status": "pending"}
  ]
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: planningPrompt
      }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      // Extract JSON from response (in case Claude adds markdown)
      let jsonText = content.text.trim()

      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

      const plan = JSON.parse(jsonText)
      return plan
    }

    return null
  } catch (error) {
    console.error('Error generating plan:', error)
    return null
  }
}
