'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function IntegrationsPage() {
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)

  const integrations = [
    {
      category: 'Payments',
      icon: '💳',
      items: [
        { name: 'Stripe', description: 'Accept payments and manage subscriptions' },
        { name: 'PayPal', description: 'Global payment processing' },
        { name: 'Square', description: 'Point of sale and online payments' }
      ]
    },
    {
      category: 'Authentication',
      icon: '🔐',
      items: [
        { name: 'Auth0', description: 'Enterprise authentication platform' },
        { name: 'Google OAuth', description: 'Sign in with Google' },
        { name: 'GitHub OAuth', description: 'Sign in with GitHub' }
      ]
    },
    {
      category: 'Email',
      icon: '📧',
      items: [
        { name: 'SendGrid', description: 'Email delivery and marketing' },
        { name: 'Mailgun', description: 'Transactional email API' },
        { name: 'Resend', description: 'Modern email for developers' }
      ]
    },
    {
      category: 'Analytics',
      icon: '📊',
      items: [
        { name: 'Google Analytics', description: 'Web analytics and reporting' },
        { name: 'Mixpanel', description: 'Product analytics' },
        { name: 'PostHog', description: 'Open-source product analytics' }
      ]
    },
    {
      category: 'Storage',
      icon: '📦',
      items: [
        { name: 'AWS S3', description: 'Object storage service' },
        { name: 'Cloudinary', description: 'Media management platform' },
        { name: 'Vercel Blob', description: 'Edge-optimized storage' }
      ]
    },
    {
      category: 'Communication',
      icon: '💬',
      items: [
        { name: 'Twilio', description: 'SMS and voice communications' },
        { name: 'Slack', description: 'Team messaging and notifications' },
        { name: 'Discord', description: 'Community communications' }
      ]
    },
    {
      category: 'Database',
      icon: '🗄️',
      items: [
        { name: 'PostgreSQL', description: 'Relational database (built-in)' },
        { name: 'Redis', description: 'In-memory data store' },
        { name: 'MongoDB', description: 'NoSQL document database' }
      ]
    },
    {
      category: 'AI/ML',
      icon: '🤖',
      items: [
        { name: 'OpenAI', description: 'GPT models and DALL-E' },
        { name: 'Anthropic', description: 'Claude AI models' },
        { name: 'Replicate', description: 'Run ML models in the cloud' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-wapify-bg">
      <div className="grain-texture"></div>

      {/* Navigation */}
      <nav className="fixed w-full bg-wapify-panel/80 backdrop-blur-md border-b border-wapify-border z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-xl flex items-center justify-center text-xl shadow-lg">
                ⚡
              </div>
              <span className="text-2xl font-bold text-wapify-text">Wapify</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {/* Product Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsProductDropdownOpen(true)}
                onMouseLeave={() => setIsProductDropdownOpen(false)}
              >
                <button className="text-sm font-medium text-wapify-text-secondary hover:text-wapify-text transition flex items-center gap-1">
                  Product
                  <svg className={`w-4 h-4 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>

                {isProductDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-wapify-panel border-2 border-wapify-border rounded-xl shadow-xl overflow-hidden">
                    <Link href="/product/templates" className="block px-4 py-3 text-sm text-wapify-text-secondary hover:bg-wapify-bg hover:text-wapify-text transition">
                      Templates
                    </Link>
                    <Link href="/product/features" className="block px-4 py-3 text-sm text-wapify-text-secondary hover:bg-wapify-bg hover:text-wapify-text transition">
                      Features
                    </Link>
                    <Link href="/product/integrations" className="block px-4 py-3 text-sm text-wapify-text-secondary hover:bg-wapify-bg hover:text-wapify-text transition">
                      Integrations
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/community" className="text-sm font-medium text-wapify-text-secondary hover:text-wapify-text transition">
                Community
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-wapify-text-secondary hover:text-wapify-text transition">
                Pricing
              </Link>
              <Link href="/enterprise" className="text-sm font-medium text-wapify-text-secondary hover:text-wapify-text transition">
                Enterprise
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

      <main className="pt-32 pb-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black text-wapify-text mb-6">
              Powerful <span className="text-wapify-accent">Integrations</span>
            </h1>
            <p className="text-xl text-wapify-text-secondary max-w-3xl mx-auto mb-8">
              Connect with popular services and APIs to extend your app's functionality. Just describe what you need, and we'll integrate it.
            </p>
          </div>

          {/* Integrations Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {integrations.map((category, index) => (
              <div
                key={index}
                className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center text-2xl">
                    {category.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-wapify-text">{category.category}</h3>
                </div>
                <div className="space-y-4">
                  {category.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-wapify-bg rounded-xl hover:bg-wapify-accent/5 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-wapify-accent mt-2 shrink-0"></div>
                      <div>
                        <div className="font-semibold text-wapify-text">{item.name}</div>
                        <div className="text-sm text-wapify-text-secondary">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Integration CTA */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-gradient-to-br from-wapify-accent/10 to-wapify-accent-dark/10 border-2 border-wapify-accent rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-wapify-accent rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg">
                🔌
              </div>
              <h2 className="text-3xl font-black text-wapify-text mb-4">
                Need a Custom Integration?
              </h2>
              <p className="text-lg text-wapify-text-secondary mb-8 max-w-2xl mx-auto">
                Simply describe the API or service you want to integrate, and our AI will handle the connection for you.
              </p>
              <Link
                href="/auth/signin"
                className="inline-block px-8 py-3 bg-wapify-accent text-white rounded-xl font-semibold hover:bg-wapify-accent-dark transition shadow-lg"
              >
                Request Integration
              </Link>
            </div>
          </div>

          {/* How It Works */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-wapify-text mb-12 text-center">
              How Integrations Work
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-wapify-accent/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  1️⃣
                </div>
                <h3 className="text-xl font-bold text-wapify-text mb-3">Describe What You Need</h3>
                <p className="text-wapify-text-secondary">
                  Tell us which service you want to integrate and how you want to use it.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-wapify-accent/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  2️⃣
                </div>
                <h3 className="text-xl font-bold text-wapify-text mb-3">AI Sets It Up</h3>
                <p className="text-wapify-text-secondary">
                  Our AI handles all the API configuration, authentication, and error handling.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-wapify-accent/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  3️⃣
                </div>
                <h3 className="text-xl font-bold text-wapify-text mb-3">Start Using It</h3>
                <p className="text-wapify-text-secondary">
                  Your integration is ready to use. Add your API keys and start building.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-wapify-border py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-wapify-text-secondary">
            © 2025 Wapify. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
