import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { buildProject } from './builder.js'

// Redis connection
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

// Create queue
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

// Worker to process builds
let worker

export async function setupQueue() {
  console.log('🔧 Setting up build queue...')

  worker = new Worker(
    'wapify-builds',
    async (job) => {
      const { projectId, files, projectName } = job.data

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

  // Event listeners
  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed for ${job.data.projectId}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err)
  })

  console.log('✅ Build queue ready (concurrency: 5)')
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...')
  await worker?.close()
  await buildQueue.close()
  await redisConnection.quit()
  process.exit(0)
})
