import { NextRequest, NextResponse } from 'next/server'
import { generateAppCode } from '../../../lib/anthropic'  // ← Chemin relatif

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const generatedCode = await generateAppCode(prompt)

    return NextResponse.json({
      success: true,
      code: generatedCode,
      message: 'App generated successfully'
    })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate app' },
      { status: 500 }
    )
  }
}
