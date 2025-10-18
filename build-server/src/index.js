import express from 'express'
import cors from 'cors'
import { buildQueue, setupQueue } from './queue.js'
import { buildProject } from './builder.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wapify-build-server' })
})

// API: Trigger a build
app.post('/api/build', async (req, res) => {
  try {
    const { projectId, files, projectName } = req.body

    if (!projectId || !files || !Array.isArray(files)) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, files'
      })
    }

    console.log(`📦 Received build request for project: ${projectId}`)
    console.log(`📁 Files count: ${files.length}`)

    // Add job to queue
    const job = await buildQueue.add('build-project', {
      projectId,
      files,
      projectName: projectName || projectId
    })

    res.json({
      success: true,
      jobId: job.id,
      message: 'Build job added to queue',
      estimatedTime: '15-30 seconds'
    })

  } catch (error) {
    console.error('❌ Error adding build to queue:', error)
    res.status(500).json({
      error: 'Failed to queue build',
      details: error.message
    })
  }
})

// API: Get build status
app.get('/api/build/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    const job = await buildQueue.getJob(jobId)

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const state = await job.getState()
    const progress = job.progress
    const result = job.returnvalue

    res.json({
      jobId,
      state,
      progress,
      result,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason
    })

  } catch (error) {
    console.error('❌ Error getting build status:', error)
    res.status(500).json({
      error: 'Failed to get build status',
      details: error.message
    })
  }
})

// API: Get queue stats
app.get('/api/stats', async (req, res) => {
  try {
    const waiting = await buildQueue.getWaitingCount()
    const active = await buildQueue.getActiveCount()
    const completed = await buildQueue.getCompletedCount()
    const failed = await buildQueue.getFailedCount()

    res.json({
      queue: {
        waiting,
        active,
        completed,
        failed,
        total: waiting + active
      }
    })

  } catch (error) {
    console.error('❌ Error getting queue stats:', error)
    res.status(500).json({
      error: 'Failed to get stats',
      details: error.message
    })
  }
})

// Start server
async function start() {
  try {
    // Setup queue and worker
    await setupQueue()

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Wapify Build Server running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🔨 Build endpoint: http://localhost:${PORT}/api/build`)
    })

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

start()
