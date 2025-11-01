/**
 * Generator worker - Génération de projets React sans limite de temps
 * Tourne sur Railway avec Redis/BullMQ
 * Publie les événements en temps réel via Redis PubSub pour SSE streaming
 */

import Anthropic from '@anthropic-ai/sdk'
import { Redis } from 'ioredis'
import { generateReactProject, fixTypographicApostrophes } from './react-generator.ts'

// Initialiser Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is not set!')
  process.exit(1)
}

// Initialiser Redis Publisher pour événements temps réel
const publisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

/**
 * Publier un événement dans Redis PubSub pour streaming SSE
 */
async function publishEvent(jobId, type, data) {
  if (!jobId) return

  try {
    await publisher.publish(`job:${jobId}`, JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('Failed to publish event:', error)
  }
}

/**
 * Générer un projet React complet avec événements temps réel
 * @param {Object} params
 * @param {string} params.prompt - Le prompt utilisateur
 * @param {string} params.jobId - ID du job pour PubSub
 * @param {string} params.projectId - ID du projet Supabase (pour naming GitHub/Neon)
 * @param {string} params.userNeonProjectId - ID du projet Neon de l'utilisateur
 * @param {Array} params.conversationHistory - Historique de conversation
 * @param {Function} params.onProgress - Callback pour progression
 */
export async function generateProject({ prompt, jobId, projectId, userNeonProjectId, conversationHistory = [], onProgress }) {
  try {
    console.log('🚀 Starting project generation...')
    console.log('📝 Prompt:', prompt.substring(0, 100) + '...')
    console.log('🆔 Job ID:', jobId)
    console.log('🆔 Project ID:', projectId)
    if (userNeonProjectId) {
      console.log('🗄️  User Neon project:', userNeonProjectId)
    }

    // Événement de démarrage
    await publishEvent(jobId, 'step', {
      step: 1,
      description: 'Démarrage de la génération...',
      status: 'in_progress'
    })

    if (onProgress) await onProgress(5)

    // Étape 1 : Génération du plan
    await publishEvent(jobId, 'step', {
      step: 1,
      description: 'Génération du plan de projet...',
      status: 'in_progress'
    })

    await publishEvent(jobId, 'substep', {
      step: 1,
      description: 'Analyse du prompt et définition de l\'architecture'
    })

    if (onProgress) await onProgress(10)

    // Générer le projet avec la fonction unifiée
    const result = await generateReactProject(prompt, anthropic)

    // Corriger les apostrophes typographiques (problème récurrent avec Claude)
    result.files = fixTypographicApostrophes(result.files)

    // Événement plan généré
    await publishEvent(jobId, 'plan', {
      framework: 'react',
      style: 'Tailwind CSS',
      pagesCount: result.files.filter(f => f.path.includes('/pages/')).length,
      componentsCount: result.files.filter(f => f.path.includes('/components/')).length
    })

    if (onProgress) await onProgress(30)

    // Étape 2 : Génération des fichiers
    await publishEvent(jobId, 'step', {
      step: 2,
      description: 'Génération des fichiers du projet...',
      status: 'in_progress'
    })

    await publishEvent(jobId, 'substep', {
      step: 2,
      description: `Génération de ${result.files.length} fichiers...`
    })

    if (onProgress) await onProgress(70)

    // Sous-étapes détaillées
    const filesByType = {
      pages: result.files.filter(f => f.path.includes('/pages/')),
      components: result.files.filter(f => f.path.includes('/components/')),
      config: result.files.filter(f => f.type === 'config'),
      other: result.files.filter(f => !f.path.includes('/pages/') && !f.path.includes('/components/') && f.type !== 'config')
    }

    await publishEvent(jobId, 'substep', {
      step: 2,
      description: `✓ ${filesByType.pages.length} pages générées`
    })

    await publishEvent(jobId, 'substep', {
      step: 2,
      description: `✓ ${filesByType.components.length} composants générés`
    })

    if (onProgress) await onProgress(90)

    await publishEvent(jobId, 'substep', {
      step: 2,
      description: `✓ ${filesByType.config.length} fichiers de configuration`
    })

    console.log('✅ Project generated successfully')
    console.log(`📁 Total files: ${result.files.length}`)
    console.log(`📄 Pages: ${filesByType.pages.length}`)
    console.log(`🧩 Components: ${filesByType.components.length}`)

    // Note: Database, GitHub deployment, and API generation removed
    // Keeping only code generation for now

    if (onProgress) await onProgress(100)

    // Événement de complétion
    await publishEvent(jobId, 'complete', {
      isMultiFile: true,
      files: result.files,
      hasDatabase: result.hasDatabase,
      databaseSchema: result.databaseSchema,
      projectId: projectId,
      filesCount: result.files.length,
      summary: {
        pages: filesByType.pages.length,
        components: filesByType.components.length,
        configs: filesByType.config.length,
        totalFiles: result.files.length,
        database: result.hasDatabase ? `${result.databaseSchema?.tables?.length || 0} tables` : 'none'
      }
    })

    return {
      success: true,
      isMultiFile: true,
      files: result.files,
      hasDatabase: result.hasDatabase,
      databaseSchema: result.databaseSchema,
      projectId: projectId,
      filesCount: result.files.length
    }

  } catch (error) {
    console.error('❌ Generation failed:', error)

    // Publier l'erreur
    await publishEvent(jobId, 'error', {
      message: error.message,
      stack: error.stack
    })

    throw new Error(`Generation failed: ${error.message}`)
  }
}
