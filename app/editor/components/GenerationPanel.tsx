'use client'

import { useState, useEffect } from 'react'

interface GenerationTask {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  type: 'page' | 'component' | 'database' | 'style'
}

interface GenerationPanelProps {
  tasks: GenerationTask[]
  isExpanded: boolean
  onToggle: () => void
}

export default function GenerationPanel({ tasks, isExpanded, onToggle }: GenerationPanelProps) {
  const [hackLines, setHackLines] = useState<string[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)

  // Simulated code lines for hacker effect
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
    'return <div>Loading...</div>',
  ]

  // Generate random code lines for animation
  useEffect(() => {
    if (!isExpanded) return

    const interval = setInterval(() => {
      const randomLine = codeSnippets[Math.floor(Math.random() * codeSnippets.length)]
      setHackLines(prev => {
        const newLines = [...prev, randomLine]
        return newLines.slice(-8) // Keep only last 8 lines
      })
    }, 150)

    return () => clearInterval(interval)
  }, [isExpanded])

  // Update current task based on in_progress status
  useEffect(() => {
    const inProgressIndex = tasks.findIndex(t => t.status === 'in_progress')
    if (inProgressIndex !== -1) {
      setCurrentTaskIndex(inProgressIndex)
    }
  }, [tasks])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page': return '📄'
      case 'component': return '🧩'
      case 'database': return '💾'
      case 'style': return '🎨'
      default: return '⚡'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓'
      case 'in_progress': return '⏳'
      case 'pending': return '⏸'
      default: return '○'
    }
  }

  return (
    <div className="action-component action-group bg-white rounded-lg my-3 overflow-hidden border-2 border-wapify-border shadow-sm">
      {/* Header - Always visible */}
      <div
        className="p-3 cursor-pointer hover:bg-wapify-bg/50 transition flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded flex items-center justify-center">
            <span className="text-white text-xs">⚡</span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-wapify-text">Plan de génération</h3>
            <p className="text-[10px] text-wapify-text-secondary">
              {tasks.filter(t => t.status === 'completed').length}/{tasks.length} tâches terminées
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-wapify-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="border-t border-wapify-border">
          {/* Hacker-style code animation panel */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-3 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-wapify-accent/5 to-transparent animate-pulse"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] text-green-400 font-mono">Wapify AI coding...</span>
              </div>
              <div className="space-y-0.5 font-mono text-[9px] overflow-hidden" style={{ maxHeight: '80px' }}>
                {hackLines.map((line, idx) => (
                  <div
                    key={`${line}-${idx}`}
                    className="text-green-400/80 animate-fadeIn"
                    style={{
                      animationDelay: `${idx * 50}ms`,
                      textShadow: '0 0 5px rgba(34, 197, 94, 0.5)'
                    }}
                  >
                    <span className="text-green-600/60 mr-2">{'>'}</span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks list */}
          <div className="p-3 space-y-2">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className={`relative rounded-lg p-2.5 transition-all ${
                  task.status === 'in_progress'
                    ? 'bg-wapify-accent/10 border-2 border-wapify-accent shadow-md scale-[1.02]'
                    : task.status === 'completed'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-wapify-bg border border-wapify-border'
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* Status indicator */}
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    task.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : task.status === 'in_progress'
                      ? 'bg-wapify-accent text-white animate-pulse'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {getStatusIcon(task.status)}
                  </div>

                  {/* Task content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{getTypeIcon(task.type)}</span>
                      <h4 className="text-xs font-semibold text-wapify-text">{task.title}</h4>
                    </div>
                    <p className="text-[10px] text-wapify-text-secondary leading-relaxed">
                      {task.description}
                    </p>

                    {/* Progress bar for in-progress tasks */}
                    {task.status === 'in_progress' && (
                      <div className="mt-2 relative">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-wapify-accent to-wapify-accent-dark h-1.5 rounded-full animate-pulse relative"
                            style={{
                              width: '60%',
                              animation: 'progress 2s ease-in-out infinite'
                            }}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progress {
          0%, 100% {
            width: 50%;
          }
          50% {
            width: 80%;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
