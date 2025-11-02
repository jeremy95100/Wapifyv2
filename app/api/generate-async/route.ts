import { NextRequest, NextResponse } from 'next/server'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Connect to Railway Redis (use REDIS_PUBLIC_URL to avoid Railway integration override)
const redisConnection = new Redis(process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

// Generate queue
const generateQueue = new Queue('wapify-generates', { connection: redisConnection })

/**
 * POST /api/generate-async
 * Create async generation job (no timeout limit)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, conversationHistory = [], userId, projectId } = body

    // Validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Un prompt valide est requis' },
        { status: 400 }
      )
    }

    // No length limit - let Claude handle detailed prompts
    if (prompt.length > 50000) {
      return NextResponse.json(
        { error: 'Le prompt est extrêmement long (max 50000 caractères)' },
        { status: 400 }
      )
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId est requis' },
        { status: 400 }
      )
    }

    console.log('🎨 Creating async generation job for project:', projectId)
    console.log('📝 Prompt:', prompt.substring(0, 50) + '...')

    // Note: Neon project creation removed - no database deployment for now

    // Create job in queue
    const job = await generateQueue.add('generate-project', {
      prompt,
      conversationHistory,
      userId,
      projectId
    })

    console.log(`✅ Job created with ID: ${job.id}`)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Generation started. Use /api/jobs/:id to poll status.'
    })

  } catch (error) {
    console.error('❌ Error creating generation job:', error)
    return NextResponse.json(
      {
        error: 'Failed to create generation job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
