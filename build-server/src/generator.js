/**
 * Generator worker - Génération de projets React sans limite de temps
 * Tourne sur Railway avec Redis/BullMQ
 *
 * Note: Ce fichier doit pouvoir accéder à ../../lib/react-generator.js
 * Assurez-vous que le build-server est dans le même repo que l'app principale
 */

import Anthropic from '@anthropic-ai/sdk'
import { generateReactProject } from '../../lib/react-generator.js'

// Initialiser Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is not set!')
  process.exit(1)
}

/**
 * Générer un projet React complet
 * @param {Object} params
 * @param {string} params.prompt - Le prompt utilisateur
 * @param {Array} params.conversationHistory - Historique de conversation
 * @param {Function} params.onProgress - Callback pour progression
 */
export async function generateProject({ prompt, conversationHistory = [], onProgress }) {
  try {
    console.log('🚀 Starting project generation...')
    console.log('📝 Prompt:', prompt.substring(0, 100) + '...')

    if (onProgress) await onProgress(10)

    // Générer le projet avec la fonction unifiée
    const result = await generateReactProject(prompt, anthropic)

    if (onProgress) await onProgress(90)

    console.log('✅ Project generated successfully')
    console.log(`📁 Total files: ${result.files.length}`)
    console.log(`📄 Pages: ${result.files.filter(f => f.path.includes('/pages/')).length}`)
    console.log(`🧩 Components: ${result.files.filter(f => f.path.includes('/components/')).length}`)

    if (onProgress) await onProgress(100)

    return {
      success: true,
      files: result.files,
      hasDatabase: result.hasDatabase,
      databaseSchema: result.databaseSchema,
      filesCount: result.files.length
    }

  } catch (error) {
    console.error('❌ Generation failed:', error)
    throw new Error(`Generation failed: ${error.message}`)
  }
}
