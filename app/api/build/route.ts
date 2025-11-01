import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max

const BUILD_SERVER_URL = process.env.BUILD_SERVER_URL || 'http://localhost:3001'

/**
 * POST /api/build
 * Proxy to build-server for Vite compilation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, files, projectName } = body

    // Validation
    if (!projectId || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, files' },
        { status: 400 }
      )
    }

    console.log(`🔨 Proxying build request to build-server: ${projectId}`)
    console.log(`📁 Files count: ${files.length}`)

    // Forward to build-server
    const response = await fetch(`${BUILD_SERVER_URL}/api/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId,
        files,
        projectName
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Build server error')
    }

    const result = await response.json()

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Error proxying build request:', error)
    return NextResponse.json(
      {
        error: 'Failed to start build',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/build?jobId=xxx
 * Get build status from build-server
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      )
    }

    // Forward to build-server
    const response = await fetch(`${BUILD_SERVER_URL}/api/build/${jobId}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Build server error')
    }

    const result = await response.json()

    // Transform response to match frontend expectations
    return NextResponse.json({
      status: result.state === 'completed' ? 'completed' :
              result.state === 'failed' ? 'failed' :
              'building',
      url: result.result?.url,
      error: result.failedReason,
      progress: result.progress
    })

  } catch (error) {
    console.error('❌ Error getting build status:', error)
    return NextResponse.json(
      {
        error: 'Failed to get build status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
