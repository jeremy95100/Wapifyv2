# Infrastructure et Services - Wapify

Ce document liste tous les services nécessaires pour l'infrastructure Wapify avec l'architecture Vite (comme Lovable).

---

## 🎯 SERVICES CRÉÉS

### ✅ Vercel
**Rôle:** Hosting frontend + Blob Storage + CDN
- **URL:** https://vercel.com
- **Usage:**
  - Héberge l'application Next.js (frontend Wapify)
  - Vercel Blob Storage pour stocker les builds compilés
  - CDN automatique pour servir les apps rapidement
  - API Routes pour les endpoints backend
- **Plan:** Hobby (gratuit) puis Pro ($20/mois) selon usage
- **Configuration:**
  - Connecter le repo GitHub
  - Configurer les variables d'environnement
  - Activer Vercel Blob Storage dans l'onglet "Storage"

---

### ✅ Railway
**Rôle:** Serveur de build + Redis Queue
- **URL:** https://railway.app
- **Usage:**
  - Serveur Node.js qui exécute `npm install` + `vite build`
  - Compile le code React généré par l'AI
  - Gère la queue de builds (plusieurs utilisateurs en parallèle)
  - Redis intégré pour la gestion de la queue (BullMQ)
- **Plan:** $5/mois pour commencer (8GB RAM, 8 vCPU partagés)
- **Configuration:**
  - Connecter le compte GitHub
  - Déployer le serveur de build (on le créera ensemble)
  - Configurer les variables d'environnement (API keys, etc.)

---

## 📦 SERVICES DÉJÀ EN PLACE (normalement)

### ✅ Anthropic (Claude AI)
**Rôle:** Intelligence artificielle pour générer le code
- **URL:** https://console.anthropic.com
- **Usage:**
  - API Claude Sonnet 4 pour générer le code React complet
  - Analyse des prompts utilisateurs
  - Génération de fichiers multiples (composants, hooks, styles)
- **Coût:** $3/1M tokens input, $15/1M tokens output
- **Configuration:**
  - Variable d'environnement: `ANTHROPIC_API_KEY=sk-ant-...`

---

### ✅ Supabase
**Rôle:** Auth + Storage pour Wapify (pas pour les apps générées)
- **URL:** https://supabase.com
- **Usage:**
  - Authentification des utilisateurs Wapify (login/signup)
  - Stockage des fichiers uploadés par les users (images, assets)
  - Base de données pour stocker les projets, historique, etc.
