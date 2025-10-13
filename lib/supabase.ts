import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client admin pour les opérations côté serveur nécessitant des permissions élevées
// ATTENTION : N'utiliser que côté serveur (API routes, server components)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Types
export interface User {
  id: string
  email: string
  name: string | null
  credits: number
  plan: 'starter' | 'pro' | 'business'
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  prompt: string
  status: 'generating' | 'ready' | 'error'
  code: string | null
  deployed_url: string | null
  created_at: string
  updated_at: string
}

// Helper functions
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error) return null
  return data
}

export async function createProject(
  userId: string, 
  name: string, 
  prompt: string
): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .insert([{
      user_id: userId,
      name,
      prompt,
      description: prompt.substring(0, 200),
      status: 'generating'
    }])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating project:', error)
    return null
  }
  return data
}

export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }
  return data || []
}
