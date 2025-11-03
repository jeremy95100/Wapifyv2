'use client'

import { useState, useEffect } from 'react'

interface GenerationTask {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  type: 'page' | 'component' | 'database' | 'style'
  progress?: number // Percentage 0-100
  substeps?: Array<{
    id: string
    title: string
    status: 'pending' | 'in_progress' | 'completed'
  }>
}

interface GenerationPanelProps {
  tasks: GenerationTask[]
  isExpanded: boolean
  onToggle: () => void
}

export default function GenerationPanel({ tasks, isExpanded, onToggle }: GenerationPanelProps) {
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({})

  // Simulate progress for in-progress tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setTaskProgress(prev => {
        const updated = { ...prev }
        tasks.forEach(task => {
          if (task.status === 'in_progress') {
            const current = updated[task.id] || 0
            // Progress from 0 to 85% smoothly
            if (current < 85) {
              updated[task.id] = Math.min(85, current + Math.random() * 5)
            }
          } else if (task.status === 'completed') {
            updated[task.id] = 100
          }
        })
        return updated
      })
    }, 300)

    return () => clearInterval(interval)
  }, [tasks])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        )
      case 'component':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        )
      case 'database':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
        )
      case 'style':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        )
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )
      case 'in_progress':
        return (
          <svg className="w-3 h-3 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        )
      case 'pending':
        return (
          <svg className="w-3 h-3 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="action-component action-group bg-white rounded-lg my-2 overflow-hidden border border-wapify-border shadow-sm">
      {/* Header - Always visible */}
      <div
        className="p-2.5 cursor-pointer hover:bg-wapify-bg/50 transition flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
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
          {/* Tasks list */}
          <div className="p-2.5 space-y-1.5">
            {tasks.map((task, index) => {
              const progress = taskProgress[task.id] || 0

              return (
                <div
                  key={task.id}
                  className={`relative rounded-lg p-2.5 transition-all ${
                    task.status === 'in_progress'
                      ? 'bg-wapify-accent/10 border border-wapify-accent shadow-md'
                      : task.status === 'completed'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-wapify-bg border border-wapify-border'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Status indicator */}
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      task.status === 'completed'
                        ? 'bg-green-500'
                        : task.status === 'in_progress'
                        ? 'bg-wapify-accent'
                        : 'bg-gray-300'
                    }`}>
                      {getStatusIcon(task.status)}
                    </div>

                    {/* Task content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-wapify-accent">
                          {getTypeIcon(task.type)}
                        </div>
                        <h4 className="text-xs font-semibold text-wapify-text">{task.title}</h4>
                      </div>
                      <p className="text-[10px] text-wapify-text-secondary leading-relaxed mb-2">
                        {task.description}
                      </p>

                      {/* Progress bar - Always show for in_progress and completed tasks */}
                      {(task.status === 'in_progress' || task.status === 'completed') && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-medium text-wapify-text-secondary">
                              Progression
                            </span>
                            <span className="text-[9px] font-bold text-wapify-accent">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-wapify-accent to-wapify-accent-dark h-1.5 rounded-full transition-all duration-300 ease-out relative"
                              style={{ width: `${progress}%` }}
                            >
                              {task.status === 'in_progress' && (
                                <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Substeps */}
                      {task.substeps && task.substeps.length > 0 && (
                        <div className="mt-3 space-y-1 pl-2 border-l-2 border-gray-200">
                          {task.substeps.map((substep) => (
                            <div
                              key={substep.id}
                              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                {substep.status === 'completed' ? (
                                  <svg
                                    className="w-3.5 h-3.5 text-green-500 flex-shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="m9 12 2 2 4-4"/>
                                  </svg>
                                ) : substep.status === 'in_progress' ? (
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-wapify-accent border-t-transparent animate-spin flex-shrink-0"></div>
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                                )}
                                <span className="text-[10px] text-gray-700">{substep.title}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
