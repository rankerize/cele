/**
 * lib/woocommerce.ts
 * Capa de acceso a datos para WooCommerce REST API v3.
 * Arquitectura espejo de lib/wordpress.ts con soporte multi-usuario (Firestore + .env)
 * y capacidades de lectura/escritura.
 */

import {
  WCProduct,
  WCProductsParams,
  WCUpdateProductPayload,
  WCOptimizeResult,
} from '@/types/woocommerce'

// ─────────────────────────────────────────────
// 1. Configuración de credenciales (multi-usuario)
// ─────────────────────────────────────────────

interface WCConfig {
  apiUrl: string
  consumerKey: string
  consumerSecret: string
}

async function getWCConfig(userId?: string): Promise<WCConfig> {
  let apiUrl: string | undefined
  let consumerKey: string | undefined
  let consumerSecret: string | undefined

  // 1. Leer configuración por usuario desde Firestore
  if (userId) {
    try {
      const { getAdminFirestore } = await import('@/lib/firebase-admin')
      const db = getAdminFirestore()
      const snap = await db
        .collection('users')
        .doc(userId)
        .collection('settings')
        .doc('woocommerce')
        .get()

      if (snap.exists) {
        const data = snap.data()!
        apiUrl = data.apiUrl
        consumerKey = data.consumerKey
        consumerSecret = data.consumerSecret
      }
    } catch (e) {
      console.warn('Firestore WC config read failed, falling back to env:', e)
    }
  }

  // 2. Fallback a variables de entorno
  if (!apiUrl) apiUrl = process.env.WOOCOMMERCE_API_URL
  if (!consumerKey) consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY
  if (!consumerSecret) consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET

  if (!apiUrl || !consumerKey || !consumerSecret) {
    throw new Error(
      'Configuración de WooCommerce incompleta. Por favor, conéctalo en la sección de Configuración.'
    )
  }

  return { apiUrl, consumerKey, consumerSecret }
}

/** Genera los headers de autenticación Basic para WooCommerce */
function buildWCHeaders(consumerKey: string, consumerSecret: string): HeadersInit {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
  }
}

// ─────────────────────────────────────────────
// 2. Operaciones de LECTURA
// ─────────────────────────────────────────────

/**
 * Obtiene una lista paginada de productos.
 * Devuelve el array de productos + metadatos de paginación.
 */
export async function getProducts(
  params?: WCProductsParams,
  userId?: string
): Promise<{ products: WCProduct[]; totalPages: number; total: number }> {
  const { apiUrl, consumerKey, consumerSecret } = await getWCConfig(userId)

  const query = new URLSearchParams()
  if (params?.page) query.append('page', params.page.toString())
  if (params?.per_page) query.append('per_page', params.per_page.toString())
  if (params?.status) query.append('status', params.status)
  if (params?.search) query.append('search', params.search)
  if (params?.category) query.append('category', params.category.toString())

  const response = await fetch(`${apiUrl}/products?${query.toString()}`, {
    headers: buildWCHeaders(consumerKey, consumerSecret),
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error al obtener productos de WooCommerce: ${error}`)
  }

  const products = (await response.json()) as WCProduct[]
  const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1', 10)
  const total = parseInt(response.headers.get('x-wp-total') || '0', 10)

  return { products, totalPages, total }
}

/**
 * Recorre todas las páginas y devuelve la lista completa de productos.
 * Usa el mismo patrón que getAllPosts() en lib/wordpress.ts.
 */
export async function getAllProducts(
  status: string = 'publish',
  userId?: string
): Promise<WCProduct[]> {
  let allProducts: WCProduct[] = []
  let page = 1
  let totalPages = 1

  do {
    const result = await getProducts({ page, per_page: 100, status }, userId)
    allProducts = allProducts.concat(result.products)
    totalPages = result.totalPages
    page++
  } while (page <= totalPages)

  return allProducts
}

/**
 * Obtiene un único producto por su ID.
 * Incluye el array completo de imágenes con src, name y alt.
 */
export async function getProduct(id: number, userId?: string): Promise<WCProduct> {
  const { apiUrl, consumerKey, consumerSecret } = await getWCConfig(userId)

  const response = await fetch(`${apiUrl}/products/${id}`, {
    headers: buildWCHeaders(consumerKey, consumerSecret),
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error al obtener el producto ${id}: ${error}`)
  }

  return response.json() as Promise<WCProduct>
}

