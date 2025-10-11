import { NextRequest } from 'next/server'
import { modifyAppCode, ModificationDetail } from '../../../lib/anthropic'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Fonction pour analyser la demande de modification et extraire les détails
function analyzeModificationRequest(modification: string): ModificationDetail[] {
  const modifications: ModificationDetail[] = []
  const lowerMod = modification.toLowerCase()

  // Détection de modifications de style
  if (lowerMod.includes('couleur') || lowerMod.includes('color') || lowerMod.includes('rouge') ||
      lowerMod.includes('bleu') || lowerMod.includes('vert') || lowerMod.includes('style')) {
    modifications.push({
      type: 'style',
      name: 'Styles visuels',
      action: 'modified',
      description: 'Couleurs et apparence modifiées'
    })
  }

  // Détection d'ajout de composants/éléments
  if (lowerMod.includes('ajoute') || lowerMod.includes('ajout') || lowerMod.includes('add')) {
    if (lowerMod.includes('bouton') || lowerMod.includes('button')) {
      modifications.push({
        type: 'component',
        name: 'Nouveau bouton',
        action: 'created',
        description: 'Bouton ajouté à l\'interface'
      })
    }
    if (lowerMod.includes('graphique') || lowerMod.includes('chart')) {
      modifications.push({
        type: 'feature',
        name: 'Graphique',
        action: 'created',
        description: 'Visualisation de données ajoutée'
      })
    }
    if (lowerMod.includes('formulaire') || lowerMod.includes('form')) {
      modifications.push({
        type: 'component',
        name: 'Formulaire',
        action: 'created',
        description: 'Formulaire de saisie ajouté'
      })
    }
    if (lowerMod.includes('tableau') || lowerMod.includes('table')) {
      modifications.push({
        type: 'component',
        name: 'Tableau',
        action: 'created',
        description: 'Tableau de données ajouté'
      })
    }
    if (lowerMod.includes('section') || lowerMod.includes('paragraphe') || lowerMod.includes('texte')) {
      modifications.push({
        type: 'component',
        name: 'Contenu textuel',
        action: 'created',
        description: 'Nouveau contenu ajouté'
      })
    }
  }

  // Détection de suppression
  if (lowerMod.includes('supprime') || lowerMod.includes('enlève') || lowerMod.includes('retire') || lowerMod.includes('remove')) {
    modifications.push({
      type: 'component',
      name: 'Élément supprimé',
      action: 'deleted',
      description: 'Élément retiré de l\'interface'
    })
  }

  // Détection de modification de page
  if (lowerMod.includes('page') || lowerMod.includes('layout') || lowerMod.includes('structure')) {
    modifications.push({
      type: 'page',
      name: 'Structure de page',
      action: 'modified',
      description: 'Organisation de la page modifiée'
    })
  }

  // Si aucune modification détectée, ajouter une modification générique
  if (modifications.length === 0) {
    modifications.push({
      type: 'feature',
      name: 'Modification générale',
      action: 'modified',
      description: modification.substring(0, 50) + '...'
    })
  }

  return modifications
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentCode, modification, conversationHistory = [] } = body

    // Validation
    if (!currentCode || typeof currentCode !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Code actuel requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!modification || typeof modification !== 'string' || modification.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message de modification requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Créer un stream pour les modifications
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Étape 1: Analyse de la modification
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'step',
            data: {
              step: 'Analyse de votre modification',
              status: 'in_progress',
              description: 'Compréhension de la demande'
            }
          })}\n\n`))

          await new Promise(resolve => setTimeout(resolve, 500))

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'step',
            data: {
              step: 'Analyse de votre modification',
              status: 'completed',
              description: 'Modification comprise'
            }
          })}\n\n`))

          // Étape 2: Analyser le type de modification demandée
          const modifications = analyzeModificationRequest(modification)

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'modifications',
            data: modifications
          })}\n\n`))

          // Étape 3: Application des modifications
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'step',
            data: {
              step: 'Application des modifications',
              status: 'in_progress',
              description: 'Modification du code en cours'
            }
          })}\n\n`))

          // Appeler l'API pour modifier le code
          const modifiedCode = await modifyAppCode(currentCode, modification, conversationHistory)

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'step',
            data: {
              step: 'Application des modifications',
              status: 'completed',
              description: 'Code modifié avec succès'
            }
          })}\n\n`))

          // Étape 3: Finalisation
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'step',
            data: {
              step: 'Finalisation',
              status: 'in_progress',
              description: 'Mise à jour de la preview'
            }
          })}\n\n`))

          await new Promise(resolve => setTimeout(resolve, 300))

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'step',
            data: {
              step: 'Finalisation',
              status: 'completed',
              description: 'Modification appliquée !'
            }
          })}\n\n`))

          // Envoyer le code modifié
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            data: { code: modifiedCode }
          })}\n\n`))

          controller.close()
        } catch (error) {
          console.error('Modification error:', error)
          const errorEvent = {
            type: 'error',
            data: { message: error instanceof Error ? error.message : 'Erreur de modification' }
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
    console.error('Chat error:', error)

    return new Response(
      JSON.stringify({ error: 'Échec de la modification. Veuillez réessayer.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
