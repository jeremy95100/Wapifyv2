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

    // Universal system prompt that works for ALL languages
    let systemPrompt = `You are Wapify AI, an assistant specialized in generating and modifying React applications.

Your role:
- Generate complete React applications from descriptions
- Modify existing applications (colors, styles, text, structure)
- Add new features
- Have REAL CONVERSATIONS with users to understand their needs
- Ask clarifying questions when needed
- Remember the entire conversation context
- Respond in a simple and natural way, WITHOUT technical jargon

CRITICAL LANGUAGE RULE:
- ALWAYS respond in the SAME LANGUAGE as the user's message
- If user writes in French → respond in French
- If user writes in English → respond in English
- If user writes in Spanish → respond in Spanish
- If user writes in Chinese → respond in Chinese
- If user writes in Arabic → respond in Arabic
- If user writes in ANY language → respond in THAT language

CONVERSATION MEMORY:
- You have access to the FULL conversation history below
- Remember ALL previous requests and modifications
- Build upon previous exchanges
- Reference earlier parts of the conversation when relevant
- Understand iterative refinements ("make it darker", "add more spacing", etc.)

STRICT RULES - ABSOLUTELY MANDATORY:
1. NEVER, EVER, EVER return code (no \`\`\`, no \`, no code at all)
2. Respond ONLY with conversational text in the user's language
3. Be concise and direct (2-4 sentences maximum)
4. Simply explain what you will create or modify
5. The code will be generated AUTOMATICALLY after your response by another system
6. Do NOT use complicated technical terms (API, components, hooks, etc)
7. Talk as if explaining to someone who doesn't know programming

GOOD example responses:
- English: "I'll create a todo list app for you! It will have an input area to add new tasks, a list displaying all your tasks with checkboxes to mark them as complete, and a delete button. The design will be modern and clean with pleasant colors."
- French: "Je vais créer une application de liste de tâches pour toi ! Elle aura une zone pour ajouter des nouvelles tâches, une liste qui affiche toutes tes tâches avec des cases à cocher pour les marquer comme terminées, et un bouton pour supprimer les tâches."
- Spanish: "¡Voy a crear una aplicación de lista de tareas para ti! Tendrá un área para agregar nuevas tareas, una lista que muestra todas tus tareas con casillas para marcarlas como completadas y un botón para eliminar tareas."

BAD example (NEVER DO THIS):
"Here's the code: \`\`\`tsx..."

`

    // Add conversation context summary if there's history
    if (conversationHistory && conversationHistory.length > 1) {
      systemPrompt += `\n--- CONVERSATION CONTEXT ---\n`
      systemPrompt += `You have been having a conversation with this user. Here's what happened so far:\n`

      // Summarize key points from conversation
      const userMessages = conversationHistory.filter((msg: any) => msg.role === 'user')
      if (userMessages.length > 0) {
        systemPrompt += `\nUser's previous requests:\n`
        userMessages.slice(-5).forEach((msg: any, idx: number) => {
          systemPrompt += `${idx + 1}. ${msg.content}\n`
        })
      }
      systemPrompt += `\nUse this context to understand the user's current request better.\n`
      systemPrompt += `If they say "change it to blue" - you should know what "it" refers to from context.\n`
      systemPrompt += `If they say "make it bigger" - you should remember what element they're talking about.\n`
      systemPrompt += `---\n\n`
    }

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
    // Universal prompt that adapts to user's language
    const thinkingPrompt = `Analyze this user request and explain what you understood as key points.

IMPORTANT: Respond in the SAME LANGUAGE as the user's message.

User's message:
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

    // First, check if the request is too vague and needs clarification
    const isVagueRequest = await detectVagueRequest(message, aiResponse, anthropic)

    if (isVagueRequest.isVague && isVagueRequest.clarifyingQuestions) {
      // Send clarifying questions event instead of generating code
      const clarifyEvent = {
        type: 'needs_clarification',
        data: {
          questions: isVagueRequest.clarifyingQuestions,
          reason: isVagueRequest.reason
        }
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(clarifyEvent)}\n\n`))

      // Close the stream - don't generate code yet
      const doneEvent = { type: 'done', data: {} }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneEvent)}\n\n`))
      controller.close()
      return
    }

    // Detect if this is asking for code generation/modification
    const needsCodeGeneration = detectCodeGenerationIntent(message)

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

// Detect if the user's request is too vague and needs clarification
async function detectVagueRequest(userMessage: string, _aiResponse: string, anthropic: Anthropic): Promise<{
  isVague: boolean
  clarifyingQuestions?: string[]
  reason?: string
}> {
  const lowerMessage = userMessage.toLowerCase()

  // Very short messages (less than 3 words) are often vague
  const wordCount = userMessage.trim().split(/\s+/).length
  if (wordCount < 3) {
    return { isVague: false } // Too short to judge, let it pass
  }

  // Vague keywords that suggest unclear intent
  const vagueKeywords = [
    'quelque chose', 'something', 'trucs', 'stuff', 'ça', 'ca', 'that',
    'améliore', 'améliorer', 'improve', 'mieux', 'better',
    'plus joli', 'prettier', 'nicer', 'plus beau',
    'moderne', 'modern', 'cool', 'stylé',
  ]

  // Extremely generic requests
  const genericPatterns = [
    /change\s*(le|la|les)?\s*(couleur|style|design)/i,
    /modifie\s*ça/i,
    /fais\s*(quelque\s*chose|un\s*truc)/i,
    /améliore/i,
  ]

  const hasVagueKeyword = vagueKeywords.some(keyword => lowerMessage.includes(keyword))
  const hasGenericPattern = genericPatterns.some(pattern => pattern.test(lowerMessage))

  // If message is reasonably detailed (>10 words), probably not vague
  if (wordCount > 10 && !hasVagueKeyword) {
    return { isVague: false }
  }

  // Ask Claude to analyze if the request needs clarification
  if (hasVagueKeyword || hasGenericPattern || wordCount < 6) {
    try {
      const clarificationPrompt = `Analyze this user request and determine if it's too vague to execute without asking clarifying questions.

User request: "${userMessage}"

Consider a request vague if:
- It lacks specific details about WHAT to change/create
- Colors/styles mentioned without specifics (which element? what exact color?)
- Generic terms like "improve", "make it better", "something" without details
- No clear target element or feature specified

Respond with JSON (no markdown):
{
  "isVague": true/false,
  "reason": "Brief explanation in the user's language",
  "questions": [
    "Specific clarifying question 1 in user's language",
    "Specific clarifying question 2 in user's language",
    "Specific clarifying question 3 in user's language"
  ]
}

If isVague is false, only include: {"isVague": false}

IMPORTANT:
- Respond in the SAME LANGUAGE as the user's request
- Ask specific, actionable questions
- Maximum 3-4 questions
- Questions should help narrow down the exact request`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: clarificationPrompt
        }]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        let jsonText = content.text.trim()
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

        const analysis = JSON.parse(jsonText)

        if (analysis.isVague) {
          return {
            isVague: true,
            clarifyingQuestions: analysis.questions || [],
            reason: analysis.reason || 'La demande nécessite plus de détails'
          }
        }
      }
    } catch (error) {
      console.error('Error detecting vague request:', error)
      // If analysis fails, let it proceed (fail open)
      return { isVague: false }
    }
  }

  return { isVague: false }
}

// Detect if the user's message requires actual code generation/modification
function detectCodeGenerationIntent(userMessage: string): boolean {
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