// ─────────────────────────────────────────────
// 3. Operaciones de ESCRITURA (PUT)
// ─────────────────────────────────────────────

/**
 * Actualiza el nombre, descripción y/o textos ALT de las imágenes de un producto.
 * WooCommerce acepta PUT /products/{id} con el payload parcial.
 */
export async function updateProduct(
  id: number,
  payload: WCUpdateProductPayload,
  userId?: string
): Promise<WCProduct> {
  const { apiUrl, consumerKey, consumerSecret } = await getWCConfig(userId)

  const response = await fetch(`${apiUrl}/products/${id}`, {
    method: 'PUT',
    headers: buildWCHeaders(consumerKey, consumerSecret),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error al actualizar el producto ${id} en WooCommerce: ${error}`)
  }

  return response.json() as Promise<WCProduct>
}

// ─────────────────────────────────────────────
// 4. Integración de créditos (Firestore)
// ─────────────────────────────────────────────

/**
 * Descuenta 1 crédito del balance del usuario.
 * Usa una transacción atómica para evitar race conditions.
 * Lanza un error si el usuario no tiene créditos suficientes.
 */
export async function deductCredit(userId: string): Promise<number> {
  const { getAdminFirestore } = await import('@/lib/firebase-admin')
  const db = getAdminFirestore()
  const creditRef = db.collection('users').doc(userId).collection('credits').doc('balance')

  let remaining = 0

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(creditRef)
    const currentBalance: number = snap.exists ? (snap.data()?.amount ?? 0) : 0

    if (currentBalance < 1) {
      throw new Error('Créditos insuficientes. Por favor, recarga tu balance.')
    }

    remaining = currentBalance - 1
    tx.set(creditRef, { amount: remaining, updatedAt: new Date().toISOString() }, { merge: true })
  })

  return remaining
}

// ─────────────────────────────────────────────
// 5. Función orquestadora: optimizeAndPushProduct
// ─────────────────────────────────────────────

export interface ProductOptimizationInput {
  productId: number
  userId: string
  /** Si se omite, la IA generará valores basándose en la data actual del producto */
  overrides?: {
    name?: string
    description?: string
    short_description?: string
    imagesAlt?: { id: number; alt: string }[]
  }
}

/**
 * Orquestador principal del módulo ecommerce-engine.
 *
 * Flujo:
 * 1. Lee el producto actual desde WooCommerce (título, descripción, array de imágenes).
 * 2. Genera optimizaciones con IA (nombre SEO, descripción, ALT de imágenes).
 * 3. Empuja los cambios de vuelta a WooCommerce vía PUT.
 * 4. Descuenta 1 crédito del balance del usuario en Firestore (transacción atómica).
 * 5. Retorna un resumen de los campos actualizados y los créditos restantes.
 */
export async function optimizeAndPushProduct(
  input: ProductOptimizationInput
): Promise<WCOptimizeResult> {
  const { productId, userId, overrides } = input

  // ── Paso 1: Leer producto actual ──
  const currentProduct = await getProduct(productId, userId)

  // ── Paso 2: Generar optimizaciones con IA ──
  let optimizedFields: WCUpdateProductPayload

  if (overrides) {
    // Si se pasan overrides manuales, usarlos directamente
    optimizedFields = {
      name: overrides.name,
      description: overrides.description,
      short_description: overrides.short_description,
      images: overrides.imagesAlt?.map((img) => ({ id: img.id, alt: img.alt })),
    }
  } else {
    // Optimización automática vía Gemini
    const { generateProductOptimization } = await import('@/lib/woocommerce-ai')
    optimizedFields = await generateProductOptimization(currentProduct, userId)
  }

  // ── Paso 3: Verificar créditos ANTES del push (fail-fast) ──
  const creditsRemaining = await deductCredit(userId)

  // ── Paso 4: Empujar cambios a WooCommerce ──
  await updateProduct(productId, optimizedFields, userId)

  // ── Paso 5: Construir y retornar resultado ──
  const result: WCOptimizeResult = {
    productId,
    updatedFields: {
      name: optimizedFields.name,
      description: optimizedFields.description,
      short_description: optimizedFields.short_description,
      imagesAlt: optimizedFields.images?.map((img) => ({ id: img.id!, alt: img.alt! })),
    },
    creditsRemaining,
    pushedAt: new Date().toISOString(),
  }

  return result
}
