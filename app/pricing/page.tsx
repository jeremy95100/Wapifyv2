'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PricingPage() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)

  const plans = [
    {
      name: 'Free',
      description: 'Perfect for getting started',
      price: { monthly: 0, yearly: 0 },
      features: [
        '25 daily credits (up to 75/month)',
        '1 public app',
        'Community support',
        'Wapify branding',
        'Basic templates'
      ],
      cta: 'Start Free',
      highlighted: false
    },
    {
      name: 'Starter',
      description: 'For individuals and small projects',
      price: { monthly: 20, yearly: 16 },
      features: [
        '100 daily credits (up to 300/month)',
        '3 apps (public or private)',
        'Email support',
        'Remove Wapify branding',
        'All design styles',
        'Basic IDE features',
        'Custom domains'
      ],
      cta: 'Start Starter',
      highlighted: false
    },
    {
      name: 'Pro',
      description: 'For professionals and growing teams',
      price: { monthly: 50, yearly: 40 },
      features: [
        'Unlimited daily credits',
        '10 apps (public or private)',
        'Priority support',
        'Full-Fledged Browser IDE',
        'All integrations',
        'Connect to Github',
        'Custom domains',
        'Up to 8 GB RAM / 4 vCPU per app',
        'Team collaboration',
        'Export source code'
      ],
      cta: 'Start Pro',
      highlighted: true
    },
    {
      name: 'Business',
      description: 'For teams and businesses',
      price: { monthly: 150, yearly: 120 },
      features: [
        'Everything in Pro',
        'Unlimited apps',
        'Dedicated support with SLA',
        'Advanced team features',
        'Role-based permissions',
        'Up to 16 GB RAM / 8 vCPU per app',
        'SSO & Advanced security',
        'Custom integrations',
        'White-label options',
        'Onboarding & training'
      ],
      cta: 'Start Business',
      highlighted: false
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
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-black text-wapify-text mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-wapify-text-secondary mb-8">
              Choose the perfect plan for your needs
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-wapify-panel border-2 border-wapify-border rounded-xl p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-wapify-accent text-white shadow-lg'
                    : 'text-wapify-text-secondary hover:text-wapify-text'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-wapify-accent text-white shadow-lg'
                    : 'text-wapify-text-secondary hover:text-wapify-text'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-6 transition-all hover:scale-105 ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-wapify-accent/10 to-wapify-accent-dark/10 border-2 border-wapify-accent shadow-2xl'
                    : 'bg-wapify-panel border-2 border-wapify-border hover:border-wapify-accent/50'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-wapify-accent text-white rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-wapify-text mb-2">{plan.name}</h3>
                  <p className="text-sm text-wapify-text-secondary mb-4">{plan.description}</p>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-wapify-text">
                      ${billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}
                    </span>
                    <span className="text-wapify-text-secondary">/month</span>
                  </div>

                  {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                    <p className="text-sm text-green-600 font-semibold">
                      ${plan.price.yearly * 12}/year (billed annually)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-wapify-text-secondary">
                      <span className="text-wapify-accent text-lg shrink-0">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push('/auth/signin')}
                  className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white hover:shadow-xl hover:scale-105'
                      : 'bg-wapify-bg border-2 border-wapify-border text-wapify-text hover:bg-wapify-border'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Enterprise CTA */}
          <div className="bg-gradient-to-r from-wapify-accent/5 to-wapify-accent-dark/5 border-2 border-wapify-accent/30 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-black text-wapify-text mb-4">
              Need a Custom Solution?
            </h2>
            <p className="text-lg text-wapify-text-secondary mb-6 max-w-2xl mx-auto">
              For enterprise needs, custom pricing, dedicated infrastructure, or special requirements, contact our team.
            </p>
            <Link
              href="/enterprise"
              className="inline-block px-8 py-3 bg-wapify-accent text-white rounded-xl font-semibold hover:bg-wapify-accent-dark transition shadow-lg"
            >
              Contact Sales
            </Link>
          </div>

          {/* FAQ Section */}
          <div className="mt-24 max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-wapify-text mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  question: 'Can I change plans later?',
                  answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the end of your billing cycle for downgrades.'
                },
                {
                  question: 'What are credits?',
                  answer: 'Credits are used when generating or modifying your apps. The amount varies based on complexity. Simple changes use fewer credits, complex apps use more.'
                },
                {
                  question: 'Do unused credits roll over?',
                  answer: 'No, credits reset daily. However, we track your monthly usage to ensure fair limits.'
                },
                {
                  question: 'Can I cancel anytime?',
                  answer: 'Yes! You can cancel your subscription at any time. Your plan will remain active until the end of your billing period.'
                },
                {
                  question: 'What payment methods do you accept?',
                  answer: 'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal for Business and Enterprise plans.'
                }
              ].map((faq, i) => (
                <details
                  key={i}
                  className="group bg-wapify-panel border-2 border-wapify-border rounded-xl p-6 hover:border-wapify-accent/50 transition-all"
                >
                  <summary className="font-bold text-lg text-wapify-text cursor-pointer list-none flex items-center justify-between">
                    <span>{faq.question}</span>
                    <span className="text-wapify-accent group-open:rotate-45 transition-transform text-2xl">+</span>
                  </summary>
                  <p className="text-wapify-text-secondary mt-4 leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
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
