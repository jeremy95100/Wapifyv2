import { NextRequest } from 'next/server'
import { generateReactProjectWithSteps } from '../../../lib/anthropic'

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

    // ⚛️ WAPIFY EST MAINTENANT SPÉCIALISÉ DANS REACT UNIQUEMENT
    // Toutes les applications sont générées avec React + Vite

    // Créer un stream pour envoyer les événements en temps réel
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Toujours utiliser le générateur React
          const generator = generateReactProjectWithSteps({ prompt, conversationHistory })

          let projectStructure: any = null

          for await (const event of generator) {
            // Envoyer l'événement au client
            const data = `data: ${JSON.stringify(event)}\n\n`
            controller.enqueue(encoder.encode(data))

            // Pour les projets React multi-file
            if (event.type === 'files') {
              projectStructure = event.data
            }
          }

          // Envoyer la réponse finale pour React
          if (projectStructure) {
            const finalEvent = {
              type: 'complete',
              data: {
                isMultiFile: true,
                files: projectStructure.files,
                hasDatabase: projectStructure.hasDatabase,
                databaseSchema: projectStructure.databaseSchema,
                framework: 'react'
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalEvent)}\n\n`))
          }

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
