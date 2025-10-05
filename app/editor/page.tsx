'use client'

import { useState } from 'react'

export default function EditorPage() {
  const [prompt, setPrompt] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    'Analyzing your prompt',
    'Generating React code',
    'Creating database schema',
    'Designing the interface',
    'Finalizing',
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setProgress(0)
    setCurrentStep(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }, 1000)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedCode(data.code)
        setProgress(100)
        setCurrentStep(steps.length - 1)
      } else {
        alert('Generation failed: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate app')
    } finally {
      clearInterval(progressInterval)
      setTimeout(() => setIsGenerating(false), 500)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-wapify-bg">
      {/* Top Bar */}
      <div className="h-16 bg-wapify-panel border-b-2 border-wapify-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-lg flex items-center justify-center text-lg">
            ⚡
          </div>
          <span className="text-xl font-bold text-wapify-text">Wapify</span>
          <span className="text-wapify-text-secondary">/ New Project</span>
        </div>
        
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-wapify-border text-wapify-text rounded-lg font-semibold hover:bg-wapify-accent/20 transition">
            Save
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-lg font-semibold hover:opacity-90 transition">
            Deploy
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel - Prompt */}
        <div className="w-96 bg-wapify-panel border-r-2 border-wapify-border flex flex-col">
          <div className="p-6 border-b-2 border-wapify-border">
            <h2 className="text-xl font-bold text-wapify-text mb-2">Configuration</h2>
            <p className="text-sm text-wapify-text-secondary">Describe or modify your app</p>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-wapify-text mb-2">
                📝 App Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Modern analytics dashboard with sales charts, customer table, and real-time statistics. Clean design with Tailwind CSS."
                className="w-full min-h-[200px] p-3 bg-white border-2 border-wapify-border rounded-lg text-wapify-text placeholder-wapify-text-secondary focus:border-wapify-accent focus:outline-none resize-none"
              />
            </div>

            <div className="mb-6 p-4 bg-wapify-accent/10 border-2 border-wapify-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span>💳</span>
                <strong className="text-wapify-accent-dark">Estimated cost: 20 credits</strong>
              </div>
              <div className="text-xs text-wapify-text-secondary">
                You'll have 80 credits remaining
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : '⚡ Generate App'}
            </button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col bg-wapify-bg">
          <div className="p-4 bg-wapify-panel border-b-2 border-wapify-border flex items-center gap-4">
            <div className="flex gap-2 bg-white border-2 border-wapify-border rounded-lg p-1">
              <button className="px-3 py-1 bg-wapify-accent/10 text-wapify-accent rounded font-semibold text-sm">
                🖥️ Desktop
              </button>
              <button className="px-3 py-1 text-wapify-text-secondary rounded font-semibold text-sm hover:bg-wapify-accent/10">
                📱 Mobile
              </button>
            </div>
            
            <input
              type="text"
              value="your-app.wapify.app"
              readOnly
              className="flex-1 px-3 py-1 bg-white border-2 border-wapify-border rounded-lg text-wapify-text-secondary text-sm"
            />
          </div>

          <div className="flex-1 relative">
            {/* Loading State */}
            {isGenerating && (
              <div className="absolute inset-0 bg-wapify-bg flex flex-col items-center justify-center gap-6 z-10">
                <div className="w-16 h-16 border-4 border-wapify-accent/30 border-t-wapify-accent rounded-full animate-spin"></div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-wapify-text mb-2">Generating...</h3>
                  <p className="text-wapify-text-secondary">{steps[currentStep]}</p>
                </div>

                <div className="w-80 h-2 bg-wapify-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-wapify-accent to-wapify-accent-dark transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {steps.map((step, i) => (
                    <div key={i} className={`flex items-center gap-3 ${i <= currentStep ? 'text-wapify-text' : 'text-wapify-text-secondary/50'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < currentStep ? 'bg-green-500 text-white' : i === currentStep ? 'bg-wapify-accent text-white' : 'bg-wapify-border text-wapify-text-secondary'}`}>
                        {i < currentStep ? '✓' : i + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            {generatedCode && !isGenerating ? (
              <iframe
                srcDoc={generatedCode}
                className="w-full h-full border-2 border-wapify-border rounded-lg m-4"
                style={{ width: 'calc(100% - 2rem)', height: 'calc(100% - 2rem)' }}
              />
            ) : !isGenerating && (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div>
                  <div className="text-6xl mb-4 opacity-50">✨</div>
                  <h3 className="text-2xl font-bold text-wapify-text mb-2">Ready to create?</h3>
                  <p className="text-wapify-text-secondary max-w-md">
                    Describe your app in the left panel and click "Generate" to see the magic happen
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
