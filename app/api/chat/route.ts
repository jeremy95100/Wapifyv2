import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { modification, conversationHistory, currentCode, projectFiles, isMultiFile } = await req.json()

    if (!modification) {
      return new Response(
        JSON.stringify({ error: 'Modification is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Build the prompt for code modification
          let prompt = `Tu es un assistant de modification de code React/Vite. Modifie le code selon la demande de l'utilisateur.

Demande de modification: ${modification}

`

          if (isMultiFile && projectFiles && projectFiles.length > 0) {
            prompt += `Fichiers actuels du projet:\n`
            projectFiles.forEach((file: any) => {
              prompt += `\n--- ${file.path} ---\n${file.content.substring(0, 2000)}\n`
            })
          } else if (currentCode) {
            prompt += `Code actuel:\n${currentCode.substring(0, 3000)}\n`
          }

          prompt += `\nInstructions:
- Modifie uniquement ce qui est demandé
- Garde le style et la structure existants
- Retourne le code complet modifié
- Utilise React + Vite + Tailwind CSS
- Code en français si applicable`

          // Send initial step event
          const stepEvent = {
            type: 'step',
            data: {
              step: 'Analyse de la modification',
              status: 'in_progress',
              description: 'Analyse des changements à effectuer'
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(stepEvent)}\n\n`))

          // Call Claude to modify the code
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 4000,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })

          const content = response.content[0]
          let modifiedCode = ''

          if (content.type === 'text') {
            modifiedCode = content.text
            console.log('Raw response from Claude:', modifiedCode.substring(0, 500))

            // Extract code from markdown if present
            const codeMatch = modifiedCode.match(/```(?:jsx?|tsx?|html)?\n([\s\S]*?)\n```/)
            if (codeMatch) {
              modifiedCode = codeMatch[1]
              console.log('Extracted code from markdown')
            } else {
              console.log('No markdown code block found, using raw response')
            }
          }

          console.log('Modified code length:', modifiedCode.length)
          console.log('Is multi-file project:', isMultiFile)

          // For multi-file projects, we need to handle modifications differently
          if (isMultiFile && projectFiles && projectFiles.length > 0) {
            console.log('Processing multi-file modification')

            // Ask Claude which file was modified and return all files with the modification
            const fileIdentificationPrompt = `Based on the user's modification request: "${modification}"

Which file should be modified? Return ONLY the file path from this list:
${projectFiles.map((f: any) => f.path).join('\n')}

If it's a style/color change, it's likely in: src/App.tsx or src/index.css
If it's about adding features, it's likely in: src/App.tsx or relevant component files

Return ONLY the file path, nothing else.`

            const fileIdentification = await anthropic.messages.create({
              model: 'claude-sonnet-4-5',
              max_tokens: 100,
              messages: [{
                role: 'user',
                content: fileIdentificationPrompt
              }]
            })

            let targetFilePath = 'src/App.tsx' // Default
            const fileContent = fileIdentification.content[0]
            if (fileContent.type === 'text') {
              targetFilePath = fileContent.text.trim()
              console.log('Target file identified:', targetFilePath)
            }

            // Update the target file with the modified code
            const updatedFiles = projectFiles.map((file: any) => {
              if (file.path === targetFilePath) {
                return {
                  ...file,
                  content: modifiedCode
                }
              }
              return file
            })

            console.log('Updated files count:', updatedFiles.length)

            // Send completion event with updated files
            const completeEvent = {
              type: 'complete',
              data: {
                files: updatedFiles,
                isMultiFile: true
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`))
          } else {
            // Single-file project
            console.log('Processing single-file modification')
            const completeEvent = {
              type: 'complete',
              data: {
                code: modifiedCode,
                isMultiFile: false
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`))
          }

          controller.close()
        } catch (error) {
          console.error('Error in chat modification:', error)
          const errorEvent = {
            type: 'error',
            data: {
              message: error instanceof Error ? error.message : 'Modification failed'
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in chat route:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process modification' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
