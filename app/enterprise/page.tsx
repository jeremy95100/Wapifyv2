import Link from 'next/link'

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-wapify-bg">
      <div className="grain-texture"></div>

      {/* Navigation */}
      <nav className="fixed w-full bg-wapify-panel/80 backdrop-blur-md border-b border-wapify-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-xl flex items-center justify-center text-xl shadow-lg">
              ⚡
            </div>
            <span className="text-2xl font-bold text-wapify-text">Wapify</span>
          </Link>
          <Link href="/" className="px-6 py-2.5 bg-wapify-accent text-white rounded-xl font-semibold hover:bg-wapify-accent-dark transition">
            Back to Home
          </Link>
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
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                🏢
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Dedicated Infrastructure</h3>
              <p className="text-wapify-text-secondary">
                Private cloud deployment with guaranteed resources and uptime SLA.
              </p>
            </div>

            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                🔒
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Advanced Security</h3>
              <p className="text-wapify-text-secondary">
                SSO, SAML, audit logs, and compliance certifications (SOC 2, GDPR).
              </p>
            </div>

            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                👥
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Team Management</h3>
              <p className="text-wapify-text-secondary">
                Advanced roles, permissions, and team collaboration features.
              </p>
            </div>

            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                🎯
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Priority Support</h3>
              <p className="text-wapify-text-secondary">
                Dedicated account manager and 24/7 priority support with SLA.
              </p>
            </div>

            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                🔧
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Custom Integrations</h3>
              <p className="text-wapify-text-secondary">
                Build custom integrations with your existing tools and workflows.
              </p>
            </div>

            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                📊
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
