import {
  WPCategory,
  WPPost,
  WPCreatePostPayload,
  WPCreateCategoryPayload,
  WPUpdatePostPayload,
} from '@/types/wordpress'


import fs from 'fs'
import path from 'path'

const LOCAL_SETTINGS_FILE = path.join(process.cwd(), '.local-settings.json')

function readLocalWPConfig(userId?: string): { apiUrl?: string; username?: string; appPassword?: string } {
  try {
    if (!userId || !fs.existsSync(LOCAL_SETTINGS_FILE)) return {}
    const data = JSON.parse(fs.readFileSync(LOCAL_SETTINGS_FILE, 'utf-8'))
    return data?.[userId]?.wordpress ?? {}
  } catch { return {} }
}

async function getWPConfig(userId?: string) {
  let apiUrl: string | undefined
  let username: string | undefined
  let appPassword: string | undefined

  // 1. Try Firestore per-user config first
  if (userId) {
    try {
      const { getAdminFirestore } = await import('@/lib/firebase-admin')
      const db = getAdminFirestore()
      const snap = await db.collection('users').doc(userId).collection('settings').doc('wordpress').get()
      if (snap.exists) {
        const data = snap.data()!
        apiUrl = data.apiUrl
        username = data.username
        appPassword = data.appPassword
      }
    } catch (e) {
      console.warn('Firestore WP config read failed, trying local fallback:', (e as Error)?.message?.slice(0, 60))
    }
  }

  // 2. Fallback: local settings file (dev mode when Firestore is unavailable)
  if (!apiUrl && userId) {
    const local = readLocalWPConfig(userId)
    apiUrl = local.apiUrl
    username = local.username
    appPassword = local.appPassword
  }

  // 3. Last resort: env vars
  if (!apiUrl) apiUrl = process.env.WORDPRESS_API_URL
  if (!username) username = process.env.WORDPRESS_USERNAME
  if (!appPassword) appPassword = process.env.WORDPRESS_APP_PASSWORD

  if (!apiUrl || !username || !appPassword) {
    throw new Error(
      'Configuración de WordPress incompleta. Por favor, conéctalo en la sección de Configuración.'
    )
  }

  const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64')
  return { apiUrl, credentials }
}

export async function getCategories(userId?: string): Promise<WPCategory[]> {
  const { apiUrl, credentials } = await getWPConfig(userId)

  const response = await fetch(`${apiUrl}/categories?per_page=100&orderby=name`, {
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error al obtener categorías de WordPress: ${error}`)
  }

  return response.json() as Promise<WPCategory[]>
}

export async function findCategoryByName(name: string, userId?: string): Promise<WPCategory | null> {
  const categories = await getCategories(userId)
  const normalized = name.toLowerCase().trim()

  return (
    categories.find(
      (cat) =>
        cat.name.toLowerCase() === normalized || cat.slug === slugify(normalized)
    ) || null
  )
}

export async function createCategory(
  payload: WPCreateCategoryPayload,
  userId?: string
): Promise<WPCategory> {
  const { apiUrl, credentials } = await getWPConfig(userId)

  const response = await fetch(`${apiUrl}/categories`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: payload.name,
      slug: payload.slug || slugify(payload.name),
      description: payload.description || '',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error al crear categoría en WordPress: ${error}`)
  }

  return response.json() as Promise<WPCategory>
}

export async function findOrCreateCategory(categoryName: string, userId?: string): Promise<{
  category: WPCategory
  created: boolean
}> {
  const existing = await findCategoryByName(categoryName, userId)

  if (existing) {
    return { category: existing, created: false }
  }

  const created = await createCategory({ name: categoryName }, userId)
  return { category: created, created: true }
}

export async function createPost(payload: WPCreatePostPayload, userId?: string): Promise<WPPost> {
  const { apiUrl, credentials } = await getWPConfig(userId)

  const response = await fetch(`${apiUrl}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error al crear entrada en WordPress: ${error}`)
  }

  return response.json() as Promise<WPPost>
}

/** Crear una Página (Page) en WordPress — diferente a una entrada (post) */
export async function createPage(payload: Omit<WPCreatePostPayload, 'categories'> & { parent?: number }, userId?: string): Promise<WPPost> {
  const { apiUrl, credentials } = await getWPConfig(userId)

  const response = await fetch(`${apiUrl}/pages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error al crear página en WordPress: ${error}`)
  }

  return response.json() as Promise<WPPost>
}

export async function getPosts(params?: {
  page?: number
  per_page?: number
  status?: string
  categories?: number[]
  search?: string
}, userId?: string): Promise<{ posts: WPPost[]; totalPages: number; total: number }> {
  const { apiUrl, credentials } = await getWPConfig(userId)

  const query = new URLSearchParams()
  if (params?.page) query.append('page', params.page.toString())
  if (params?.per_page) query.append('per_page', params.per_page.toString())
  if (params?.status) query.append('status', params.status)
  if (params?.search) query.append('search', params.search)
  if (params?.categories && params.categories.length > 0) {
    query.append('categories', params.categories.join(','))
  }

  const response = await fetch(`${apiUrl}/posts?${query.toString()}`, {
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error al obtener entradas de WordPress: ${error}`)
  }

  const posts = (await response.json()) as WPPost[]
  const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1', 10)
  const total = parseInt(response.headers.get('x-wp-total') || '0', 10)

  return { posts, totalPages, total }
}

export async function getAllPosts(status: string = 'publish', userId?: string): Promise<WPPost[]> {
  let allPosts: WPPost[] = []
  let page = 1
  let totalPages = 1

  do {
    const result = await getPosts({ page, per_page: 100, status }, userId)
    allPosts = allPosts.concat(result.posts)
    totalPages = result.totalPages
    page++
  } while (page <= totalPages)

  return allPosts
}

export async function getPost(id: number, userId?: string): Promise<WPPost> {
  const { apiUrl, credentials } = await getWPConfig(userId)

  const response = await fetch(`${apiUrl}/posts/${id}`, {
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error al obtener la entrada ${id}: ${error}`)
  }

  return response.json() as Promise<WPPost>
}

export async function updatePost(
  id: number,
  payload: WPUpdatePostPayload,
  userId?: string
): Promise<WPPost> {
  const { apiUrl, credentials } = await getWPConfig(userId)

  const response = await fetch(`${apiUrl}/posts/${id}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error al actualizar entrada en WordPress: ${error}`)
  }

  return response.json() as Promise<WPPost>
}

// Helpers
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
