'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [isInputSticky, setIsInputSticky] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsInputSticky(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleGenerate = () => {
    if (prompt.trim()) {
      router.push(`/editor?prompt=${encodeURIComponent(prompt)}`)
    }
  }

  const examples = [
    {
      title: "Analytics Dashboard",
      description: "Real-time charts, KPI cards, and data tables with filtering",
      prompt: "A modern analytics dashboard with real-time charts showing revenue trends, KPI cards for key metrics, and a data table with search and filters",
      icon: "📊",
      color: "from-blue-500/20 to-purple-500/20"
    },
    {
      title: "E-commerce Store",
      description: "Product catalog, shopping cart, and checkout flow",
      prompt: "An e-commerce product page with image gallery, add to cart, product variations, reviews section, and related products",
      icon: "🛍️",
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      title: "Task Manager",
      description: "Kanban board with drag-and-drop and filters",
      prompt: "A task management app with drag and drop kanban board, task details modal, priority labels, and team member assignments",
      icon: "✅",
      color: "from-orange-500/20 to-red-500/20"
    },
    {
      title: "SaaS Landing Page",
      description: "Modern landing with features, pricing, and testimonials",
      prompt: "A landing page for a SaaS product with hero section, features grid, pricing table, customer testimonials, and FAQ section",
      icon: "🚀",
      color: "from-purple-500/20 to-pink-500/20"
    }
  ]

  return (
    <div className="min-h-screen bg-wapify-bg relative">
      {/* Grain texture overlay */}
      <div className="grain-texture"></div>

      {/* Navigation */}
      <nav className="fixed w-full bg-wapify-panel/80 backdrop-blur-md border-b border-wapify-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-xl flex items-center justify-center text-xl shadow-lg">
                ⚡
              </div>
              <span className="text-2xl font-bold text-wapify-text">Wapify</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm font-medium text-wapify-text-secondary hover:text-wapify-text transition">
                Features
              </Link>
              <Link href="#examples" className="text-sm font-medium text-wapify-text-secondary hover:text-wapify-text transition">
                Examples
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-wapify-text-secondary hover:text-wapify-text transition">
                Pricing
              </Link>
              <Link href="#docs" className="text-sm font-medium text-wapify-text-secondary hover:text-wapify-text transition">
                Docs
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="px-5 py-2 text-wapify-text-secondary hover:text-wapify-text transition font-medium">
              Sign in
            </Link>
            <Link href="/auth/signin" className="px-6 py-2.5 bg-wapify-accent text-white rounded-xl font-semibold hover:bg-wapify-accent-dark transition shadow-md">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Sticky Input Bar */}
      {isInputSticky && (
        <div className="fixed top-20 left-0 right-0 z-40 px-6 py-4 bg-wapify-panel/95 backdrop-blur-md border-b border-wapify-border animate-fadeIn">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What are you building?"
              className="flex-1 min-h-[50px] bg-wapify-bg border border-wapify-border rounded-xl px-4 py-3 outline-none text-wapify-text placeholder-wapify-text-secondary/50 resize-none text-sm focus:border-wapify-accent transition"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate()
                }
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="px-6 py-3 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
            >
              Build →
            </button>
          </div>
        </div>
      )}

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block mb-6 px-4 py-2 bg-wapify-accent/10 border border-wapify-accent/20 rounded-full animate-fadeIn">
                <span className="text-wapify-accent font-semibold text-sm">
                  ⚡ Generate apps in under 60 seconds
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-wapify-text mb-8 leading-[1.1] tracking-tight animate-fadeIn">
                Build Apps in Minutes, Not Months
              </h1>

              <p className="text-xl md:text-2xl text-wapify-text-secondary mb-16 max-w-3xl mx-auto leading-relaxed animate-fadeIn">
                Describe your idea in any language. AI builds a complete, production-ready web app with database and hosting included.
              </p>
            </div>

            {/* Input Card */}
            <div className="bg-wapify-panel/60 backdrop-blur-sm border-2 border-wapify-border rounded-2xl p-8 shadow-2xl mb-8 hover:border-wapify-accent/30 transition-all duration-300 animate-fadeIn">
              <div className="mb-4">
                <label className="text-sm font-semibold text-wapify-text-secondary mb-2 block">
                  What are you building?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A modern analytics dashboard with real-time charts and data tables..."
                  className="w-full min-h-[140px] bg-wapify-bg/50 border border-wapify-border rounded-xl p-4 outline-none text-wapify-text placeholder-wapify-text-secondary/50 resize-none text-lg focus:border-wapify-accent transition"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleGenerate()
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-wapify-text-secondary">
                  <span className="opacity-70">💡 Pro tip: Be specific about features</span>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 group"
                >
                  <span>Start Building</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>

            {/* Benefits bar */}
            <div className="flex justify-center gap-8 text-sm text-wapify-text-secondary flex-wrap animate-fadeIn">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Multi-language support</span>
              </div>
              <div className="flex items-center gap-2 opacity-60">
                <kbd className="px-2 py-1 bg-wapify-border/50 rounded text-xs">⌘</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-wapify-border/50 rounded text-xs">Enter</kbd>
                <span>to generate</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-6 bg-wapify-panel/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-wapify-text mb-4">
                How It Works
              </h2>
              <p className="text-xl text-wapify-text-secondary">
                From idea to deployed app in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-wapify-accent/20 to-wapify-accent/5 rounded-2xl flex items-center justify-center mb-6 border-2 border-wapify-accent/20">
                    <span className="text-4xl">✍️</span>
                  </div>
                  <div className="absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-wapify-accent/50 to-transparent hidden md:block" style={{transform: 'translateX(50%)'}}></div>
                  <h3 className="text-2xl font-bold text-wapify-text mb-3">
                    1. Describe Your App
                  </h3>
                  <p className="text-wapify-text-secondary leading-relaxed">
                    Tell us what you want to build in any language. No technical knowledge needed.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-wapify-accent/20 to-wapify-accent/5 rounded-2xl flex items-center justify-center mb-6 border-2 border-wapify-accent/20">
                    <span className="text-4xl">🤖</span>
                  </div>
                  <div className="absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-wapify-accent/50 to-transparent hidden md:block" style={{transform: 'translateX(50%)'}}></div>
                  <h3 className="text-2xl font-bold text-wapify-text mb-3">
                    2. AI Generates Code
                  </h3>
                  <p className="text-wapify-text-secondary leading-relaxed">
                    Our AI creates production-ready code, sets up your database, and configures everything.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-wapify-accent/20 to-wapify-accent/5 rounded-2xl flex items-center justify-center mb-6 border-2 border-wapify-accent/20">
                    <span className="text-4xl">🚀</span>
                  </div>
                  <h3 className="text-2xl font-bold text-wapify-text mb-3">
                    3. Deploy Instantly
                  </h3>
                  <p className="text-wapify-text-secondary leading-relaxed">
                    Your app goes live immediately with hosting, SSL, and a custom domain ready to connect.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-wapify-text mb-4">
                Everything You Need
              </h2>
              <p className="text-xl text-wapify-text-secondary">
                Full-stack development, simplified
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "🧠",
                  title: "AI-Powered Generation",
                  description: "Advanced AI understands your requirements and generates clean, maintainable code with modern best practices."
                },
                {
                  icon: "🌍",
                  title: "Multi-Language Input",
                  description: "Describe your app in English, French, Spanish, or any language. AI understands them all."
                },
                {
                  icon: "🗄️",
                  title: "PostgreSQL Database",
                  description: "Fully configured database with schemas, relationships, and API endpoints generated automatically."
                },
                {
                  icon: "🎨",
                  title: "Beautiful UI",
                  description: "Modern, responsive designs with Tailwind CSS. Every component looks great on any device."
                },
                {
                  icon: "🔒",
                  title: "Secure by Default",
                  description: "SSL certificates, authentication ready, and security best practices built in from day one."
                },
                {
                  icon: "⚡",
                  title: "Instant Deployment",
                  description: "Your app goes live in seconds with automatic scaling, CDN, and global edge network."
                }
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group bg-wapify-panel/60 backdrop-blur-sm p-8 rounded-2xl border-2 border-wapify-border hover:border-wapify-accent/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-wapify-accent/20 to-wapify-accent/5 rounded-xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-wapify-text mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-wapify-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Examples - Bolt Style */}
        <section id="examples" className="py-24 px-6 bg-wapify-panel/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-wapify-text mb-4">
                Get Inspired
              </h2>
              <p className="text-xl text-wapify-text-secondary">
                Try these example prompts to see what's possible
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {examples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example.prompt)}
                  className="group text-left bg-wapify-panel border-2 border-wapify-border rounded-2xl overflow-hidden hover:border-wapify-accent transition-all duration-200 hover:shadow-xl"
                >
                  <div className={`p-6 bg-gradient-to-br ${example.color} border-b-2 border-wapify-border`}>
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-5xl">{example.icon}</span>
                      <h3 className="text-2xl font-bold text-wapify-text">
                        {example.title}
                      </h3>
                    </div>
                    <p className="text-sm text-wapify-text-secondary">
                      {example.description}
                    </p>
                  </div>
                  <div className="p-6 bg-wapify-bg/50">
                    <p className="text-sm text-wapify-text-secondary/70 line-clamp-2 group-hover:text-wapify-text transition">
                      {example.prompt}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-wapify-accent font-semibold text-sm">
                      <span>Try this prompt</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-wapify-text mb-6">
              Ready to Build Something Amazing?
            </h2>
            <p className="text-xl text-wapify-text-secondary mb-12">
              Join thousands of developers shipping faster with Wapify
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <span>Start Building for Free</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-wapify-border py-16 px-6 relative z-10 bg-wapify-panel/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-xl flex items-center justify-center text-xl shadow-lg">
                  ⚡
                </div>
                <span className="text-2xl font-bold text-wapify-text">Wapify</span>
              </div>
              <p className="text-sm text-wapify-text-secondary leading-relaxed mb-4">
                Web App Simplify. Build complete web applications in minutes using AI. No coding required.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-wapify-text mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-wapify-text-secondary hover:text-wapify-text transition">Features</a></li>
                <li><a href="#pricing" className="text-wapify-text-secondary hover:text-wapify-text transition">Pricing</a></li>
                <li><a href="#" className="text-wapify-text-secondary hover:text-wapify-text transition">Changelog</a></li>
                <li><a href="#" className="text-wapify-text-secondary hover:text-wapify-text transition">Status</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold text-wapify-text mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#docs" className="text-wapify-text-secondary hover:text-wapify-text transition">Documentation</a></li>
                <li><a href="#" className="text-wapify-text-secondary hover:text-wapify-text transition">Guides</a></li>
                <li><a href="#" className="text-wapify-text-secondary hover:text-wapify-text transition">Blog</a></li>
                <li><a href="#" className="text-wapify-text-secondary hover:text-wapify-text transition">Support</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-wapify-text mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-wapify-text-secondary hover:text-wapify-text transition">About</a></li>
                <li><a href="#" className="text-wapify-text-secondary hover:text-wapify-text transition">Contact</a></li>
                <li><a href="#" className="text-wapify-text-secondary hover:text-wapify-text transition">Privacy</a></li>
                <li><a href="#" className="text-wapify-text-secondary hover:text-wapify-text transition">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-wapify-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-wapify-text-secondary">
              © 2025 Wapify. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-wapify-text-secondary">
              <span>Pages to come: Features • Pricing • Examples • Docs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
