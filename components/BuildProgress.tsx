'use client'

import { useEffect, useState } from 'react'

interface BuildProgressProps {
  jobId: string | null
  onComplete: (buildUrl: string) => void
  onError: (error: string) => void
}

/**
 * Composant de progression de build
 * Affiche l'état du build en cours et poll le serveur pour les mises à jour
 */
export default function BuildProgress({ jobId, onComplete, onError }: BuildProgressProps) {
  const [status, setStatus] = useState<'queued' | 'building' | 'completed' | 'failed'>('queued')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Initialisation...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return

    let interval: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/build?jobId=${jobId}`)
        const data = await response.json()

        console.log('Build status:', data)

        // Mettre à jour le statut
        if (data.state === 'waiting') {
          setStatus('queued')
          setMessage('En file d\'attente...')
          setProgress(0)
        } else if (data.state === 'active') {
          setStatus('building')
          setProgress(data.progress || 50)
          
          // Messages basés sur la progression
          if (data.progress < 20) {
            setMessage('Installation des dépendances...')
          } else if (data.progress < 60) {
            setMessage('Compilation avec Vite...')
          } else if (data.progress < 90) {
            setMessage('Optimisation du build...')
          } else {
            setMessage('Upload vers le storage...')
          }
        } else if (data.state === 'completed') {
          setStatus('completed')
          setProgress(100)
          setMessage('Build terminé !')
          clearInterval(interval)
          
          // Appeler le callback avec l'URL du build
          if (data.result?.url) {
            setTimeout(() => onComplete(data.result.url), 500)
          }
        } else if (data.state === 'failed') {
          setStatus('failed')
          setProgress(0)
          const errorMsg = data.failedReason || 'Le build a échoué'
          setMessage(`Échec: ${errorMsg}`)
          setError(errorMsg)
          clearInterval(interval)
          onError(errorMsg)
        }
      } catch (err) {
        console.error('Error checking build status:', err)
        setStatus('failed')
        setError('Impossible de vérifier le statut du build')
        clearInterval(interval)
      }
    }

    // Vérifier immédiatement
    checkStatus()

    // Puis vérifier toutes les 2 secondes
    interval = setInterval(checkStatus, 2000)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [jobId, onComplete, onError])

  const retry = () => {
    window.location.reload()
  }

  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full p-8">
        {/* Icône de statut */}
        <div className="text-center mb-6">
          {status === 'queued' && (
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          )}
          {status === 'building' && (
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
              </div>
            </div>
          )}
          {status === 'completed' && (
            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === 'failed' && (
            <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {status === 'queued' && 'En file d\'attente'}
            {status === 'building' && 'Build en cours'}
            {status === 'completed' && 'Build terminé !'}
            {status === 'failed' && 'Échec du build'}
          </h3>
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Barre de progression */}
        {(status === 'building' || status === 'queued') && (
          <div className="mb-6">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Bouton retry si échec */}
        {status === 'failed' && (
          <div className="space-y-3">
            <button
              onClick={retry}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              🔄 Réessayer
            </button>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Info temps estimé */}
        {(status === 'building' || status === 'queued') && (
          <p className="text-sm text-gray-500 text-center">
            ⏱️ Temps estimé: 15-30 secondes
          </p>
        )}
      </div>
    </div>
  )
}
