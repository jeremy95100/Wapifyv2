'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ModernMinimalistPreview, GradientVibrantPreview, DarkModePreview, BrutalistPreview, GlassmorphismPreview } from '@/components/StylePreviews'
import { WapifyLogo } from '@/logo'

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
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "from-blue-500/20 to-purple-500/20"
    },
    {
      title: "E-commerce Store",
      description: "Product catalog, shopping cart, and checkout flow",
      prompt: "An e-commerce product page with image gallery, add to cart, product variations, reviews section, and related products",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      title: "Task Manager",
      description: "Kanban board with drag-and-drop and filters",
      prompt: "A task management app with drag and drop kanban board, task details modal, priority labels, and team member assignments",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: "from-orange-500/20 to-red-500/20"
    },
    {
      title: "SaaS Landing Page",
      description: "Modern landing with features, pricing, and testimonials",
      prompt: "A landing page for a SaaS product with hero section, features grid, pricing table, customer testimonials, and FAQ section",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
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
                    className="flex items-center gap-1.5 text-xs font-semibold text-wapify-accent hover:text-wapify-accent-dark transition whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    {designStyles.find(s => s.id === selectedStyle)?.name}
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
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
                <div className="absolute inset-0 bg-gradient-to-br from-wapify-accent/20 to-wapify-accent-dark/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-wapify-border hover:scale-[1.02] transition-transform duration-300">
                  {/* Mock Browser Header */}
                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b-2 border-wapify-border">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
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
                    <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark rounded flex items-center justify-center text-white text-xs font-bold">
                          S
                        </div>
                        <span className="text-sm font-bold text-gray-900">ShopHub</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <div className="h-8 w-8 bg-wapify-accent rounded flex items-center justify-center hover:bg-wapify-accent-dark transition-colors cursor-pointer relative">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">3</div>
                        </div>
                      </div>
                    </div>

                    {/* Category Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      <div className="px-3 py-1 bg-wapify-accent text-white text-xs rounded-full whitespace-nowrap font-medium">All</div>
                      <div className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap hover:bg-gray-200 transition cursor-pointer">Electronics</div>
                      <div className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap hover:bg-gray-200 transition cursor-pointer">Fashion</div>
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border-2 border-gray-100 rounded-lg p-3 space-y-2 hover:shadow-lg hover:border-wapify-accent/30 transition-all duration-300 cursor-pointer">
                        <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                          <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-gray-900 truncate">Wireless Headphones</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-bold text-wapify-accent">$79.99</span>
                            <div className="flex items-center gap-0.5">
                              <svg className="w-2.5 h-2.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-[9px] text-gray-500">4.5</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border-2 border-gray-100 rounded-lg p-3 space-y-2 hover:shadow-lg hover:border-wapify-accent/30 transition-all duration-300 cursor-pointer">
                        <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center relative overflow-hidden">
                          <svg className="w-12 h-12 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-gray-900 truncate">Smart Watch Pro</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-bold text-wapify-accent">$299</span>
                            <div className="flex items-center gap-0.5">
                              <svg className="w-2.5 h-2.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-[9px] text-gray-500">4.8</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border-2 border-gray-100 rounded-lg p-3 space-y-2 hover:shadow-lg hover:border-wapify-accent/30 transition-all duration-300 cursor-pointer">
                        <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded flex items-center justify-center relative overflow-hidden">
                          <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-gray-900 truncate">Camera Lens Kit</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-bold text-wapify-accent">$149</span>
                            <div className="flex items-center gap-0.5">
                              <svg className="w-2.5 h-2.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-[9px] text-gray-500">4.7</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border-2 border-gray-100 rounded-lg p-3 space-y-2 hover:shadow-lg hover:border-wapify-accent/30 transition-all duration-300 cursor-pointer">
                        <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 rounded flex items-center justify-center relative overflow-hidden">
                          <svg className="w-12 h-12 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-gray-900 truncate">Action Camera 4K</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-bold text-wapify-accent">$199</span>
                            <div className="flex items-center gap-0.5">
                              <svg className="w-2.5 h-2.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-[9px] text-gray-500">4.9</span>
                            </div>
                          </div>
                        </div>
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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse"></div>
                <div className="relative bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-800 hover:scale-[1.02] transition-transform duration-300">
                  {/* Mock Browser Header */}
                  <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b-2 border-gray-700">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-xs text-gray-400">
                      dashboard.wapify.app
                    </div>
                  </div>

                  {/* Mock Dashboard Content */}
                  <div className="p-6 space-y-4">
                    {/* Header with Logo and Action Button */}
                    <div className="flex items-center justify-between pb-4 border-b-2 border-gray-800 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                          D
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Dashboard</div>
                          <div className="text-[9px] text-gray-400">Analytics Overview</div>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 bg-cyan-500 text-gray-900 rounded text-xs font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/30">
                        Export
                      </button>
                    </div>

                    {/* Stats Cards with Real Data */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-3 hover:border-cyan-500/60 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-cyan-500/20">
                        <div className="text-[9px] text-gray-400 mb-1 font-medium">Total Revenue</div>
                        <div className="text-lg font-black text-white">$12.4K</div>
                        <div className="text-[8px] text-cyan-400 font-semibold mt-0.5">+18.2%</div>
                      </div>
                      <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-3 hover:border-purple-500/60 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-purple-500/20">
                        <div className="text-[9px] text-gray-400 mb-1 font-medium">Active Users</div>
                        <div className="text-lg font-black text-white">1,247</div>
                        <div className="text-[8px] text-purple-400 font-semibold mt-0.5">+7.8%</div>
                      </div>
                      <div className="bg-gray-800 border border-green-500/30 rounded-lg p-3 hover:border-green-500/60 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-green-500/20">
                        <div className="text-[9px] text-gray-400 mb-1 font-medium">Conversion</div>
                        <div className="text-lg font-black text-white">23.4%</div>
                        <div className="text-[8px] text-green-400 font-semibold mt-0.5">+5.2%</div>
                      </div>
                    </div>

                    {/* Chart Area with Labels */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/30 transition-colors duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-[10px] text-gray-300 font-bold">Weekly Performance</div>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                            <span className="text-[8px] text-gray-400">Sales</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-end justify-between gap-1.5 h-20">
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 cursor-pointer" style={{height: '60%', animationDelay: '0.1s'}}></div>
                          <span className="text-[7px] text-gray-500">Mon</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 cursor-pointer" style={{height: '80%', animationDelay: '0.2s'}}></div>
                          <span className="text-[7px] text-gray-500">Tue</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 cursor-pointer" style={{height: '45%', animationDelay: '0.3s'}}></div>
                          <span className="text-[7px] text-gray-500">Wed</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 cursor-pointer" style={{height: '90%', animationDelay: '0.4s'}}></div>
                          <span className="text-[7px] text-gray-500">Thu</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 cursor-pointer" style={{height: '70%', animationDelay: '0.5s'}}></div>
                          <span className="text-[7px] text-gray-500">Fri</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 cursor-pointer" style={{height: '55%', animationDelay: '0.6s'}}></div>
                          <span className="text-[7px] text-gray-500">Sat</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 cursor-pointer" style={{height: '40%', animationDelay: '0.7s'}}></div>
                          <span className="text-[7px] text-gray-500">Sun</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                  answer: "Yes! Builder and Enterprise plans include full source code export. You own your code and can host it anywhere you want."
                },
                {
                  question: "Is there a free plan?",
                  answer: "Yes! Our Starter plan is completely free and lets you create 1 app with 50 daily credits (up to 150/month). No credit card required to get started."
                },
                {
                  question: "Can I use my own domain?",
                  answer: "Absolutely! Builder and Enterprise plans support custom domains. You can connect your domain in just a few clicks."
                },
                {
                  question: "What kind of support do you offer?",
                  answer: "Starter users get community support via Discord. Builder users get priority email support with 24-hour response time. Enterprise customers get dedicated support with SLA."
                },
                {
                  question: "Can I collaborate with my team?",
                  answer: "Yes! Builder plans support team collaboration with shared projects and role-based permissions. Enterprise plans offer advanced team features."
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
              <div className="mb-4">
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
