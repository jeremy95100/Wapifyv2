'use client'

import { useState, useEffect } from 'react'

export default function CodeGenerationOverlay() {
  const [hackLines, setHackLines] = useState<string[]>([])

  const codeSnippets = [
    'import React from "react"',
    'const App = () => {',
    '  return (',
    '    <div className="container">',
    '      <header>',
    '        <h1>Welcome</h1>',
    '      </header>',
    '    </div>',
    '  )',
    '}',
    'export default App',
    'function HomePage() {',
    '  const [state, setState] = useState()',
    '  useEffect(() => {',
    '    fetchData()',
    '  }, [])',
    '  return <div>Loading...</div>',
    '}',
    'const Button = ({ children }) => {',
    '  return <button>{children}</button>',
    '}',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      const randomLine = codeSnippets[Math.floor(Math.random() * codeSnippets.length)]
      setHackLines(prev => {
        const newLines = [...prev, randomLine]
        return newLines.slice(-12) // Keep only last 12 lines
      })
    }, 120)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm z-50">
      <div className="w-full max-w-2xl p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" style={{ animationDelay: '0.4s' }}></div>
          <span className="ml-4 text-sm text-green-400 font-mono font-semibold tracking-wide">
            Wapify AI is coding...
          </span>
        </div>

        {/* Code animation */}
        <div className="bg-gray-950 rounded-lg p-6 shadow-2xl border border-green-500/20">
          <div className="space-y-1.5 font-mono text-sm overflow-hidden" style={{ minHeight: '300px' }}>
            {hackLines.map((line, idx) => (
              <div
                key={`${line}-${idx}`}
                className="text-green-400/90 animate-fadeIn flex items-start gap-3"
                style={{
                  animationDelay: `${idx * 30}ms`,
                  textShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
                }}
              >
                <span className="text-green-600/60 select-none flex-shrink-0">{'>'}</span>
                <span className="flex-1">{line}</span>
              </div>
            ))}
            {/* Cursor */}
            <div className="flex items-center gap-3">
              <span className="text-green-600/60">{'>'}</span>
              <div className="w-2 h-4 bg-green-400 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-6 flex items-center justify-center gap-8 text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
            <span>Generating components...</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Active</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
