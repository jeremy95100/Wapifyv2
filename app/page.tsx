export default function Home() {
  return (
    <div className="min-h-screen bg-wapify-bg">
      {/* Navigation */}
      <nav className="fixed w-full bg-wapify-panel border-b-2 border-wapify-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-lg flex items-center justify-center text-xl">
              ⚡
            </div>
            <span className="text-2xl font-bold text-wapify-text">Wapify</span>
          </div>
          <button className="px-6 py-2.5 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-lg font-semibold hover:opacity-90 transition shadow-lg">
            Commencer
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-wapify-accent/10 border-2 border-wapify-accent/30 rounded-full">
            <span className="text-wapify-accent font-semibold text-sm">
              🚀 Génération en moins de 60 secondes
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-wapify-text mb-6 leading-tight">
            Transforme ton idée<br />
            en <span className="text-wapify-accent">Web App</span>
          </h1>

          <p className="text-xl md:text-2xl text-wapify-text-secondary mb-12 max-w-3xl mx-auto">
            Décris ce que tu veux, l'IA génère le code. Frontend, backend, base de données et hébergement inclus.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="px-8 py-4 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-xl font-bold text-lg hover:opacity-90 transition shadow-xl">
              Créer mon app gratuitement
            </button>
            <button className="px-8 py-4 border-2 border-wapify-border text-wapify-text rounded-xl font-bold text-lg hover:border-wapify-accent transition">
              Voir la démo →
            </button>
          </div>

          <div className="flex justify-center gap-8 text-sm text-wapify-text-secondary">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Pas de carte bancaire</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>100 crédits gratuits</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-7xl mx-auto mt-32">
          <h2 className="text-4xl font-bold text-center text-wapify-text mb-4">
            Tout ce dont tu as besoin,
          </h2>
          <p className="text-xl text-center text-wapify-accent font-semibold mb-16">
            en un seul endroit
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-wapify-panel p-8 rounded-2xl border-2 border-wapify-border hover:border-wapify-accent transition">
              <div className="w-14 h-14 bg-wapify-accent/20 rounded-xl flex items-center justify-center text-3xl mb-6">
                🧠
              </div>
              <h3 className="text-2xl font-bold text-wapify-text mb-4">
                Génération IA Intelligente
              </h3>
              <p className="text-wapify-text-secondary leading-relaxed">
                Décris ton app en français, notre IA comprend et génère du code React + TypeScript professionnel.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-wapify-panel p-8 rounded-2xl border-2 border-wapify-border hover:border-wapify-accent transition">
              <div className="w-14 h-14 bg-wapify-accent/20 rounded-xl flex items-center justify-center text-3xl mb-6">
                🗄️
              </div>
              <h3 className="text-2xl font-bold text-wapify-text mb-4">
                Base de Données Incluse
              </h3>
              <p className="text-wapify-text-secondary leading-relaxed">
                PostgreSQL configuré automatiquement. Schémas, relations, et APIs générés selon tes besoins.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-wapify-panel p-8 rounded-2xl border-2 border-wapify-border hover:border-wapify-accent transition">
              <div className="w-14 h-14 bg-wapify-accent/20 rounded-xl flex items-center justify-center text-3xl mb-6">
                🚀
              </div>
              <h3 className="text-2xl font-bold text-wapify-text mb-4">
                Hébergement Instantané
              </h3>
              <p className="text-wapify-text-secondary leading-relaxed">
                Ton app est déployée automatiquement avec SSL. Connecte ton domaine en 1 clic.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto mt-32 bg-gradient-to-r from-wapify-accent/10 to-wapify-accent-dark/10 border-2 border-wapify-accent/50 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-wapify-text mb-6">
            Prêt à créer ta première app ?
          </h2>
          <p className="text-xl text-wapify-text-secondary mb-8">
            100 crédits offerts. Pas de carte bancaire. Accès immédiat.
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-xl font-bold text-lg hover:opacity-90 transition shadow-xl">
            Commencer gratuitement
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-wapify-border py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-lg flex items-center justify-center text-xl">
              ⚡
            </div>
            <span className="text-2xl font-bold text-wapify-text">Wapify</span>
          </div>
          <p className="text-wapify-text-secondary text-sm mb-4">
            L'alternative française premium. Crée des apps complètes avec l'IA.
          </p>
          <p className="text-wapify-text-secondary text-sm">
            © 2025 Wapify. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
