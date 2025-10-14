'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const router = useRouter()

  const handleGenerate = () => {
    if (prompt.trim()) {
      router.push(`/editor?prompt=${encodeURIComponent(prompt)}`)
    }
  }

  return (
    <div className="min-h-screen bg-wapify-bg">
      <nav className="fixed w-full bg-wapify-panel border-b-2 border-wapify-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-lg flex items-center justify-center text-xl">
              ⚡
            </div>
            <span className="text-2xl font-bold text-wapify-text">Wapify</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-6 py-2.5 border-2 border-wapify-accent text-wapify-accent rounded-lg font-semibold hover:bg-wapify-accent/10 transition">
              Connexion
            </Link>
            <Link href="/auth/signin" className="px-6 py-2.5 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-lg font-semibold hover:opacity-90 transition shadow-lg">
              Créer un compte
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block mb-6 px-4 py-2 bg-wapify-accent/10 border-2 border-wapify-accent/30 rounded-full">
              <span className="text-wapify-accent font-semibold text-sm">
                🚀 Generation in less than 60 seconds
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-wapify-text mb-6 leading-tight">
              Turn your idea into a<br />
              <span className="text-wapify-accent">React App</span>
            </h1>

            <p className="text-xl text-wapify-text-secondary mb-12 max-w-2xl mx-auto">
              Describe what you want, AI generates a complete React application with Vite. Database and deployment ready.
            </p>
          </div>

          <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-6 shadow-xl mb-8">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your app idea... (e.g., A modern dashboard with sales charts, customer table, and real-time statistics)"
              className="w-full min-h-[120px] bg-transparent border-none outline-none text-wapify-text placeholder-wapify-text-secondary resize-none text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate()
                }
              }}
            />

            <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-wapify-border">
              <div className="flex items-center gap-4 text-sm text-wapify-text-secondary">
                <span>💡 Be specific for better results</span>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="px-6 py-3 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-xl font-bold hover:opacity-90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>Generate App</span>
                <span>→</span>
              </button>
            </div>
          </div>

          <div className="flex justify-center gap-8 text-sm text-wapify-text-secondary flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>100 free credits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">⌘ + Enter to generate</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-32">
          <h2 className="text-4xl font-bold text-center text-wapify-text mb-4">
            Everything you need,
          </h2>
          <p className="text-xl text-center text-wapify-accent font-semibold mb-16">
            in one place
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-wapify-panel p-8 rounded-2xl border-2 border-wapify-border hover:border-wapify-accent transition">
              <div className="w-14 h-14 bg-wapify-accent/20 rounded-xl flex items-center justify-center text-3xl mb-6">
                🧠
              </div>
              <h3 className="text-2xl font-bold text-wapify-text mb-4">
                React-Specialized AI
              </h3>
              <p className="text-wapify-text-secondary leading-relaxed">
                Describe your app in plain language. Our AI generates professional React applications with modern hooks, components, and Vite configuration.
              </p>
            </div>

            <div className="bg-wapify-panel p-8 rounded-2xl border-2 border-wapify-border hover:border-wapify-accent transition">
              <div className="w-14 h-14 bg-wapify-accent/20 rounded-xl flex items-center justify-center text-3xl mb-6">
                🗄️
              </div>
              <h3 className="text-2xl font-bold text-wapify-text mb-4">
                Database Included
              </h3>
              <p className="text-wapify-text-secondary leading-relaxed">
                PostgreSQL configured automatically. Schemas, relationships, and APIs generated based on your needs.
              </p>
            </div>

            <div className="bg-wapify-panel p-8 rounded-2xl border-2 border-wapify-border hover:border-wapify-accent transition">
              <div className="w-14 h-14 bg-wapify-accent/20 rounded-xl flex items-center justify-center text-3xl mb-6">
                🚀
              </div>
              <h3 className="text-2xl font-bold text-wapify-text mb-4">
                Instant Hosting
              </h3>
              <p className="text-wapify-text-secondary leading-relaxed">
                Your app is deployed automatically with SSL. Connect your custom domain in one click.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-32">
          <h2 className="text-3xl font-bold text-center text-wapify-text mb-12">
            Try these examples
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "A modern analytics dashboard with charts and real-time data",
              "An e-commerce product page with shopping cart",
              "A task management app with drag and drop",
              "A landing page for a SaaS product"
            ].map((example, i) => (
              <button
                key={i}
                onClick={() => setPrompt(example)}
                className="text-left p-4 bg-wapify-panel border-2 border-wapify-border rounded-xl hover:border-wapify-accent transition"
              >
                <div className="flex items-start gap-3">
                  <span className="text-wapify-accent text-xl">💡</span>
                  <span className="text-wapify-text-secondary">{example}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t-2 border-wapify-border py-12 px-6 mt-32">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-lg flex items-center justify-center text-xl">
              ⚡
            </div>
            <span className="text-2xl font-bold text-wapify-text">Wapify</span>
          </div>
          <p className="text-wapify-text-secondary text-sm mb-4">
            The premium French alternative. Create complete apps with AI.
          </p>
          <p className="text-wapify-text-secondary text-sm">
            © 2025 Wapify. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}