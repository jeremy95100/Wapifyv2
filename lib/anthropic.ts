import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function generateAppCode(prompt: string): Promise<string> {
  const systemPrompt = `You are Wapify AI, an expert in generating React/Next.js web applications.

CODE STYLE:
- TypeScript required
- Tailwind CSS with Wapify palette: bg-[#F5F3EF], text-[#2C1810], accent-[#CC785C]
- Modern, responsive components
- Clean and professional code
- Mobile-first approach

STRUCTURE:
- Default exported main component
- TypeScript types if needed
- Appropriate React hooks
- Proper state management

Return ONLY the code, no explanations before or after.
Generate a complete, working HTML page that can be displayed in an iframe.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `${systemPrompt}\n\nUser prompt: ${prompt}\n\nGenerate a complete HTML page with inline styles and JavaScript if needed.`
      }],
    })

    const content = message.content[0]
    const fullResponse = content.type === 'text' ? content.text : ''
    
    // Extract code between ```
    const codeMatch = fullResponse.match(/```(?:html|tsx|typescript|jsx|javascript)?\n([\s\S]*?)```/)
    const code = codeMatch ? codeMatch[1].trim() : fullResponse.trim()
    
    // If it's not HTML, wrap it in HTML
    if (!code.includes('<!DOCTYPE') && !code.includes('<html')) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #F5F3EF; color: #2C1810; font-family: system-ui; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`
    }
    
    return code
    
  } catch (error) {
    console.error('Error generating code:', error)
    throw new Error('Failed to generate code with AI')
  }
}