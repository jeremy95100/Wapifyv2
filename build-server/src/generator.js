/**
 * Generator worker - Génération de projets React sans limite de temps
 * Tourne sur Railway avec Redis/BullMQ
 * Publie les événements en temps réel via Redis PubSub pour SSE streaming
 */

import Anthropic from '@anthropic-ai/sdk'
import { Redis } from 'ioredis'
import { generateReactProject, fixTypographicApostrophes, removeAsChildProp, fixCheckboxValueToChecked } from './react-generator.ts'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import os from 'os'

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
 * Valider les fichiers générés avec TypeScript (tsc --noEmit)
 * Phase 1 : Détection et logging uniquement
 */
async function validateTypeScript(files, jobId) {
  let tempDir = null

  try {
    // Créer un répertoire temporaire
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wapify-validate-'))

    console.log(`🔍 Validation TypeScript dans ${tempDir}`)

    // Écrire tous les fichiers
    for (const file of files) {
      const filePath = path.join(tempDir, file.path)
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, file.content, 'utf-8')
    }

    // Installer les dépendances types nécessaires pour la validation
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'validation-temp',
        version: '1.0.0',
        private: true,
        dependencies: {},
        devDependencies: {
          'typescript': '^5.0.0',
          '@types/react': '^18.0.0',
          '@types/react-dom': '^18.0.0',
          '@types/node': '^20.0.0'
        }
      }, null, 2)
    )

    // Exécuter tsc --noEmit
    console.log('🔧 Exécution de tsc --noEmit...')

    const tscOutput = await new Promise((resolve, reject) => {
      const tsc = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck'], {
        cwd: tempDir,
        shell: true
      })

      let stdout = ''
      let stderr = ''

      tsc.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      tsc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      tsc.on('close', (code) => {
        resolve({ code, stdout, stderr })
      })

      tsc.on('error', (err) => {
        reject(err)
      })
    })

    // Parser les erreurs TypeScript
    const errors = parseTypeScriptErrors(tscOutput.stderr + tscOutput.stdout)

    if (errors.length === 0) {
      console.log('✅ Aucune erreur TypeScript détectée')
      await publishEvent(jobId, 'validation', {
        success: true,
        errors: []
      })
      return { success: true, errors: [] }
    }

    // Logger les erreurs
    console.log(`⚠️  ${errors.length} erreur(s) TypeScript détectée(s):`)
    errors.slice(0, 10).forEach((err, i) => {
      console.log(`\n${i + 1}. ${err.file}:${err.line}`)
      console.log(`   ${err.code}: ${err.message}`)
    })

    if (errors.length > 10) {
      console.log(`\n... et ${errors.length - 10} autre(s) erreur(s)`)
    }

    // Publier les erreurs via Redis pour le frontend
    await publishEvent(jobId, 'validation', {
      success: false,
      errorsCount: errors.length,
      errors: errors.slice(0, 10).map(e => ({
        file: e.file,
        line: e.line,
        message: e.message,
        code: e.code
      }))
    })

    return { success: false, errors }

  } catch (error) {
    console.error('❌ Erreur lors de la validation TypeScript:', error)
    return { success: false, errors: [], validationError: error.message }
  } finally {
    // Nettoyer le répertoire temporaire
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch (err) {
        console.warn('Impossible de nettoyer le répertoire temporaire:', err)
      }
    }
  }
}

/**
 * Parser les erreurs TypeScript depuis la sortie de tsc
 */
function parseTypeScriptErrors(output) {
  const errors = []
  const lines = output.split('\n')

  // Format: src/pages/Home.tsx(42,5): error TS2305: Module '"lucide-react"' has no exported member 'Stop'.
  const errorRegex = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/

  for (const line of lines) {
    const match = line.match(errorRegex)
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5]
      })
    }
  }

  return errors
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

    // Supprimer les props asChild invalides
    result.files = removeAsChildProp(result.files)

    // Corriger les checkboxes (value → checked)
    result.files = fixCheckboxValueToChecked(result.files)

    // Phase 1 : Validation TypeScript (détection et logging uniquement)
    console.log('🔍 Validation TypeScript des fichiers générés...')
    const validationResult = await validateTypeScript(result.files, jobId)

    if (validationResult.success) {
      console.log('✅ Validation TypeScript réussie - aucune erreur')
    } else if (validationResult.errors && validationResult.errors.length > 0) {
      console.log(`⚠️  ${validationResult.errors.length} erreur(s) TypeScript détectée(s) (Phase 1: logging uniquement)`)
    } else if (validationResult.validationError) {
      console.warn('⚠️  Impossible de valider TypeScript:', validationResult.validationError)
    }

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
