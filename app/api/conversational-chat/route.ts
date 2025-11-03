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

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await handleStreamingChat(controller, encoder, message, conversationHistory, currentCode, projectFiles)
        } catch (error) {
          console.error('Streaming error:', error)
          const errorEvent = { type: 'error', data: { message: 'Failed to process chat' } }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in chat route:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

async function handleStreamingChat(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  message: string,
  conversationHistory: any,
  currentCode: any,
  projectFiles: any
) {

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

RÈGLES STRICTES - ABSOLUMENT OBLIGATOIRES :
1. NE RETOURNE JAMAIS, JAMAIS, JAMAIS DE CODE (ni \`\`\`, ni \`, ni aucun code)
2. Réponds UNIQUEMENT avec du texte conversationnel en français
3. Sois concis et direct (2-4 phrases maximum)
4. Explique simplement ce que tu vas créer ou modifier
5. Le code sera généré AUTOMATIQUEMENT après ta réponse par un autre système
6. N'utilise PAS de termes techniques compliqués (API, composants, hooks, etc)
7. Parle comme si tu expliquais à quelqu'un qui ne connaît pas la programmation

EXEMPLE de bonne réponse:
"Je vais créer une application de liste de tâches pour toi ! Elle aura une zone pour ajouter des nouvelles tâches, une liste qui affiche toutes tes tâches avec des cases à cocher pour les marquer comme terminées, et un bouton pour supprimer les tâches. Le design sera moderne et épuré avec des couleurs agréables."

MAUVAIS exemple (NE JAMAIS FAIRE):
"Voici le code: \`\`\`tsx..."

`
      : `You are Wapify AI, an assistant specialized in generating and modifying React applications.

Your role:
- Generate complete React applications from descriptions
- Modify existing applications (colors, styles, text, structure)
- Add new features
- Respond in a simple and natural way, WITHOUT technical jargon

STRICT RULES - ABSOLUTELY MANDATORY:
1. NEVER, EVER, EVER return code (no \`\`\`, no \`, no code at all)
2. Respond ONLY with conversational text in English
3. Be concise and direct (2-4 sentences maximum)
4. Simply explain what you will create or modify
5. The code will be generated AUTOMATICALLY after your response by another system
6. Do NOT use complicated technical terms (API, components, hooks, etc)
7. Talk as if explaining to someone who doesn't know programming

GOOD example response:
"I'll create a todo list app for you! It will have an input area to add new tasks, a list displaying all your tasks with checkboxes to mark them as complete, and a delete button. The design will be modern and clean with pleasant colors."

BAD example (NEVER DO THIS):
"Here's the code: \`\`\`tsx..."

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

    // Stream the thinking event first
    const thinkingEvent = {
      type: 'thinking',
      data: { thinking }
    }
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(thinkingEvent)}\n\n`))

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

    // Now call Claude with streaming for the actual response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages
    })

    let aiResponse = ''

    // Stream the text token by token
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text
        aiResponse += text

        // Stream each token to the client
        const textEvent = {
          type: 'text_delta',
          data: { text }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(textEvent)}\n\n`))
      }
    }

    // Remove any code blocks from the final response
    aiResponse = aiResponse.replace(/```[\s\S]*?```/g, '').trim()
    aiResponse = aiResponse.replace(/`[^`]+`/g, '').trim()

    // Stream the complete text event
    const completeTextEvent = {
      type: 'text_complete',
      data: { text: aiResponse }
    }
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeTextEvent)}\n\n`))

    // Detect if this is asking for code generation/modification
    const needsCodeGeneration = detectCodeGenerationIntent(message, aiResponse)

    // Generate detailed plan if code generation is needed
    if (needsCodeGeneration) {
      const generationPlan = await generateDetailedPlan(message, anthropic)

      if (generationPlan) {
        const planEvent = {
          type: 'plan',
          data: generationPlan
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(planEvent)}\n\n`))
      }
    }

    // Close the stream
    const doneEvent = { type: 'done', data: {} }
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneEvent)}\n\n`))
    controller.close()
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
