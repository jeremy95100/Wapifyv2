/**
 * Client-side generation helper
 * Uses async Railway generation with real-time SSE streaming
 */

interface GenerateOptions {
  prompt: string
  conversationHistory?: any[]
  projectId?: string
  userId?: string
  onProgress?: (progress: number) => void
  onEvent?: (event: any) => void
}

interface GenerateResult {
  files: any[]
  hasDatabase: boolean
  databaseSchema?: string
  dbBranchId?: string
  dbConnectionString?: string
  githubRepo?: string
  githubRepoFullName?: string
  githubCloneUrl?: string
  isMultiFile: boolean
  framework: string
}

/**
 * Generate a project asynchronously via Railway workers
 * Streams real-time events via SSE for great UX
 */
export async function generateProject(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, conversationHistory = [], projectId, userId, onProgress, onEvent } = options

  if (!projectId) {
    throw new Error('projectId is required')
  }

  console.log('🚀 Starting async generation with real-time streaming...')

  // Step 1: Create async generation job
  const createResponse = await fetch('/api/generate-async', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      conversationHistory,
      projectId,
      userId
    })
  })

  if (!createResponse.ok) {
    const error = await createResponse.json()
    throw new Error(error.error || 'Failed to create generation job')
  }

  const { jobId } = await createResponse.json()
  console.log('📋 Job created:', jobId)

  // Step 2: Connect to SSE stream for real-time events
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`/api/jobs/${jobId}/stream`)
    let hasResult = false

    eventSource.onopen = () => {
      console.log('📡 SSE connection opened for job:', jobId)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        console.log(`📨 Event: ${data.type}`)

        // Forward all events to callback
        if (onEvent) {
          onEvent(data)
        }

        // Handle specific event types
        switch (data.type) {
          case 'connected':
            console.log('✅ Connected to worker stream')
            break

          case 'step':
            // Major step started
            if (onProgress) {
              const stepProgress = data.data.step === 1 ? 20 : 60
              onProgress(stepProgress)
            }
            break

          case 'substep':
            // Sub-step progress
            console.log(`  → ${data.data.description}`)
            break

          case 'plan':
            // Project plan received
            console.log('📋 Plan received:', data.data)
            if (onProgress) onProgress(30)
            break

          case 'validation':
            // TypeScript validation results
            if (data.data.success) {
              console.log('✅ Validation TypeScript réussie - aucune erreur détectée')
            } else {
              console.warn(`⚠️  Validation TypeScript: ${data.data.errorsCount} erreur(s) détectée(s)`)
              if (data.data.errors && data.data.errors.length > 0) {
                console.group('📋 Erreurs TypeScript détectées:')
                data.data.errors.forEach((err: any, i: number) => {
                  console.log(`${i + 1}. ${err.file}:${err.line}`)
                  console.log(`   ${err.code}: ${err.message}`)
                })
                console.groupEnd()
              }
            }
            break

          case 'complete':
            // Generation completed!
            console.log('✅ Generation complete!')
            hasResult = true
            eventSource.close()
            if (onProgress) onProgress(100)
            resolve(data.data)
            break

          case 'error':
            // Error occurred
            console.error('❌ Generation error:', data.data)
            hasResult = true
            eventSource.close()
            reject(new Error(data.data.message || 'Generation failed'))
            break
        }
      } catch (error) {
        console.error('Failed to parse SSE event:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error)
      eventSource.close()

      if (!hasResult) {
        reject(new Error('SSE connection failed'))
      }
    }

    // Timeout after 15 minutes (very generous, should never hit)
    setTimeout(() => {
      if (!hasResult) {
        console.error('⏱️ Generation timeout after 15 minutes')
        eventSource.close()
        reject(new Error('Generation timeout'))
      }
    }, 900000)
  })
}
