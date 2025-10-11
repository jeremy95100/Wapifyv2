import { NextRequest } from 'next/server'
import { generateAppCodeWithSteps } from '../../../lib/anthropic'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, conversationHistory = [] } = body

    // Validation du prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Un prompt valide est requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Vérification de la longueur du prompt
    if (prompt.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Le prompt est trop long (max 2000 caractères)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Créer un stream pour envoyer les événements en temps réel
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = generateAppCodeWithSteps({
            prompt,
            conversationHistory
          })

          let fullCode = ''
          let finalCode = ''

          for await (const event of generator) {
            // Envoyer l'événement au client
            const data = `data: ${JSON.stringify(event)}\n\n`
            controller.enqueue(encoder.encode(data))

            // Accumuler le code brut
            if (event.type === 'code') {
              fullCode += event.data
            }

            // Capturer le code final nettoyé
            if (event.type === 'final_code') {
              finalCode = event.data
            }
          }

          // Envoyer le code final (utiliser finalCode s'il existe, sinon fullCode)
          const finalEvent = {
            type: 'complete',
            data: { code: finalCode || fullCode }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalEvent)}\n\n`))

          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          const errorEvent = {
            type: 'error',
            data: { message: error instanceof Error ? error.message : 'Erreur de génération' }
          }
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
    console.error('Generation error:', error)

    return new Response(
      JSON.stringify({ error: 'Échec de la génération. Veuillez réessayer.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
