'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ModernMinimalistPreview, GradientVibrantPreview, DarkModePreview, BrutalistPreview, GlassmorphismPreview } from '@/components/StylePreviews'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [isInputSticky, setIsInputSticky] = useState(false)
  const [typingText, setTypingText] = useState('')
  const [typingIndex, setTypingIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loopNum, setLoopNum] = useState(0)
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [currentIdeas, setCurrentIdeas] = useState<Array<{title: string, prompt: string}>>([])
  const router = useRouter()

  const typingPhrases = [
    "A modern e-commerce store with shopping cart...",
    "Une boutique en ligne moderne avec panier d'achat...",
    "Ein moderner E-Commerce-Shop mit Warenkorb...",
    "一个现代电子商务商店与购物车...",
    "متجر إلكتروني حديث مع عربة تسوق...",
    "An analytics dashboard with real-time charts...",
    "Un tableau de bord analytique avec graphiques en temps réel...",
    "Ein Analyse-Dashboard mit Echtzeit-Diagrammen...",
    "一个实时图表分析仪表板...",
    "لوحة تحليلات مع رسوم بيانية فورية...",
    "A task management app with kanban board...",
    "Une application de gestion de tâches avec tableau kanban...",
    "Eine Aufgabenverwaltungs-App mit Kanban-Board...",
    "一个带看板的任务管理应用...",
    "تطبيق إدارة مهام مع لوحة كانبان..."
  ]

  const allIdeas = [
    {
      title: "Task Manager",
      prompt: "A task management app with drag-and-drop kanban board, priority labels, due dates, task assignments, and progress tracking"
    },
    {
      title: "Recipe Platform",
      prompt: "A recipe sharing platform with ingredient lists, step-by-step cooking instructions, user ratings, reviews, and save favorites"
    },
    {
      title: "Fitness Tracker",
      prompt: "A fitness tracking app with workout logs, exercise library, progress charts, goal setting, and calendar view"
    },
    {
      title: "Event Planner",
      prompt: "An event planning tool with calendar integration, guest lists, RSVP management, budget tracking, and task checklists"
    },
    {
      title: "Budget Tracker",
      prompt: "A personal budget tracker with expense categories, income tracking, monthly reports, savings goals, and spending analytics"
    },
    {
      title: "Blog Platform",
      prompt: "A blog platform with rich text editor, markdown support, comments system, categories, tags, and social media sharing"
    },
    {
      title: "Portfolio Site",
      prompt: "A portfolio website with project showcase, image gallery, skills section, about page, and contact form"
    },
    {
      title: "Job Board",
      prompt: "A job board with advanced filters by location and salary, application tracking, company profiles, and saved searches"
    },
    {
      title: "E-commerce Store",
      prompt: "An e-commerce store with product catalog, shopping cart, checkout flow, payment integration, and order tracking"
    },
    {
      title: "Booking System",
      prompt: "A booking system with calendar availability, time slot selection, appointment reminders, customer profiles, and booking history"
    },
    {
      title: "Social Dashboard",
      prompt: "A social media dashboard with post scheduling, analytics charts, engagement metrics, and multi-platform support"
    },
    {
      title: "Quiz App",
      prompt: "A quiz app with multiple choice questions, timer, score tracking, leaderboard, and quiz categories"
    },
    {
      title: "Weather App",
      prompt: "A weather app with 7-day forecast, hourly predictions, location search, weather alerts, and interactive maps"
    },
    {
      title: "Music Player",
      prompt: "A music player with playlist management, audio controls, song search, favorites, and album artwork display"
    },
    {
      title: "Note-Taking App",
      prompt: "A note-taking app with folders, tags, rich text formatting, code syntax highlighting, and full-text search"
    },
    {
      title: "Chat Application",
      prompt: "A real-time chat application with group channels, direct messages, file sharing, emoji reactions, and online status"
    },
    {
      title: "Survey Builder",
      prompt: "A survey builder with custom questions, multiple choice options, conditional logic, response analytics, and export data"
    },
    {
      title: "Real Estate Site",
      prompt: "A real estate listing site with property search, advanced filters, photo galleries, virtual tours, and agent profiles"
    },
    {
      title: "Restaurant Menu",
      prompt: "A restaurant menu with dish photos, descriptions, dietary filters (vegan, gluten-free), online ordering, and cart system"
    },
    {
      title: "Gym Management",
      prompt: "A gym management system with member profiles, class schedules, attendance tracking, payment history, and trainer assignments"
    }
  ]

  const generateRandomIdeas = () => {
    const shuffled = [...allIdeas].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 5)
  }

  useEffect(() => {
    setCurrentIdeas(generateRandomIdeas())
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsInputSticky(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (prompt) return // Don't animate if user is typing

    const currentPhrase = typingPhrases[loopNum % typingPhrases.length]
    const typingSpeed = isDeleting ? 30 : 80
    const pauseTime = isDeleting ? 500 : 2000

    const timer = setTimeout(() => {
      if (!isDeleting && typingIndex < currentPhrase.length) {
        setTypingText(currentPhrase.substring(0, typingIndex + 1))
        setTypingIndex(typingIndex + 1)
      } else if (isDeleting && typingIndex > 0) {
        setTypingText(currentPhrase.substring(0, typingIndex - 1))
        setTypingIndex(typingIndex - 1)
      } else if (!isDeleting && typingIndex === currentPhrase.length) {
        setTimeout(() => setIsDeleting(true), pauseTime)
      } else if (isDeleting && typingIndex === 0) {
        setIsDeleting(false)
        setLoopNum(loopNum + 1)
      }
    }, typingSpeed)

    return () => clearTimeout(timer)
  }, [typingIndex, isDeleting, loopNum, prompt])

  const handleGenerate = () => {
    if (prompt.trim()) {
      // Build URL with prompt and optional style
      const url = new URL('/editor', window.location.origin)
      url.searchParams.set('prompt', prompt)
      if (selectedStyle) {
        url.searchParams.set('style', selectedStyle)
      }
      router.push(url.pathname + url.search)
    }
  }

  const designStyles = [
    {
      id: "modern",
      name: "Modern Minimalist",
      description: "A clean, sophisticated design system focused on clarity and usability.",
      features: [
        "Generous whitespace and breathing room",
        "Sans-serif typography with clear hierarchy",
        "Subtle animations and micro-interactions",
        "Neutral color palette with accent colors",
        "Perfect for SaaS, portfolios, and corporate sites"
      ],
      previewComponent: ModernMinimalistPreview,
      color: "from-blue-500/10 to-cyan-500/10",
      styleInstructions: "Use a modern minimalist design with generous whitespace, clean sans-serif typography, subtle animations, and a neutral color palette with accent colors."
    },
    {
      id: "gradient",
      name: "Gradient & Vibrant",
      description: "Bold, energetic design with stunning color transitions and dynamic elements.",
      features: [
        "Smooth gradient backgrounds and overlays",
        "Bright, eye-catching color combinations",
        "Animated elements and hover effects",
        "Modern glassmorphism and blur effects",
        "Ideal for creative agencies and startups"
      ],
      previewComponent: GradientVibrantPreview,
      color: "from-purple-500/10 to-pink-500/10",
      styleInstructions: "Use bold gradient backgrounds with vibrant colors, smooth color transitions, animated elements with hover effects, and modern glassmorphism with blur effects."
    },
    {
      id: "dark",
      name: "Dark Mode Premium",
      description: "Sleek dark interface with neon accents perfect for modern tech products.",
      features: [
        "Dark backgrounds with strategic highlights",
        "Neon accent colors for CTAs and focus",
        "High contrast for excellent readability",
        "Reduced eye strain for long sessions",
        "Great for dashboards, dev tools, and gaming"
      ],
      previewComponent: DarkModePreview,
      color: "from-gray-800/10 to-slate-900/10",
      styleInstructions: "Use a dark mode design with dark backgrounds, neon accent colors for CTAs, high contrast for readability, and strategic highlights."
    },
    {
      id: "brutalist",
      name: "Brutalist Bold",
      description: "Raw, unapologetic design that makes a strong statement with maximum impact.",
      features: [
        "Heavy black borders and geometric shapes",
        "Bold typography with strong hierarchy",
        "High contrast black and white base",
        "Intentionally rough and direct aesthetic",
        "Perfect for portfolios and bold brands"
      ],
      previewComponent: BrutalistPreview,
      color: "from-yellow-500/10 to-orange-500/10",
      styleInstructions: "Use a brutalist design with heavy black borders, bold geometric shapes, strong typography hierarchy, and high contrast black and white colors."
    },
    {
      id: "glassmorphism",
      name: "Glassmorphism",
      description: "Elegant frosted glass effects with translucent layers and soft shadows.",
      features: [
        "Frosted glass blur effects on cards",
        "Soft drop shadows and depth layers",
        "Translucent backgrounds with vibrant colors",
        "Modern, clean, and sophisticated look",
        "Excellent for premium and luxury brands"
      ],
      previewComponent: GlassmorphismPreview,
      color: "from-teal-500/10 to-emerald-500/10",
      styleInstructions: "Use glassmorphism design with frosted glass blur effects on cards, soft drop shadows, translucent backgrounds with vibrant colors, and depth layers."
    }
  ]

  const examples = [
    {
      title: "Analytics Dashboard",
      description: "Real-time charts, KPI cards, and data tables with filtering",
      prompt: "A modern analytics dashboard with real-time charts showing revenue trends, KPI cards for key metrics, and a data table with search and filters",
      icon: "📊",
      color: "from-blue-500/20 to-purple-500/20"
    },
    {
      title: "E-commerce Store",
      description: "Product catalog, shopping cart, and checkout flow",
      prompt: "An e-commerce product page with image gallery, add to cart, product variations, reviews section, and related products",
      icon: "🛍️",
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      title: "Task Manager",
      description: "Kanban board with drag-and-drop and filters",
      prompt: "A task management app with drag and drop kanban board, task details modal, priority labels, and team member assignments",
      icon: "✅",
      color: "from-orange-500/20 to-red-500/20"
    },
    {
      title: "SaaS Landing Page",
      description: "Modern landing with features, pricing, and testimonials",
      prompt: "A landing page for a SaaS product with hero section, features grid, pricing table, customer testimonials, and FAQ section",
      icon: "🚀",
      color: "from-purple-500/20 to-pink-500/20"
    }
  ]

  return (
    <div className="min-h-screen bg-wapify-bg relative">
      {/* Grain texture overlay */}
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

      {/* Sticky Input Bar */}
      {isInputSticky && (
        <div className="fixed top-20 left-0 right-0 z-40 px-6 py-4 bg-wapify-panel/95 backdrop-blur-md border-b border-wapify-border animate-fadeIn">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="flex-1 flex items-center gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What are you building?"
                className="flex-1 min-h-[50px] bg-wapify-bg border border-wapify-border rounded-xl px-4 py-3 outline-none text-wapify-text placeholder-wapify-text-secondary/50 resize-none text-sm focus:border-wapify-accent transition"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleGenerate()
                  }
                }}
              />
              {selectedStyle && (
                <div className="flex items-center gap-1 px-3 py-2 bg-wapify-accent/10 border border-wapify-accent/30 rounded-lg">
                  <button
                    onClick={() => setIsStyleModalOpen(true)}
                    className="text-xs font-semibold text-wapify-accent hover:text-wapify-accent-dark transition whitespace-nowrap"
                  >
                    ✨ {designStyles.find(s => s.id === selectedStyle)?.name}
                  </button>
                  <button
                    onClick={() => setSelectedStyle('')}
                    className="text-wapify-accent/60 hover:text-wapify-accent transition ml-1"
                    title="Remove style"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="px-6 py-3 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
            >
              Build →
            </button>
          </div>
        </div>
      )}

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-8 pt-32">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-wapify-text mb-6 leading-[1.1] tracking-tight animate-fadeIn">
                Build Apps in <span className="text-wapify-accent">Minutes</span>
                <br />
                <span className="text-wapify-text">, Not Months</span>
              </h1>

              <p className="text-lg md:text-xl text-wapify-text-secondary mb-10 max-w-3xl mx-auto leading-relaxed animate-fadeIn">
                Describe your idea in any language. AI builds a complete, production-ready web app with database and hosting included.
              </p>
            </div>

            {/* Input Card with Typing Effect */}
            <div className="bg-wapify-panel/60 backdrop-blur-sm border-2 border-wapify-border rounded-2xl p-8 shadow-2xl mb-6 hover:border-wapify-accent/30 transition-all duration-300 animate-fadeIn relative">
              <div className="mb-4 relative">
                {!prompt && (
                  <div className="absolute top-4 left-4 text-lg text-wapify-text-secondary/40 pointer-events-none font-mono">
                    {typingText}<span className="animate-pulse">|</span>
                  </div>
                )}
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder=""
                  className="w-full min-h-[140px] bg-wapify-bg/50 border border-wapify-border rounded-xl p-4 outline-none text-wapify-text resize-none text-lg focus:border-wapify-accent transition relative z-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleGenerate()
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsStyleModalOpen(true)}
                    className="flex items-center gap-2 text-sm text-wapify-accent hover:text-wapify-accent-dark transition font-semibold"
                  >
                    <span>✨</span>
                    <span>Choose your style</span>
                  </button>
                  {selectedStyle && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-wapify-accent/10 border border-wapify-accent/30 rounded-lg">
                      <span className="text-xs font-semibold text-wapify-accent">
                        {designStyles.find(s => s.id === selectedStyle)?.name}
                      </span>
                      <button
                        onClick={() => setSelectedStyle('')}
                        className="text-wapify-accent/60 hover:text-wapify-accent transition ml-1"
                        title="Remove style"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span>Start Building</span>
                </button>
              </div>
            </div>

            {/* Ideas to get started */}
            <div className="mt-8 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-wapify-text-secondary">Ideas to get started</p>
                <button
                  onClick={() => setCurrentIdeas(generateRandomIdeas())}
                  className="text-xs text-wapify-accent hover:text-wapify-accent-dark transition font-semibold flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                  </svg>
                  <span>More ideas</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentIdeas.map((idea, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(idea.prompt)}
                    className="px-4 py-2 bg-wapify-panel border border-wapify-border rounded-lg text-sm text-wapify-text-secondary hover:text-wapify-text hover:border-wapify-accent/50 transition text-left"
                  >
                    {idea.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-wapify-text mb-4">
                How It Works
              </h2>
              <p className="text-xl text-wapify-text-secondary">
                From idea to deployed app in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-2xl flex items-center justify-center mb-6 text-white font-black text-3xl">
                    1
                  </div>
                  <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-wapify-accent/50 to-transparent hidden md:block" style={{transform: 'translateX(50%)'}}></div>
                  <h3 className="text-2xl font-bold text-wapify-text mb-3">
                    Describe Your App
                  </h3>
                  <p className="text-wapify-text-secondary leading-relaxed">
                    Tell us what you want to build in any language. No technical knowledge needed.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-2xl flex items-center justify-center mb-6 text-white font-black text-3xl">
                    2
                  </div>
                  <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-wapify-accent/50 to-transparent hidden md:block" style={{transform: 'translateX(50%)'}}></div>
                  <h3 className="text-2xl font-bold text-wapify-text mb-3">
                    AI Generates Code
                  </h3>
                  <p className="text-wapify-text-secondary leading-relaxed">
                    Our AI creates production-ready code, sets up your database, and configures everything.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-2xl flex items-center justify-center mb-6 text-white font-black text-3xl">
                    3
                  </div>
                  <h3 className="text-2xl font-bold text-wapify-text mb-3">
                    Deploy Instantly
                  </h3>
                  <p className="text-wapify-text-secondary leading-relaxed">
                    Your app goes live immediately with hosting, SSL, and a custom domain ready to connect.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section 1: Build Anything */}
        <section className="py-24 px-6 bg-wapify-panel/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Template Preview */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-wapify-accent/20 to-wapify-accent-dark/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-wapify-border">
                  {/* Mock Browser Header */}
                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b-2 border-wapify-border">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-400">
                      yourapp.wapify.app
                    </div>
                  </div>

                  {/* Mock App Content - E-commerce */}
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
                      <div className="h-8 w-32 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark rounded"></div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-2 bg-gray-100 rounded w-1/3"></div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                        <div className="h-2 bg-gray-100 rounded w-2/5"></div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                        <div className="h-2 bg-gray-100 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Text Content */}
              <div>
                <h3 className="text-4xl md:text-5xl font-black text-wapify-text mb-6">
                  Build <span className="text-wapify-accent">Anything</span> You Can Imagine
                </h3>
                <p className="text-xl text-wapify-text-secondary mb-8 leading-relaxed">
                  From simple landing pages to complex SaaS platforms. E-commerce stores, dashboards, portfolios, booking systems - if you can describe it, we can build it.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    "Full-stack web applications with database",
                    "Beautiful, responsive UI components",
                    "Real-time features and interactions",
                    "Authentication and user management",
                    "Payment integration ready"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-wapify-text-secondary">
                      <span className="text-wapify-accent text-xl">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-6 py-3 bg-wapify-accent text-white rounded-xl font-semibold hover:bg-wapify-accent-dark transition shadow-lg"
                >
                  Start Building
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section 2: Beautiful Design */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Text Content */}
              <div>
                <h3 className="text-4xl md:text-5xl font-black text-wapify-text mb-6">
                  <span className="text-wapify-accent">Choose Your Style</span> or Describe Your Own
                </h3>
                <p className="text-xl text-wapify-text-secondary mb-8 leading-relaxed">
                  Pick from our curated design styles, or simply describe the look you want. Our AI understands design language and creates exactly what you envision.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    "5+ professional pre-built design styles",
                    "Or describe your own custom design",
                    "AI understands design preferences",
                    "Responsive on all screen sizes",
                    "Modern animations & interactions"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-wapify-text-secondary">
                      <span className="text-wapify-accent text-xl">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-6 py-3 bg-wapify-accent text-white rounded-xl font-semibold hover:bg-wapify-accent-dark transition shadow-lg"
                >
                  Start Building
                </button>
              </div>

              {/* Right: Template Preview - Dashboard */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all"></div>
                <div className="relative bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-800">
                  {/* Mock Browser Header */}
                  <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b-2 border-gray-700">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-xs text-gray-400">
                      dashboard.wapify.app
                    </div>
                  </div>

                  {/* Mock Dashboard Content */}
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-24 bg-white rounded"></div>
                      <div className="h-8 w-20 bg-cyan-500 rounded"></div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-3">
                        <div className="h-2 bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-cyan-500/20 rounded w-3/4"></div>
                      </div>
                      <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-3">
                        <div className="h-2 bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-purple-500/20 rounded w-2/3"></div>
                      </div>
                      <div className="bg-gray-800 border border-green-500/30 rounded-lg p-3">
                        <div className="h-2 bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-green-500/20 rounded w-4/5"></div>
                      </div>
                    </div>

                    {/* Chart Area */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="h-3 bg-gray-700 rounded w-1/3 mb-3"></div>
                      <div className="flex items-end gap-2 h-24">
                        <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t" style={{height: '60%'}}></div>
                        <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t" style={{height: '80%'}}></div>
                        <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t" style={{height: '45%'}}></div>
                        <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t" style={{height: '90%'}}></div>
                        <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t" style={{height: '70%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-6 bg-wapify-panel/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-wapify-text mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-wapify-text-secondary">
                Start free, upgrade when you're ready
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="bg-wapify-panel border-2 border-wapify-border rounded-2xl p-8 hover:border-wapify-accent/50 transition-all">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-wapify-text mb-2">Free</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-black text-wapify-text">$0</span>
                    <span className="text-wapify-text-secondary">/month</span>
                  </div>
                  <p className="text-wapify-text-secondary">Perfect to get started and experiment</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "3 projects",
                    "Basic AI generation",
                    "Community support",
                    "Public projects only",
                    "Wapify branding"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-wapify-text-secondary">
                      <span className="text-wapify-accent text-lg">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full px-6 py-3 bg-wapify-bg border-2 border-wapify-border text-wapify-text rounded-xl font-semibold hover:bg-wapify-border transition"
                >
                  Get Started Free
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-br from-wapify-accent/5 to-wapify-accent-dark/5 border-2 border-wapify-accent rounded-2xl p-8 relative shadow-xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-wapify-accent text-white rounded-full text-sm font-bold">
                  Most Popular
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-wapify-text mb-2">Pro</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-black text-wapify-text">$29</span>
                    <span className="text-wapify-text-secondary">/month</span>
                  </div>
                  <p className="text-wapify-text-secondary">For serious builders and small teams</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "Unlimited projects",
                    "Advanced AI generation",
                    "Priority support",
                    "Private projects",
                    "Custom domains",
                    "Remove Wapify branding",
                    "Advanced analytics",
                    "Export source code"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-wapify-text-secondary">
                      <span className="text-wapify-accent text-lg">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all"
                >
                  Start Pro Trial
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-wapify-text-secondary mt-12">
              Need more? <Link href="/enterprise" className="text-wapify-accent hover:underline font-semibold">Contact us for Enterprise pricing</Link>
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-wapify-text mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-wapify-text-secondary">
                Everything you need to know about Wapify
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  question: "Do I need coding experience to use Wapify?",
                  answer: "Not at all! Wapify is designed for everyone. Just describe what you want to build in plain language, and our AI handles all the technical details. No coding knowledge required."
                },
                {
                  question: "What kind of apps can I build?",
                  answer: "You can build almost anything: e-commerce stores, dashboards, portfolios, booking systems, SaaS platforms, landing pages, and more. If you can describe it, we can build it."
                },
                {
                  question: "Can I export the source code?",
                  answer: "Yes! Pro and Enterprise plans include full source code export. You own your code and can host it anywhere you want."
                },
                {
                  question: "What technologies does Wapify use?",
                  answer: "We generate modern web apps using React, Next.js, Tailwind CSS, and PostgreSQL. Your apps are built with production-ready, industry-standard technologies."
                },
                {
                  question: "Is there a free trial?",
                  answer: "Yes! Our Free plan lets you create up to 3 projects with no credit card required. Pro plan includes a 14-day free trial."
                },
                {
                  question: "Can I use my own domain?",
                  answer: "Absolutely! Pro and Enterprise plans support custom domains. You can connect your domain in just a few clicks."
                },
                {
                  question: "What kind of support do you offer?",
                  answer: "Free users get community support via Discord. Pro users get priority email support with 24-hour response time. Enterprise customers get dedicated support with SLA."
                },
                {
                  question: "Can I collaborate with my team?",
                  answer: "Yes! Pro plans support team collaboration with shared projects and role-based permissions. Enterprise plans offer advanced team features."
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
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-wapify-border py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-6 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-xl flex items-center justify-center text-xl shadow-lg">
                  ⚡
                </div>
                <span className="text-2xl font-bold text-wapify-text">Wapify</span>
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

      {/* Style Selector Modal */}
      {isStyleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsStyleModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-wapify-panel border-2 border-wapify-border rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-wapify-panel border-b border-wapify-border px-8 py-6 flex justify-between items-center z-10">
              <div>
                <h2 className="text-3xl font-black text-wapify-text mb-2">Choose Your Style</h2>
                <p className="text-sm text-wapify-text-secondary">Select a design style for your app</p>
              </div>
              <button
                onClick={() => setIsStyleModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-wapify-bg hover:bg-wapify-border transition flex items-center justify-center text-wapify-text-secondary hover:text-wapify-text"
              >
                ✕
              </button>
            </div>

            {/* Styles Grid */}
            <div className="p-8 space-y-6">
              {designStyles.map((style) => (
                <div
                  key={style.id}
                  className={`border-2 rounded-2xl overflow-hidden transition-all ${
                    selectedStyle === style.id
                      ? 'border-wapify-accent shadow-xl'
                      : 'border-wapify-border hover:border-wapify-accent/50'
                  }`}
                >
                  <div className="grid md:grid-cols-2 gap-8 p-8">
                    {/* Left: Description */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-wapify-text mb-3">
                          {style.name}
                        </h3>
                        <p className="text-wapify-text-secondary leading-relaxed mb-6">
                          {style.description}
                        </p>
                        <ul className="space-y-2 mb-8">
                          {style.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-wapify-text-secondary">
                              <span className="text-wapify-accent mt-1">•</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedStyle(style.id)
                          setIsStyleModalOpen(false)
                        }}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                          selectedStyle === style.id
                            ? 'bg-wapify-accent text-white'
                            : 'bg-wapify-bg text-wapify-text hover:bg-wapify-accent hover:text-white'
                        }`}
                      >
                        {selectedStyle === style.id ? '✓ Selected' : 'Choose this style'}
                      </button>
                    </div>

                    {/* Right: Preview */}
                    <div className="relative rounded-xl overflow-hidden border-2 border-wapify-border min-h-[400px]">
                      <style.previewComponent />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-wapify-panel border-t border-wapify-border px-8 py-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-wapify-text-secondary">
                  {selectedStyle ? `Selected: ${designStyles.find(s => s.id === selectedStyle)?.name}` : 'No style selected (default will be used)'}
                </p>
                <button
                  onClick={() => setIsStyleModalOpen(false)}
                  className="px-6 py-3 bg-wapify-bg hover:bg-wapify-border text-wapify-text rounded-xl font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
