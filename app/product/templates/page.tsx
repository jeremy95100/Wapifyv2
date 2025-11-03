'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ModernMinimalistPreview,
  GradientVibrantPreview,
  DarkModePreview,
  BrutalistPreview,
  GlassmorphismPreview
} from '@/components/StylePreviews'

export default function TemplatesPage() {
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)

  const templates = [
    {
      name: 'Modern Minimalist',
      preview: ModernMinimalistPreview,
      description: 'Clean, simple designs that put content first with subtle animations.',
      tags: ['Professional', 'Business', 'SaaS']
    },
    {
      name: 'Gradient Vibrant',
      preview: GradientVibrantPreview,
      description: 'Bold gradients and vibrant colors perfect for creative projects.',
      tags: ['Creative', 'Portfolio', 'Agency']
    },
    {
      name: 'Dark Mode Premium',
      preview: DarkModePreview,
      description: 'Sleek dark interface with neon accents for modern tech products.',
      tags: ['Tech', 'Dashboard', 'Gaming']
    },
    {
      name: 'Brutalist Bold',
      preview: BrutalistPreview,
      description: 'Raw, unapologetic design that makes a strong statement.',
      tags: ['Portfolio', 'Art', 'Bold']
    },
    {
      name: 'Glassmorphism',
      preview: GlassmorphismPreview,
      description: 'Elegant frosted glass effects with translucent layers.',
      tags: ['Premium', 'Luxury', 'Modern']
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
              Design <span className="text-wapify-accent">Templates</span>
            </h1>
            <p className="text-xl text-wapify-text-secondary max-w-3xl mx-auto mb-8">
              Choose from our collection of professionally designed templates, or describe your own custom design.
            </p>
          </div>

          {/* Templates Grid */}
          <div className="space-y-16 mb-16">
            {templates.map((template, index) => (
              <div key={index} className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Preview */}
                <div className={index % 2 === 0 ? 'order-1' : 'order-1 lg:order-2'}>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-wapify-accent/20 to-wapify-accent-dark/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse"></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-wapify-border hover:scale-105 transition-transform duration-300">
                      <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                      </div>
                      <div className="h-80 overflow-hidden">
                        <div className="scale-75 origin-top-left" style={{width: '133.33%', height: '133.33%'}}>
                          <template.preview />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className={index % 2 === 0 ? 'order-2' : 'order-2 lg:order-1'}>
                  <h3 className="text-3xl font-black text-wapify-text mb-4">{template.name}</h3>
                  <p className="text-lg text-wapify-text-secondary mb-6">{template.description}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {template.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-wapify-accent/10 text-wapify-accent text-sm font-semibold rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/auth/signin"
                    className="inline-block px-6 py-3 bg-wapify-accent text-white rounded-xl font-semibold hover:bg-wapify-accent-dark transition shadow-lg"
                  >
                    Try This Style
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Design CTA */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-wapify-accent/10 to-wapify-accent-dark/10 border-2 border-wapify-accent rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-wapify-accent rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg">
                ✨
              </div>
              <h2 className="text-3xl font-black text-wapify-text mb-4">
                Don't See What You Want?
              </h2>
              <p className="text-lg text-wapify-text-secondary mb-8 max-w-2xl mx-auto">
                Simply describe your custom design in plain language, and our AI will create a unique look tailored to your vision.
              </p>
              <Link
                href="/auth/signin"
                className="inline-block px-8 py-3 bg-wapify-accent text-white rounded-xl font-semibold hover:bg-wapify-accent-dark transition shadow-lg"
              >
                Create Custom Design
              </Link>
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
