/**
 * Client-side generation helper
 * Automatically chooses between sync (fast) and async (unlimited) generation
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
  isMultiFile: boolean
  framework: string
}

/**
 * Generate a project (sync or async based on complexity)
 * Uses sync generation for fast UX, falls back to async for large projects
 */
export async function generateProject(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, conversationHistory = [], projectId, userId, onProgress, onEvent } = options

  // First, try sync generation (fast path)
  try {
    console.log('🚀 Attempting sync generation...')

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, conversationHistory })
    })

    if (!response.ok) {
      throw new Error('Sync generation failed')
    }

    // Parse SSE stream
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let result: GenerateResult | null = null

    if (!reader) {
      throw new Error('No response body')
    }

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6))

            // Call event callback
            if (onEvent) onEvent(event)

            // Track progress
            if (event.type === 'step' && onProgress) {
              const stepProgress = event.step === 1 ? 30 : 60
              onProgress(stepProgress)
            }

            // Final result
            if (event.type === 'complete') {
              result = event.data
              if (onProgress) onProgress(100)
            }

            // Error
            if (event.type === 'error') {
              throw new Error(event.data.message || 'Generation error')
            }
          } catch (parseError) {
            console.error('Failed to parse SSE event:', parseError)
          }
        }
      }
    }

    if (result) {
      console.log('✅ Sync generation succeeded')
      return result
    }

    throw new Error('No result from sync generation')

  } catch (syncError) {
    console.warn('⚠️ Sync generation failed, falling back to async...', syncError)

    // Fallback to async generation
    if (!projectId) {
      throw new Error('projectId required for async generation')
    }

    return await generateProjectAsync({
      prompt,
      conversationHistory,
      projectId,
      userId,
      onProgress
    })
  }
}

/**
 * Generate project asynchronously (no timeout, unlimited tokens)
 * Used as fallback when sync fails or for known large projects
 */
async function generateProjectAsync(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, conversationHistory = [], projectId, userId, onProgress } = options

  console.log('🎨 Starting async generation...')

  // Create job
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

  // Poll for result
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`/api/jobs/${jobId}?type=generate`)

        if (!statusResponse.ok) {
          clearInterval(pollInterval)
          reject(new Error('Failed to poll job status'))
          return
        }

        const status = await statusResponse.json()
        console.log(`📊 Job ${jobId} - ${status.state} (${status.progress || 0}%)`)

        // Update progress
        if (onProgress && typeof status.progress === 'number') {
          onProgress(status.progress)
        }

        // Job completed
        if (status.state === 'completed') {
          clearInterval(pollInterval)
          console.log('✅ Async generation completed')
          resolve(status.result)
        }

        // Job failed
        if (status.state === 'failed') {
          clearInterval(pollInterval)
          reject(new Error(status.error || 'Generation failed'))
        }

      } catch (pollError) {
        console.error('Error polling job:', pollError)
        // Continue polling (don't fail on network errors)
      }
    }, 2000) // Poll every 2 seconds

    // Timeout after 10 minutes (should never happen but safety net)
    setTimeout(() => {
      clearInterval(pollInterval)
      reject(new Error('Generation timeout after 10 minutes'))
    }, 600000)
  })
}
