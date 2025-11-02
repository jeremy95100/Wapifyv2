import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { buildProject } from './builder.js'
import { generateProject } from './generator.js'

// Redis connection
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

// Build queue
export const buildQueue = new Queue('wapify-builds', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100
    },
    removeOnFail: {
      age: 86400 // Keep failed jobs for 24 hours
    }
  }
})

// Generate queue (new)
export const generateQueue = new Queue('wapify-generates', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 10000
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100
    },
    removeOnFail: {
      age: 86400 // Keep failed jobs for 24 hours
    }
  }
})

// Workers
let buildWorker
let generateWorker

export async function setupQueue() {
  console.log('🔧 Setting up queues...')

  // Build worker
  buildWorker = new Worker(
    'wapify-builds',
    async (job) => {
      const { projectId, files, projectName, userPrompt } = job.data

      console.log(`\n🔨 Starting build for project: ${projectId}`)
      console.log(`📁 Files: ${files.length}`)

      try {
        // Update progress
        await job.updateProgress(10)

        // Build the project
        const result = await buildProject({
          projectId,
          files,
          projectName,
          jobId: job.id, // Pass job ID for error logging
          userPrompt: userPrompt || null, // Pass user prompt for analysis
          onProgress: async (progress) => {
            await job.updateProgress(progress)
          }
        })

        console.log(`✅ Build completed for ${projectId}`)
        console.log(`📦 Build URL: ${result.url}`)

        return result

      } catch (error) {
        console.error(`❌ Build failed for ${projectId}:`, error)
        throw error
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process max 5 builds in parallel
      limiter: {
        max: 10, // Max 10 jobs
        duration: 60000 // per 60 seconds
      }
    }
  )

  // Event listeners for build worker
  buildWorker.on('completed', (job) => {
    console.log(`✅ Build job ${job.id} completed for ${job.data.projectId}`)
  })

  buildWorker.on('failed', (job, err) => {
    console.error(`❌ Build job ${job?.id} failed:`, err.message)
  })

  buildWorker.on('error', (err) => {
    console.error('❌ Build worker error:', err)
  })

  console.log('✅ Build queue ready (concurrency: 5)')

  // Generate worker
  generateWorker = new Worker(
    'wapify-generates',
    async (job) => {
      const { prompt, conversationHistory, userId, projectId, userNeonProjectId } = job.data

      console.log(`\n🎨 Starting generation for project: ${projectId}`)
      console.log(`📝 Prompt: ${prompt.substring(0, 50)}...`)
      if (userNeonProjectId) {
        console.log(`🗄️  User Neon project: ${userNeonProjectId}`)
      }

      try {
        // Update progress
        await job.updateProgress(10)

        // Generate the project with jobId for real-time events
        const result = await generateProject({
          prompt,
          conversationHistory,
          jobId: job.id, // Pass jobId for Redis PubSub events
          projectId, // Pass projectId for GitHub/Neon naming
          userNeonProjectId, // Pass user's Neon project ID
          onProgress: async (progress) => {
            await job.updateProgress(progress)
          }
        })

        console.log(`✅ Generation completed for ${projectId}`)
        console.log(`📁 Files generated: ${result.filesCount}`)

        return result

      } catch (error) {
        console.error(`❌ Generation failed for ${projectId}:`, error)
        throw error
      }
    },
    {
      connection: redisConnection,
      concurrency: 3, // Process max 3 generations in parallel (slower than builds)
      lockDuration: 600000, // 10 minutes lock - prevents "stalled" for long Claude API calls
      settings: {
        stalledInterval: 120000, // Check for stalled jobs every 2 minutes
      },
      limiter: {
        max: 5, // Max 5 jobs
        duration: 60000 // per 60 seconds
      }
    }
  )

  // Event listeners for generate worker
  generateWorker.on('completed', (job) => {
    console.log(`✅ Generate job ${job.id} completed`)
  })

  generateWorker.on('failed', (job, err) => {
    console.error(`❌ Generate job ${job?.id} failed:`, err.message)
  })

  generateWorker.on('error', (err) => {
    console.error('❌ Generate worker error:', err)
  })

  console.log('✅ Generate queue ready (concurrency: 3)')
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...')
  await buildWorker?.close()
  await generateWorker?.close()
  await buildQueue.close()
  await generateQueue.close()
  await redisConnection.quit()
  process.exit(0)
})
