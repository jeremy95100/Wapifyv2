import { NextRequest, NextResponse } from 'next/server'

const BUILD_SERVER_URL = process.env.BUILD_SERVER_URL || 'http://localhost:3001'

/**
 * POST /api/build
 * Trigger a Vite build on the build server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, files, projectName } = body

    if (!projectId || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, files' },
        { status: 400 }
      )
    }

    console.log(`🔨 Triggering build for project: ${projectId}`)
    console.log(`📁 Files: ${files.length}`)

    // Call build server
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
      throw new Error(error.error || 'Build server request failed')
    }

    const result = await response.json()

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Error triggering build:', error)
    return NextResponse.json(
      {
        error: 'Failed to trigger build',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/build?jobId=xxx
 * Get build status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      )
    }

    // Call build server
    const response = await fetch(`${BUILD_SERVER_URL}/api/build/${jobId}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get build status')
    }

    const result = await response.json()

    return NextResponse.json(result)

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
