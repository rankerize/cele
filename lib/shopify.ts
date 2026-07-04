/**
 * lib/shopify.ts — Servicio de integración con Shopify Admin REST API
 *
 * Versión de API: 2024-01 (estable)
 * SEGURIDAD: Este archivo SOLO corre en el servidor (Next.js API Routes).
 *            El adminAccessToken JAMÁS llega al cliente.
 *
 * Patrón: igual que lib/wordpress.ts — lee config de Firestore por userId.
 */

import {
  ShopifyConfig,
  ShopifyShop,
  ShopifyArticle,
  ShopifyBlog,
  ShopifyProduct,
  CreateShopifyArticlePayload,
  CreateShopifyProductPayload,
  ShopifyVerifyResult,
} from '@/types/shopify'

const SHOPIFY_API_VERSION = '2024-01'

// ── Normalizar dominio ────────────────────────────────────────────────────────
/**
 * Acepta cualquier formato que el usuario ingrese y devuelve el dominio limpio.
 * Ejemplos aceptados:
 *   "mitienda.myshopify.com"
 *   "https://mitienda.myshopify.com"
 *   "mitienda"  (solo el subdomain)
 *
 * NOTA: Si el usuario ingresó un dominio personalizado (ej: mitienda.com),
 *       necesita buscar su dominio .myshopify.com en el panel de Shopify.
 */
export function normalizeShopDomain(input: string): string {
  // Quitar protocolo y trailing slash
  let domain = input.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
  // Quitar /admin u otras rutas
  domain = domain.split('/')[0]
  // Si no tiene .myshopify.com, asumimos que es solo el subdominio
  if (!domain.includes('.')) {
    domain = `${domain}.myshopify.com`
  } else if (!domain.includes('myshopify.com') && !domain.includes('.')) {
    domain = `${domain}.myshopify.com`
  }
  return domain.toLowerCase()
}

// ── Leer configuración desde Firestore ───────────────────────────────────────
async function getShopifyConfig(userId?: string): Promise<ShopifyConfig> {
  if (userId) {
    try {
      const { getAdminFirestore } = await import('@/lib/firebase-admin')
      const db = getAdminFirestore()
      const snap = await db
        .collection('users')
        .doc(userId)
        .collection('settings')
        .doc('shopify')
        .get()

      if (snap.exists) {
        const data = snap.data()!
        if (data.shopDomain && data.adminAccessToken) {
          return data as ShopifyConfig
        }
      }
    } catch (e) {
      console.warn('[Shopify] Error leyendo config de Firestore:', (e as Error).message?.slice(0, 80))
    }
  }

  // Fallback a variables de entorno (para desarrollo)
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN
  const adminAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
  if (!shopDomain || !adminAccessToken) {
    throw new Error(
      'Shopify no está configurado. Ve a Configuración → Shopify para conectar tu tienda.'
    )
  }
  return { shopDomain, adminAccessToken, updatedAt: '' }
}

// ── Helper de fetch autenticado ───────────────────────────────────────────────
async function shopifyFetch<T>(
  endpoint: string,
  config: ShopifyConfig,
  options: RequestInit = {}
): Promise<T> {
  const url = `https://${config.shopDomain}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Shopify-Access-Token': config.adminAccessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = ''
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.errors ?? errorText
    } catch {
      errorMessage = errorText
    }
    throw new Error(`Shopify API ${response.status}: ${errorMessage}`)
  }

  return response.json() as Promise<T>
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIONES PÚBLICAS
// ════════════════════════════════════════════════════════════════════════════

// ── 1. Verificar conexión ─────────────────────────────────────────────────
export async function verifyShopifyConnection(
  shopDomain: string,
  adminAccessToken: string
): Promise<ShopifyVerifyResult> {
  try {
    const normalizedDomain = normalizeShopDomain(shopDomain)
    const tempConfig: ShopifyConfig = {
      shopDomain: normalizedDomain,
      adminAccessToken,
      updatedAt: '',
    }

    const data = await shopifyFetch<{ shop: ShopifyShop }>('shop.json', tempConfig)

    return {
      success: true,
      shop: {
        name: data.shop.name,
        domain: data.shop.domain,
        myshopify_domain: data.shop.myshopify_domain,
        plan_name: data.shop.plan_name,
        currency: data.shop.currency,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con Shopify',
    }
  }
}

// ── 2. Obtener info de la tienda ──────────────────────────────────────────
export async function getShopInfo(userId?: string): Promise<ShopifyShop> {
  const config = await getShopifyConfig(userId)
  const data = await shopifyFetch<{ shop: ShopifyShop }>('shop.json', config)
  return data.shop
}

// ── 3. Obtener productos ──────────────────────────────────────────────────
export async function getShopifyProducts(
  params: { page?: number; limit?: number; status?: string } = {},
  userId?: string
): Promise<{ products: ShopifyProduct[]; count: number }> {
  const config = await getShopifyConfig(userId)

  const query = new URLSearchParams()
  query.set('limit', String(params.limit ?? 20))
  if (params.status) query.set('status', params.status)

  const data = await shopifyFetch<{ products: ShopifyProduct[] }>(
    `products.json?${query}`,
    config
  )
  return { products: data.products, count: data.products.length }
}

// ── 4. Obtener blogs disponibles ──────────────────────────────────────────
export async function getShopifyBlogs(userId?: string): Promise<ShopifyBlog[]> {
  const config = await getShopifyConfig(userId)
  const data = await shopifyFetch<{ blogs: ShopifyBlog[] }>('blogs.json', config)
  return data.blogs
}

// ── 5. Publicar artículo de blog (DRAFT por defecto) ──────────────────────
/**
 * Por seguridad, published = false (borrador) a menos que el usuario
 * explícitamente lo cambie a true.
 */
export async function publishShopifyArticle(
  payload: CreateShopifyArticlePayload,
  blogId: number,
  userId?: string
): Promise<ShopifyArticle> {
  const config = await getShopifyConfig(userId)

  const articlePayload = {
    article: {
      title: payload.title,
      body_html: payload.body_html,
      author: payload.author ?? 'Rankerize Flow',
      tags: payload.tags ?? '',
      summary_html: payload.summary_html ?? '',
      published: payload.published ?? false, // DRAFT por defecto
    },
  }

  const data = await shopifyFetch<{ article: ShopifyArticle }>(
    `blogs/${blogId}/articles.json`,
    config,
    { method: 'POST', body: JSON.stringify(articlePayload) }
  )
  return data.article
}

// ── 6. Crear producto (DRAFT por defecto) ────────────────────────────────
export async function createShopifyProduct(
  payload: CreateShopifyProductPayload,
  userId?: string
): Promise<ShopifyProduct> {
  const config = await getShopifyConfig(userId)

  const productPayload = {
    product: {
      title: payload.title,
      body_html: payload.body_html,
      vendor: payload.vendor ?? '',
      product_type: payload.product_type ?? '',
      status: payload.status ?? 'draft', // DRAFT por defecto
      tags: payload.tags ?? '',
    },
  }

  const data = await shopifyFetch<{ product: ShopifyProduct }>(
    'products.json',
    config,
    { method: 'POST', body: JSON.stringify(productPayload) }
  )
  return data.product
}
