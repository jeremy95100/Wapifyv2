// Types pour Wapify

export type Framework = 'react' | 'html' | 'vue'
export type StyleType = 'modern' | 'minimal' | 'colorful'
export type TemplateType = 'landing-page' | 'dashboard' | 'portfolio' | 'e-commerce' | 'blog' | 'auth'

export interface GenerateOptions {
  prompt: string
  framework?: Framework
  includeDatabase?: boolean
  style?: StyleType
  useTemplate?: TemplateType
}

export interface GenerateResponse {
  success: boolean
  code?: string
  message?: string
  error?: string
  metadata?: {
    framework: Framework
    style: StyleType
    includeDatabase: boolean
    codeLength: number
    timestamp: string
  }
}

export interface Template {
  name: string
  icon: string
  description?: string
}

export interface TemplatesResponse {
  templates: string[]
  templateDescriptions: Record<string, string>
  frameworks: Framework[]
  styles: StyleType[]
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  prompt: string
  framework: Framework
  style: StyleType
  status: 'generating' | 'ready' | 'error'
  code: string | null
  deployed_url: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string | null
  credits: number
  plan: 'starter' | 'pro' | 'business'
  created_at: string
}