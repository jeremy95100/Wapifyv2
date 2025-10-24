import { NextRequest, NextResponse } from 'next/server'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Connect to Railway Redis
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

// Queues
const generateQueue = new Queue('wapify-generates', { connection: redisConnection })
const buildQueue = new Queue('wapify-builds', { connection: redisConnection })

/**
 * GET /api/jobs/[id]
 * Poll job status and result
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'generate'

    console.log(`📊 Polling job ${id} (type: ${type})`)

    // Select the right queue
    const queue = type === 'build' ? buildQueue : generateQueue

    // Get job
    const job = await queue.getJob(id)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get job state
    const state = await job.getState()
    const progress = job.progress
    const returnValue = job.returnvalue

    console.log(`📊 Job ${id} state: ${state}, progress: ${progress}%`)

    // Response format
    const response: any = {
      id: job.id,
      state,
      progress: typeof progress === 'number' ? progress : 0
    }

    // If completed, return result
    if (state === 'completed') {
      response.result = returnValue
    }

    // If failed, return error
    if (state === 'failed') {
      response.error = job.failedReason || 'Unknown error'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error polling job:', error)
    return NextResponse.json(
      {
        error: 'Failed to poll job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
