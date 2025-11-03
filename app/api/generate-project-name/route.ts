import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not configured, using fallback name generation')
      // Fallback: extract first few words from prompt
      const words = prompt.split(' ').slice(0, 4).join(' ')
      const name = words.charAt(0).toUpperCase() + words.slice(1)
      return NextResponse.json({ name: name.substring(0, 50) })
    }

    // Use Claude to generate a short, descriptive project name
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20250219',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Based on this app description, generate a short, catchy project name (2-4 words max, no special characters except spaces and hyphens):

"${prompt}"

Return ONLY the project name, nothing else.`
        }
      ]
    })

    const content = message.content[0]
    let name = 'New Project'

    if (content.type === 'text') {
      name = content.text.trim()
      // Clean up the name
      name = name.replace(/['"]/g, '')
      name = name.replace(/[^a-zA-Z0-9\s-]/g, '')
      name = name.substring(0, 50) // Limit length
    }

    return NextResponse.json({ name })
  } catch (error) {
    console.error('Error generating project name:', error)
    // Fallback on error
    const { prompt } = await req.json()
    const words = prompt?.split(' ').slice(0, 4).join(' ') || 'New Project'
    const name = words.charAt(0).toUpperCase() + words.slice(1)
    return NextResponse.json({ name: name.substring(0, 50) })
  }
}
