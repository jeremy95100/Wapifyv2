'use client'

import Link from 'next/link'
import { useState } from 'react'
import { WapifyLogo } from '@/logo'

export default function IntegrationsPage() {
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)

  const integrations = [
    {
      category: 'Payments',
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      items: [
        { name: 'Stripe', description: 'Accept payments and manage subscriptions' },
        { name: 'PayPal', description: 'Global payment processing' },
        { name: 'Square', description: 'Point of sale and online payments' }
      ]
    },
    {
      category: 'Authentication',
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      items: [
        { name: 'Auth0', description: 'Enterprise authentication platform' },
        { name: 'Google OAuth', description: 'Sign in with Google' },
        { name: 'GitHub OAuth', description: 'Sign in with GitHub' }
      ]
    },
    {
      category: 'Email',
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      items: [
        { name: 'SendGrid', description: 'Email delivery and marketing' },
        { name: 'Mailgun', description: 'Transactional email API' },
        { name: 'Resend', description: 'Modern email for developers' }
      ]
    },
    {
      category: 'Analytics',
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      items: [
        { name: 'Google Analytics', description: 'Web analytics and reporting' },
        { name: 'Mixpanel', description: 'Product analytics' },
        { name: 'PostHog', description: 'Open-source product analytics' }
      ]
    },
    {
      category: 'Storage',
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      items: [
        { name: 'AWS S3', description: 'Object storage service' },
        { name: 'Cloudinary', description: 'Media management platform' },
        { name: 'Vercel Blob', description: 'Edge-optimized storage' }
      ]
    },
    {
      category: 'Communication',
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      items: [
        { name: 'Twilio', description: 'SMS and voice communications' },
        { name: 'Slack', description: 'Team messaging and notifications' },
        { name: 'Discord', description: 'Community communications' }
      ]
    },
    {
      category: 'Database',
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      items: [
        { name: 'PostgreSQL', description: 'Relational database (built-in)' },
        { name: 'Redis', description: 'In-memory data store' },
        { name: 'MongoDB', description: 'NoSQL document database' }
      ]
    },
    {
      category: 'AI/ML',
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
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
              <WapifyLogo withText={true} />
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
                  <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center text-wapify-accent">
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
              <div className="w-16 h-16 bg-wapify-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg text-white">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
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
                <div className="w-16 h-16 bg-wapify-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-black text-wapify-accent">1</span>
                </div>
                <h3 className="text-xl font-bold text-wapify-text mb-3">Describe What You Need</h3>
                <p className="text-wapify-text-secondary">
                  Tell us which service you want to integrate and how you want to use it.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-wapify-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-black text-wapify-accent">2</span>
                </div>
                <h3 className="text-xl font-bold text-wapify-text mb-3">AI Sets It Up</h3>
                <p className="text-wapify-text-secondary">
                  Our AI handles all the API configuration, authentication, and error handling.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-wapify-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-black text-wapify-accent">3</span>
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
      <footer className="border-t border-wapify-border py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-6 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <WapifyLogo withText={true} />
              </div>
              <p className="text-sm text-wapify-text-secondary leading-relaxed mb-4">
                Web App Simplify. Build complete web applications in minutes using AI. No coding required.
              </p>
            </div>

            {/* Products */}
            <div>
              <h4 className="font-bold text-wapify-text mb-4">Products</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/product/templates" className="text-wapify-text-secondary hover:text-wapify-text transition">Templates</Link></li>
                <li><Link href="/product/features" className="text-wapify-text-secondary hover:text-wapify-text transition">Features</Link></li>
                <li><Link href="/product/integrations" className="text-wapify-text-secondary hover:text-wapify-text transition">Integrations</Link></li>
                <li><Link href="/pricing" className="text-wapify-text-secondary hover:text-wapify-text transition">Pricing</Link></li>
                <li><Link href="/enterprise" className="text-wapify-text-secondary hover:text-wapify-text transition">Enterprise</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold text-wapify-text mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs" className="text-wapify-text-secondary hover:text-wapify-text transition">Docs & FAQ</Link></li>
                <li><Link href="/community" className="text-wapify-text-secondary hover:text-wapify-text transition">Community</Link></li>
                <li><Link href="/blog" className="text-wapify-text-secondary hover:text-wapify-text transition">Blog</Link></li>
                <li><Link href="/support" className="text-wapify-text-secondary hover:text-wapify-text transition">Support</Link></li>
                <li><Link href="/changelog" className="text-wapify-text-secondary hover:text-wapify-text transition">Changelog</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-wapify-text mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-wapify-text-secondary hover:text-wapify-text transition">About Us</Link></li>
                <li><Link href="/careers" className="text-wapify-text-secondary hover:text-wapify-text transition">Careers</Link></li>
                <li><Link href="/affiliate" className="text-wapify-text-secondary hover:text-wapify-text transition">Affiliate Program</Link></li>
                <li><Link href="/contact" className="text-wapify-text-secondary hover:text-wapify-text transition">Contact</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-wapify-text mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-wapify-text-secondary hover:text-wapify-text transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-wapify-text-secondary hover:text-wapify-text transition">Terms of Service</Link></li>
                <li><Link href="/cookies" className="text-wapify-text-secondary hover:text-wapify-text transition">Cookie Policy</Link></li>
                <li><Link href="/gdpr" className="text-wapify-text-secondary hover:text-wapify-text transition">GDPR</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-wapify-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-wapify-text-secondary">
              © 2025 Wapify. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-wapify-text-secondary">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-wapify-text transition">Twitter</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-wapify-text transition">GitHub</a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="hover:text-wapify-text transition">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
