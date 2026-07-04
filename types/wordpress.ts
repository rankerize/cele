export interface WPCategory {
  id: number
  name: string
  slug: string
  description: string
  count: number
}

export interface WPPost {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  slug: string
  status: string
  link: string
  categories: number[]
  date?: string
  modified?: string
  meta?: Record<string, any>
}

export interface WPUpdatePostPayload {
  title?: string
  content?: string
  slug?: string
  excerpt?: string
  status?: 'draft' | 'publish' | 'pending'
  categories?: number[]
  meta?: Record<string, any>
}

export interface WPCreatePostPayload {
  title: string
  content: string
  slug: string
  excerpt?: string
  status: 'draft' | 'publish' | 'pending'
  categories: number[]
  meta?: Record<string, string>
}

export interface WPCreateCategoryPayload {
  name: string
  slug?: string
  description?: string
}
