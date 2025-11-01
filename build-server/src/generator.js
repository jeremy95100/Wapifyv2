/**
 * Generator worker - Génération de projets React sans limite de temps
 * Tourne sur Railway avec Redis/BullMQ
 * Publie les événements en temps réel via Redis PubSub pour SSE streaming
 */

import Anthropic from '@anthropic-ai/sdk'
import { Redis } from 'ioredis'
import { generateReactProject } from './react-generator.ts'
import { generateExpressAPI } from './api-generator.js'
import { deployToGitHub, addAPIEnvironmentFile } from './github-deployer.js'
import { createTablesInSharedDatabase, isSharedDatabaseConfigured } from './neon-multitenant.js'
import { createProjectDatabase } from './neon.js' // Fallback for old architecture

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

    // Étape 2.5 : Générer l'API backend si base de données requise
    let apiFiles = []
    if (result.hasDatabase && result.databaseSchema) {
      console.log('🔧 Generating Express API backend...')

      await publishEvent(jobId, 'substep', {
        step: 2,
        description: 'Génération du backend Express...'
      })

      try {
        apiFiles = generateExpressAPI(result.databaseSchema)
        result.files.push(...apiFiles)

        console.log(`✅ API generated: ${apiFiles.length} files`)

        await publishEvent(jobId, 'substep', {
          step: 2,
          description: `✓ Backend API généré (${apiFiles.length} fichiers)`
        })
      } catch (error) {
        console.error('❌ Failed to generate API:', error)
        await publishEvent(jobId, 'warning', {
          message: 'API generation failed',
          error: error.message
        })
      }
    }

    // Étape 3 : Créer la base de données si nécessaire
    let dbInfo = null
    if (result.hasDatabase && result.databaseSchema) {
      console.log('🗄️  Database required...')

      await publishEvent(jobId, 'step', {
        step: 3,
        description: 'Création de la base de données...',
        status: 'in_progress'
      })

      try {
        // Check if shared database is configured (new multitenant architecture)
        if (isSharedDatabaseConfigured()) {
          console.log('📦 Using shared multitenant database')

          await publishEvent(jobId, 'substep', {
            step: 3,
            description: 'Création des tables dans la base partagée'
          })

          dbInfo = await createTablesInSharedDatabase(projectId, result.databaseSchema)

          console.log(`✅ Tables created in shared database`)

          await publishEvent(jobId, 'substep', {
            step: 3,
            description: `✓ ${result.databaseSchema.tables.length} tables créées (architecture multitenant)`
          })

        } else if (userNeonProjectId) {
          // Fallback to old architecture (per-app branches)
          console.log('⚠️  Using legacy per-branch architecture')

          await publishEvent(jobId, 'substep', {
            step: 3,
            description: 'Création d\'une branche Neon dédiée (legacy)'
          })

          dbInfo = await createProjectDatabase(userNeonProjectId, projectId, result.databaseSchema)

          console.log(`✅ Database created: ${dbInfo.branchId}`)

          await publishEvent(jobId, 'substep', {
            step: 3,
            description: `✓ Base de données créée (${result.databaseSchema.tables.length} tables)`
          })

        } else {
          console.warn('⚠️  Neither shared database nor user Neon project configured')
          await publishEvent(jobId, 'warning', {
            message: 'Database required but not configured (set SHARED_DATABASE_URL or user Neon project)'
          })
        }

      } catch (error) {
        console.error('❌ Failed to create database:', error)
        // Ne pas bloquer si la DB échoue, juste logger
        await publishEvent(jobId, 'warning', {
          message: 'Database creation failed',
          error: error.message
        })
      }
    }

    // Étape 4 : Déployer sur GitHub
    let githubInfo = null
    try {
      console.log('📦 Deploying to GitHub...')

      await publishEvent(jobId, 'step', {
        step: 4,
        description: 'Déploiement sur GitHub...',
        status: 'in_progress'
      })

      await publishEvent(jobId, 'substep', {
        step: 4,
        description: 'Création du repository GitHub'
      })

      // Get project name from result or use default
      const projectName = result.files.find(f => f.path === 'package.json')
        ? JSON.parse(result.files.find(f => f.path === 'package.json').content).name
        : 'wapify-project'

      githubInfo = await deployToGitHub(projectId, projectName, result.files)

      console.log(`✅ GitHub deployment complete: ${githubInfo.repoUrl}`)

      await publishEvent(jobId, 'substep', {
        step: 4,
        description: `✓ Code déployé sur GitHub`
      })

    } catch (error) {
      console.error('❌ Failed to deploy to GitHub:', error)
      await publishEvent(jobId, 'warning', {
        message: 'GitHub deployment failed',
        error: error.message
      })
    }

    // Étape 5 : Configuration du frontend (si database requise)
    const SHARED_API_URL = process.env.SHARED_API_URL || 'https://wapify-shared-api.railway.app'

    if (result.hasDatabase && dbInfo && githubInfo?.repoFullName) {
      try {
        console.log('🔧 Configuring frontend with API environment variables...')

        await publishEvent(jobId, 'step', {
          step: 5,
          description: 'Configuration du frontend...',
          status: 'in_progress'
        })

        await publishEvent(jobId, 'substep', {
          step: 5,
          description: 'Injection des variables d\'environnement (API_URL + PROJECT_ID)'
        })

        // Inject both API_URL and PROJECT_ID into frontend
        await addAPIEnvironmentFile(
          githubInfo.repoFullName,
          SHARED_API_URL,
          projectId
        )

        console.log(`✅ Frontend configured:`)
        console.log(`   API_URL: ${SHARED_API_URL}`)
        console.log(`   PROJECT_ID: ${projectId}`)

        await publishEvent(jobId, 'substep', {
          step: 5,
          description: `✓ Frontend configuré avec l'API partagée`
        })

      } catch (error) {
        console.error('❌ Failed to configure frontend:', error)
        await publishEvent(jobId, 'warning', {
          message: 'Frontend configuration failed',
          error: error.message
        })
      }
    } else if (result.hasDatabase && (!dbInfo || !githubInfo)) {
      console.warn('⚠️  Frontend configuration skipped: database or GitHub deployment failed')
    }

    if (onProgress) await onProgress(100)

    // Événement de complétion
    await publishEvent(jobId, 'complete', {
      isMultiFile: true,
      files: result.files,
      hasDatabase: result.hasDatabase,
      databaseSchema: result.databaseSchema,
      dbBranchId: dbInfo?.branchId,
      dbConnectionString: dbInfo?.connectionString,
      dbIsShared: dbInfo?.isShared || false,
      githubRepo: githubInfo?.repoUrl,
      githubRepoFullName: githubInfo?.repoFullName,
      githubCloneUrl: githubInfo?.cloneUrl,
      sharedApiUrl: result.hasDatabase ? SHARED_API_URL : null,
      projectId: projectId,
      filesCount: result.files.length,
      summary: {
        pages: filesByType.pages.length,
        components: filesByType.components.length,
        configs: filesByType.config.length,
        totalFiles: result.files.length,
        database: result.hasDatabase ? `${result.databaseSchema.tables.length} tables (${dbInfo?.isShared ? 'shared' : 'dedicated'})` : 'none',
        github: githubInfo?.repoUrl || 'failed',
        api: result.hasDatabase ? SHARED_API_URL : 'none'
      }
    })

    return {
      success: true,
      isMultiFile: true,
      files: result.files,
      hasDatabase: result.hasDatabase,
      databaseSchema: result.databaseSchema,
      dbBranchId: dbInfo?.branchId,
      dbConnectionString: dbInfo?.connectionString,
      dbIsShared: dbInfo?.isShared || false,
      githubRepo: githubInfo?.repoUrl,
      githubRepoFullName: githubInfo?.repoFullName,
      githubCloneUrl: githubInfo?.cloneUrl,
      sharedApiUrl: result.hasDatabase ? SHARED_API_URL : null,
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