- **Plan:** Gratuit jusqu'à 500MB, puis $25/mois
- **Configuration:**
  - Variables: `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### ✅ Neon PostgreSQL
**Rôle:** Bases de données pour les apps générées
- **URL:** https://neon.tech
- **Usage:**
  - Crée une base de données PostgreSQL par app générée
  - Permet aux apps e-commerce, SaaS, CRM d'avoir leur propre DB
  - Serverless, scaling automatique
- **Plan:** Gratuit jusqu'à 10 projets, puis $19/mois
- **Configuration:**
  - Connection string dans `lib/neon.ts`
  - API key pour créer des databases dynamiquement

---

## 🔄 SERVICES OPTIONNELS (à créer plus tard)

### 🟡 Upstash Redis (Optionnel - Alternative à Railway Redis)
**Rôle:** Queue system avancé + Cache
- **URL:** https://upstash.com
- **Usage:**
  - Gestion de la queue de builds (alternative au Redis Railway)
  - Plus scalable que Railway Redis
  - Serverless Redis (pas de serveur à gérer)
  - Cache pour optimiser les performances
- **Quand créer:** Quand tu dépasses 100 utilisateurs actifs et que Railway Redis devient limitant
- **Plan:** Gratuit jusqu'à 10,000 commandes/jour
- **Avantages vs Railway Redis:**
  - Meilleure scalabilité
  - Latence plus faible
  - Dashboard de monitoring avancé
  - Pas de limite de mémoire

**⚠️ Pour l'instant, utilise le Redis inclus dans Railway. Passe sur Upstash quand:**
- Tu as 100+ utilisateurs actifs
- La queue devient lente
- Tu veux un monitoring avancé

---

### 🟢 Better Stack (ex-Logtail) (Nice to have)
**Rôle:** Monitoring + Logs + Alertes
- **URL:** https://betterstack.com
- **Usage:**
  - Centralise tous les logs (Railway, Vercel, erreurs builds)
  - Alertes en temps réel si un build échoue
  - Dashboard pour surveiller les performances
  - Debugging facilité avec recherche dans les logs
- **Quand créer:** Quand tu as des utilisateurs payants et que tu veux un monitoring pro
- **Plan:** Gratuit jusqu'à 1GB logs/mois
- **Avantages:**
  - Voir tous les logs au même endroit
  - Alertes Slack/Email si problèmes
  - Graphs de performances
  - Retention des logs 30 jours

**⚠️ Pour l'instant, utilise les logs Railway/Vercel natifs. Passe sur Better Stack quand:**
- Tu as 50+ utilisateurs actifs
- Tu veux des alertes automatiques
- Tu as besoin de débugger rapidement les erreurs

---

## 💰 COÛTS MENSUELS ESTIMÉS

### Phase 1: MVP/Lancement (0-100 users)
```
Anthropic (AI)          → 20-50€   (usage variable)
Supabase                → 0€       (plan gratuit)
Neon                    → 0€       (plan gratuit)
Vercel                  → 0-20€    (Hobby gratuit puis Pro)
Railway                 → 5-20€    (selon usage)
─────────────────────────────────
TOTAL:                    25-90€/mois
```

### Phase 2: Croissance (100-500 users)
```
Anthropic (AI)          → 100-200€
Supabase                → 25€
Neon                    → 19€
Vercel                  → 20€
Railway                 → 50-100€
Upstash Redis (opt.)    → 0-10€
Better Stack (opt.)     → 0-20€
─────────────────────────────────
TOTAL:                    214-394€/mois
```

### Phase 3: Scale (500-2000 users)
```
Anthropic (AI)          → 400-800€
Supabase                → 25-50€
Neon                    → 50-100€
Vercel                  → 50-100€
Railway                 → 200-400€
Upstash Redis           → 20-50€
Better Stack            → 20-50€
─────────────────────────────────
TOTAL:                    765-1,550€/mois
```

---

## 🏗️ ARCHITECTURE COMPLÈTE

```
┌─────────────┐
│   USER      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  VERCEL (Frontend Next.js)          │
│  - Interface utilisateur            │
│  - Chat avec AI                     │
│  - API Routes                       │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  ANTHROPIC API                      │
│  - Claude Sonnet 4                  │
│  - Génère le code React complet     │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  RAILWAY (Build Server)             │
│  - Reçoit le code généré            │
│  - npm install (toutes dépendances) │
│  - vite build (compilation)         │
│  - Upload vers Vercel Blob          │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  REDIS (Queue - Railway ou Upstash) │
│  - Gère la queue de builds          │
│  - Max 5 builds en parallèle        │
│  - Évite surcharge serveur          │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  VERCEL BLOB STORAGE                │
│  - Stocke les builds compilés       │
│  - CDN automatique                  │
│  - Serve les apps rapidement        │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  USER PREVIEW                       │
│  - Iframe avec build compilé        │
│  - Toutes dépendances fonctionnent  │
│  - recharts, date-fns, etc.         │
└─────────────────────────────────────┘

Parallèle:
┌─────────────────────────────────────┐
│  SUPABASE                           │
│  - Auth utilisateurs Wapify         │
│  - Stockage projets                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  NEON POSTGRESQL                    │
│  - Databases pour apps générées     │
│  - 1 DB par projet client           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  BETTER STACK (Optionnel)           │
│  - Logs centralisés                 │
│  - Monitoring + Alertes             │
└─────────────────────────────────────┘
```

---

## 📝 CHECKLIST DE SETUP

### Maintenant (Obligatoire):
- [x] Créer compte Vercel
- [x] Créer compte Railway
- [ ] Vérifier API key Anthropic
- [ ] Vérifier projet Supabase
- [ ] Vérifier compte Neon

### Plus tard (Quand nécessaire):
- [ ] Créer compte Upstash Redis (>100 users)
- [ ] Créer compte Better Stack (>50 users payants)

---

## 🚀 PROCHAINES ÉTAPES

1. **Vérifier les services existants** (Anthropic, Supabase, Neon)
2. **Configurer Railway** (créer le serveur de build)
3. **Configurer Vercel Blob** (activer le storage)
4. **Coder le build server** (Node.js + Express + BullMQ)
5. **Intégrer dans le frontend** (remplacer Sandpack par iframe)
6. **Tester avec vraies apps** (e-commerce, dashboard, etc.)

---

## 📚 RESSOURCES UTILES

- **Railway Docs:** https://docs.railway.app
- **Vercel Blob Docs:** https://vercel.com/docs/storage/vercel-blob
- **BullMQ Docs:** https://docs.bullmq.io
- **Anthropic API:** https://docs.anthropic.com
- **Neon Docs:** https://neon.tech/docs

---

**Dernière mise à jour:** 2025-10-18
