import { NextRequest, NextResponse } from 'next/server'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

// SSE connection - keep it short to avoid timeout on free tier
// Client will reconnect automatically if connection drops
export const maxDuration = 60 // 60 seconds - reconnect strategy for long jobs
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const redisConnection = new Redis(process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

const generateQueue = new Queue('wapify-generates', {
  connection: redisConnection
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  console.log('SSE Stream requested for job:', id)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = new Redis(process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null
      })

      let isCompleted = false
      let isClosed = false

      // Helper pour fermer proprement la connexion Redis
      const closeSubscriber = async () => {
        if (isClosed) return
        isClosed = true

        try {
          if (subscriber.status === 'ready') {
            await subscriber.unsubscribe('job:' + id)
            await subscriber.quit()
          }
        } catch (error) {
          console.error('Error closing subscriber:', error)
        }
      }

      try {
        await subscriber.subscribe('job:' + id)
        console.log('Subscribed to job:', id)

        const connectionMsg = 'data: ' + JSON.stringify({ type: 'connected', jobId: id }) + '\n\n'
        controller.enqueue(encoder.encode(connectionMsg))

        subscriber.on('message', (channel, message) => {
          try {
            const event = JSON.parse(message)
            console.log('Event received:', event.type)

            const sseMsg = 'data: ' + message + '\n\n'
            controller.enqueue(encoder.encode(sseMsg))

            if (event.type === 'complete' || event.type === 'error') {
              isCompleted = true
              console.log('Job completed, closing stream:', id)

              setTimeout(async () => {
                await closeSubscriber()
                controller.close()
              }, 500)
            }
          } catch (error) {
            console.error('Error parsing event:', error)
          }
        })

        const statusCheckInterval = setInterval(async () => {
          if (isCompleted) {
            clearInterval(statusCheckInterval)
            return
          }

          try {
            const job = await generateQueue.getJob(id)
            if (!job) {
              console.log('Job not found:', id)
              const errorMsg = 'data: ' + JSON.stringify({ type: 'error', data: { message: 'Job not found' } }) + '\n\n'
              controller.enqueue(encoder.encode(errorMsg))
              clearInterval(statusCheckInterval)
              await closeSubscriber()
              controller.close()
              return
            }

            const state = await job.getState()
            
            if (state === 'completed' && !isCompleted) {
              console.log('Job completed (detected via polling):', id)
              const completeMsg = 'data: ' + JSON.stringify({ type: 'complete', data: job.returnvalue }) + '\n\n'
              controller.enqueue(encoder.encode(completeMsg))
              isCompleted = true
              clearInterval(statusCheckInterval)
              await closeSubscriber()
              controller.close()
            }

            if (state === 'failed' && !isCompleted) {
              console.log('Job failed:', id)
              const errorMsg = 'data: ' + JSON.stringify({ type: 'error', data: { message: job.failedReason || 'Generation failed' } }) + '\n\n'
              controller.enqueue(encoder.encode(errorMsg))
              isCompleted = true
              clearInterval(statusCheckInterval)
              await closeSubscriber()
              controller.close()
            }
          } catch (error) {
            console.error('Error checking job status:', error)
          }
        }, 2000)

        request.signal.addEventListener('abort', async () => {
          console.log('Client disconnected from job:', id)
          clearInterval(statusCheckInterval)
          await closeSubscriber()
          controller.close()
        })

      } catch (error) {
        console.error('Stream error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorMsg = 'data: ' + JSON.stringify({ type: 'error', data: { message: errorMessage } }) + '\n\n'
        controller.enqueue(encoder.encode(errorMsg))
        await closeSubscriber()
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
