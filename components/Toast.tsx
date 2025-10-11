'use client'

import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    warning: '⚠'
  }

  const colors = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg ${colors[type]} min-w-[300px] max-w-[500px]`}>
        <span className="text-2xl">{icons[type]}</span>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-xl opacity-60 hover:opacity-100 transition"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Hook personnalisé pour utiliser les toasts
export function useToast() {
  // À implémenter avec un contexte global si besoin
  // Pour l'instant, simple fonction utilitaire
  return {
    showSuccess: (message: string) => console.log('Success:', message),
    showError: (message: string) => console.error('Error:', message),
    showInfo: (message: string) => console.info('Info:', message),
    showWarning: (message: string) => console.warn('Warning:', message)
  }
}