'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignInForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/editor'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        // Inscription
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Erreur lors de l\'inscription')
          setLoading(false)
          return
        }

        // Connexion automatique après inscription
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('Compte créé mais erreur de connexion. Veuillez vous connecter.')
          setIsSignUp(false)
        } else {
          router.push(callbackUrl)
        }
      } else {
        // Connexion
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('Email ou mot de passe incorrect')
        } else {
          router.push(callbackUrl)
        }
      }
    } catch (err) {
      setError('Une erreur est survenue')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl })
  }

  return (
    <div className="min-h-screen bg-wapify-bg flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-lg flex items-center justify-center text-2xl">
              ⚡
            </div>
            <span className="text-3xl font-bold text-wapify-text">Wapify</span>
          </Link>
          <h1 className="text-2xl font-bold text-wapify-text mt-4">
            {isSignUp ? 'Créer un compte' : 'Connexion'}
          </h1>
          <p className="text-wapify-text-secondary mt-2">
            {isSignUp
              ? 'Commencez à créer des applications avec l\'IA'
              : 'Connectez-vous pour continuer'
            }
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 shadow-xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-wapify-text mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-wapify-border rounded-lg text-wapify-text placeholder-wapify-text-secondary focus:border-wapify-accent focus:outline-none"
                  placeholder="Votre nom"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-wapify-text mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border-2 border-wapify-border rounded-lg text-wapify-text placeholder-wapify-text-secondary focus:border-wapify-accent focus:outline-none"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-wapify-text mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white border-2 border-wapify-border rounded-lg text-wapify-text placeholder-wapify-text-secondary focus:border-wapify-accent focus:outline-none"
                placeholder="••••••••"
              />
              {isSignUp && (
                <p className="text-xs text-wapify-text-secondary mt-1">
                  Au moins 6 caractères
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Chargement...'
                : isSignUp
                ? 'Créer mon compte'
                : 'Se connecter'
              }
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-wapify-border"></div>
            <span className="text-sm text-wapify-text-secondary">OU</span>
            <div className="flex-1 h-px bg-wapify-border"></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 bg-white border-2 border-wapify-border text-wapify-text rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          {/* Toggle Sign In/Sign Up */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="text-sm text-wapify-text-secondary hover:text-wapify-accent transition"
            >
              {isSignUp
                ? 'Vous avez déjà un compte ? Connectez-vous'
                : 'Pas encore de compte ? Inscrivez-vous'
              }
            </button>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-wapify-text-secondary hover:text-wapify-accent transition"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-wapify-bg flex items-center justify-center">
        <div className="text-wapify-text">Chargement...</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
