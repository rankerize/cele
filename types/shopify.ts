/**
 * types/shopify.ts — Tipos para la integración con Shopify Admin API
 *
 * SEGURIDAD: adminAccessToken NUNCA se envía al cliente.
 * Solo se usa en API routes (servidor).
 */

// ── Configuración guardada en Firestore ──────────────────────────────────────
export interface ShopifyConfig {
  /** Dominio .myshopify.com — ej: tienda.myshopify.com */
  shopDomain: string
  /** Admin Access Token — shpat_... Solo en servidor */
  adminAccessToken: string
  /** Timestamp de última actualización */
  updatedAt: string
  /** true si la última verificación fue exitosa */
  connected?: boolean
}

// ── Respuesta de /admin/api/{version}/shop.json ──────────────────────────────
export interface ShopifyShop {
  id: number
  name: string
  email: string
  domain: string
  myshopify_domain: string
  plan_name: string
  currency: string
  timezone: string
  created_at: string
}

// ── Producto de Shopify ──────────────────────────────────────────────────────
export interface ShopifyProduct {
  id: number
  title: string
  body_html: string
  vendor: string
  product_type: string
  status: 'active' | 'archived' | 'draft'
  handle: string
  variants: ShopifyVariant[]
  images: ShopifyImage[]
  created_at: string
  updated_at: string
}

export interface ShopifyVariant {
  id: number
  product_id: number
  title: string
  price: string
  sku: string
  inventory_quantity: number
}

export interface ShopifyImage {
  id: number
  product_id: number
  src: string
  alt: string | null
}

// ── Blog Post de Shopify ─────────────────────────────────────────────────────
export interface ShopifyArticle {
  id: number
  title: string
  body_html: string
  blog_id: number
  author: string
  handle: string
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  tags: string
  summary_html: string | null
  image: { src: string; alt: string } | null
}

export interface ShopifyBlog {
  id: number
  title: string
  handle: string
  commentable: string
  created_at: string
}

// ── Payloads para crear contenido ────────────────────────────────────────────
export interface CreateShopifyArticlePayload {
  title: string
  body_html: string
  author?: string
  tags?: string
  summary_html?: string
  published?: boolean  // false = draft
}

export interface CreateShopifyProductPayload {
  title: string
  body_html: string
  vendor?: string
  product_type?: string
  status?: 'active' | 'archived' | 'draft'
  tags?: string
}

// ── Respuesta de verificación ────────────────────────────────────────────────
export interface ShopifyVerifyResult {
  success: boolean
  shop?: Pick<ShopifyShop, 'name' | 'domain' | 'myshopify_domain' | 'plan_name' | 'currency'>
  error?: string
}
