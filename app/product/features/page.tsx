import Link from 'next/link'

export default function FeaturesPage() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Generation',
      description: 'Describe your app in plain English, and our AI creates production-ready code instantly.',
      highlights: ['Natural language input', 'Smart code generation', 'Context-aware suggestions']
    },
    {
      icon: '💻',
      title: 'Full-Stack Applications',
      description: 'Build complete applications with frontend, backend, and database - all in one place.',
      highlights: ['React/Next.js frontend', 'Node.js backend', 'PostgreSQL database']
    },
    {
      icon: '🎨',
      title: 'Beautiful Design System',
      description: 'Choose from professional design styles or describe your own custom look.',
      highlights: ['6+ pre-built styles', 'Custom designs', 'Responsive by default']
    },
    {
      icon: '⚡',
      title: 'Instant Deployment',
      description: 'Your app goes live immediately with hosting, SSL, and global CDN included.',
      highlights: ['One-click deploy', 'Free SSL certificates', 'Global edge network']
    },
    {
      icon: '🔧',
      title: 'Browser IDE',
      description: 'Edit code, manage files, and preview changes in real-time without leaving your browser.',
      highlights: ['Syntax highlighting', 'File management', 'Live preview']
    },
    {
      icon: '🔄',
      title: 'Real-time Collaboration',
      description: 'Work together with your team in real-time on shared projects.',
      highlights: ['Live editing', 'Team permissions', 'Project sharing']
    },
    {
      icon: '🌐',
      title: 'Custom Domains',
      description: 'Connect your own domain name with just a few clicks.',
      highlights: ['Easy DNS setup', 'Automatic SSL', 'Domain verification']
    },
    {
      icon: '🔌',
      title: 'Integrations',
      description: 'Connect with popular services and APIs to extend your app\'s functionality.',
      highlights: ['Payment gateways', 'Email services', 'Analytics tools']
    },
    {
      icon: '📱',
      title: 'Responsive Design',
      description: 'Every app works perfectly on desktop, tablet, and mobile devices.',
      highlights: ['Mobile-first', 'Adaptive layouts', 'Touch-optimized']
    },
    {
      icon: '🔒',
      title: 'Built-in Authentication',
      description: 'Add user authentication with just a prompt - no complex setup required.',
      highlights: ['Email/password', 'Social login', 'JWT tokens']
    },
    {
      icon: '📊',
      title: 'Database Management',
      description: 'Automatically create and manage databases with an intuitive interface.',
      highlights: ['PostgreSQL', 'Schema generation', 'Data browser']
    },
    {
      icon: '🚀',
      title: 'Export Source Code',
      description: 'Download your complete source code and host it anywhere you want.',
      highlights: ['Full code access', 'No vendor lock-in', 'Self-hosting ready']
    }
  ]

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
              Powerful <span className="text-wapify-accent">Features</span>
            </h1>
            <p className="text-xl text-wapify-text-secondary max-w-3xl mx-auto mb-8">
              Everything you need to build, deploy, and scale modern web applications.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all hover:scale-105"
              >
                <div className="w-14 h-14 bg-wapify-accent/10 rounded-xl flex items-center justify-center text-3xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-wapify-text mb-3">{feature.title}</h3>
                <p className="text-wapify-text-secondary mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-wapify-text-secondary">
                      <span className="text-wapify-accent shrink-0">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-wapify-accent/10 to-wapify-accent-dark/10 border-2 border-wapify-accent rounded-2xl p-12 text-center">
              <h2 className="text-3xl font-black text-wapify-text mb-4">
                Ready to Start Building?
              </h2>
              <p className="text-lg text-wapify-text-secondary mb-8 max-w-2xl mx-auto">
                Join thousands of developers building amazing apps with Wapify.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/signin"
                  className="px-8 py-3 bg-wapify-accent text-white rounded-xl font-semibold hover:bg-wapify-accent-dark transition shadow-lg"
                >
                  Start Free
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
