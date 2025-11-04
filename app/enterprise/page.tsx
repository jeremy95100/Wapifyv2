'use client'

import Link from 'next/link'
import { useState } from 'react'
import { WapifyLogo } from '@/logo'

export default function EnterprisePage() {
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)

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
              <span className="text-wapify-accent">Enterprise</span> Solutions
            </h1>
            <p className="text-xl text-wapify-text-secondary max-w-3xl mx-auto mb-8">
              Custom solutions for large teams and organizations with specific requirements.
            </p>
          </div>

          {/* Enterprise Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center mb-4 text-wapify-accent">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Dedicated Infrastructure</h3>
              <p className="text-wapify-text-secondary">
                Private cloud deployment with guaranteed resources and uptime SLA.
              </p>
            </div>

            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center mb-4 text-wapify-accent">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Advanced Security</h3>
              <p className="text-wapify-text-secondary">
                SSO, SAML, audit logs, and compliance certifications (SOC 2, GDPR).
              </p>
            </div>

            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center mb-4 text-wapify-accent">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Team Management</h3>
              <p className="text-wapify-text-secondary">
                Advanced roles, permissions, and team collaboration features.
              </p>
            </div>

            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center mb-4 text-wapify-accent">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Priority Support</h3>
              <p className="text-wapify-text-secondary">
                Dedicated account manager and 24/7 priority support with SLA.
              </p>
            </div>

            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center mb-4 text-wapify-accent">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Custom Integrations</h3>
              <p className="text-wapify-text-secondary">
                Build custom integrations with your existing tools and workflows.
              </p>
            </div>

            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center mb-4 text-wapify-accent">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Analytics & Reporting</h3>
              <p className="text-wapify-text-secondary">
                Advanced analytics, usage reports, and custom dashboards.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-wapify-accent/10 to-wapify-accent-dark/10 border-2 border-wapify-accent rounded-2xl p-12 text-center">
              <h2 className="text-3xl font-black text-wapify-text mb-4">
                Ready to Transform Your Workflow?
              </h2>
              <p className="text-lg text-wapify-text-secondary mb-8 max-w-2xl mx-auto">
                Let's discuss how Wapify Enterprise can meet your organization's specific needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="mailto:enterprise@wapify.com"
                  className="px-8 py-3 bg-wapify-accent text-white rounded-xl font-semibold hover:bg-wapify-accent-dark transition shadow-lg"
                >
                  Contact Sales
                </Link>
                <Link
                  href="/pricing"
                  className="px-8 py-3 bg-wapify-panel border-2 border-wapify-border text-wapify-text rounded-xl font-semibold hover:bg-wapify-border transition"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>

          {/* Benefits List */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-wapify-text mb-8 text-center">
              Why Choose Wapify Enterprise?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Unlimited apps and users",
                "Custom resource allocation",
                "White-label options",
                "On-premise deployment available",
                "Dedicated training & onboarding",
                "Custom SLA agreements",
                "Volume discounts",
                "Invoice billing"
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-3 bg-wapify-panel border border-wapify-border rounded-xl p-4">
                  <span className="text-wapify-accent text-xl shrink-0">✓</span>
                  <span className="text-wapify-text-secondary">{benefit}</span>
                </div>
              ))}
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
