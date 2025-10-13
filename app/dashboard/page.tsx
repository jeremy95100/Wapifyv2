'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string
  prompt: string
  status: 'generating' | 'ready' | 'error'
  code: string | null
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchProjects()
    }
  }, [session])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects?userId=${session?.user?.id}`)

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des projets')
      }

      const data = await response.json()
      setProjects(data.projects || [])
    } catch (err) {
      setError('Impossible de charger vos projets')
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      // Rafraîchir la liste
      setProjects(projects.filter(p => p.id !== projectId))
    } catch (err) {
      alert('Erreur lors de la suppression du projet')
      console.error('Error deleting project:', err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-wapify-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-wapify-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-wapify-text-secondary">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-wapify-bg">
      {/* Top Bar */}
      <nav className="bg-wapify-panel border-b-2 border-wapify-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-lg flex items-center justify-center text-xl">
              ⚡
            </div>
            <span className="text-2xl font-bold text-wapify-text">Wapify</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/editor"
              className="px-4 py-2 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              Nouveau projet
            </Link>
            <div className="text-sm text-wapify-text-secondary">
              {session.user?.email}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-wapify-text mb-2">
            Mes Projets
          </h1>
          <p className="text-wapify-text-secondary">
            Retrouvez tous vos projets générés par l'IA
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-wapify-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-wapify-text-secondary">Chargement de vos projets...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-wapify-panel border-2 border-wapify-border rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-wapify-text mb-2">
              Aucun projet pour le moment
            </h3>
            <p className="text-wapify-text-secondary mb-6">
              Créez votre premier projet avec l'IA
            </p>
            <Link
              href="/editor"
              className="inline-block px-6 py-3 bg-gradient-to-r from-wapify-accent to-wapify-accent-dark text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              Créer un projet
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-wapify-panel border-2 border-wapify-border rounded-xl p-6 hover:border-wapify-accent transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-wapify-text mb-1 group-hover:text-wapify-accent transition">
                      {project.name}
                    </h3>
                    <p className="text-sm text-wapify-text-secondary">
                      {formatDate(project.created_at)}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    project.status === 'ready'
                      ? 'bg-green-100 text-green-700'
                      : project.status === 'generating'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {project.status === 'ready' ? '✓ Prêt' : project.status === 'generating' ? '⏳ En cours' : '✗ Erreur'}
                  </div>
                </div>

                <p className="text-wapify-text-secondary text-sm mb-4 line-clamp-2">
                  {project.description || project.prompt}
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/editor?projectId=${project.id}`}
                    className="flex-1 px-4 py-2 bg-wapify-accent text-white rounded-lg font-semibold hover:opacity-90 transition text-center text-sm"
                  >
                    Ouvrir
                  </Link>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 border-2 border-red-200 rounded-lg font-semibold hover:bg-red-100 transition text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
