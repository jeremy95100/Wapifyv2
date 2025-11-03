import Link from 'next/link'

export default function CommunityPage() {
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
              Join the <span className="text-wapify-accent">Wapify</span> Community
            </h1>
            <p className="text-xl text-wapify-text-secondary max-w-3xl mx-auto mb-8">
              Connect with developers, share your projects, get help, and stay updated with the latest features.
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-gradient-to-br from-wapify-accent/10 to-wapify-accent-dark/10 border-2 border-wapify-accent rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-wapify-accent rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg">
                💬
              </div>
              <h2 className="text-3xl font-black text-wapify-text mb-4">
                Discord Server Coming Soon
              </h2>
              <p className="text-lg text-wapify-text-secondary mb-8 max-w-2xl mx-auto">
                We're building an amazing community space where you can connect with other Wapify users, share your creations, and get support.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-wapify-panel border-2 border-wapify-border rounded-xl text-wapify-text font-semibold">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wapify-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-wapify-accent"></span>
                </span>
                Launching Soon
              </div>
            </div>
          </div>

          {/* What to Expect */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                🚀
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Share Your Projects</h3>
              <p className="text-wapify-text-secondary">
                Showcase what you've built with Wapify and get feedback from the community.
              </p>
            </div>

            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                💡
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Get Help & Support</h3>
              <p className="text-wapify-text-secondary">
                Ask questions, troubleshoot issues, and learn from experienced users.
              </p>
            </div>

            <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
              <div className="w-12 h-12 bg-wapify-accent/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                🎯
              </div>
              <h3 className="text-xl font-bold text-wapify-text mb-3">Stay Updated</h3>
              <p className="text-wapify-text-secondary">
                Be the first to know about new features, updates, and community events.
              </p>
            </div>
          </div>

          {/* Temporary Contact */}
          <div className="max-w-3xl mx-auto text-center bg-wapify-panel/60 border-2 border-wapify-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-wapify-text mb-4">
              Want to Connect Now?
            </h2>
            <p className="text-wapify-text-secondary mb-6">
              While we're setting up the Discord server, feel free to reach out with questions or feedback.
            </p>
            <Link
              href="mailto:support@wapify.com"
              className="inline-block px-8 py-3 bg-wapify-accent text-white rounded-xl font-semibold hover:bg-wapify-accent-dark transition shadow-lg"
            >
              Contact Us
            </Link>
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
