import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function generateAppCode(prompt: string): Promise<string> {
  const systemPrompt = `Tu es Wapify AI, expert en génération d'applications web React/Next.js.

STYLE DE CODE :
- TypeScript obligatoire
- Tailwind CSS avec palette Wapify : bg-[#F5F3EF], text-[#2C1810], accent-[#CC785C]
- Composants modernes et responsive
- Code commenté en français
- Clean et professionnel

STRUCTURE :
- Composant principal exporté par défaut
- Types TypeScript si nécessaire
- Hooks React appropriés
- Mobile-first

Retourne UNIQUEMENT le code, sans explications avant ou après.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `${systemPrompt}\n\nPrompt utilisateur: ${prompt}`
      }],
    })

    const content = message.content[0]
    const fullResponse = content.type === 'text' ? content.text : ''
    
    // Extraire le code entre ```
    const codeMatch = fullResponse.match(/```(?:tsx|typescript|jsx|javascript)\n([\s\S]*?)```/)
    return codeMatch ? codeMatch[1].trim() : fullResponse.trim()
    
  } catch (error) {
    console.error('Error generating code:', error)
    throw new Error('Failed to generate code with AI')
  }
}
