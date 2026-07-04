// ── Tipos del módulo ecommerce-engine ──

export interface WCProductImage {
  id: number
  src: string
  name: string
  alt: string
  date_created?: string
  date_modified?: string
}

export interface WCProduct {
  id: number
  name: string
  slug: string
  status: 'publish' | 'draft' | 'pending' | 'private' | string
  link: string
  description: string
  short_description: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  categories: { id: number; name: string; slug: string }[]
  images: WCProductImage[]
  date_created?: string
  date_modified?: string
}

/** Parámetros para listar productos */
export interface WCProductsParams {
  page?: number
  per_page?: number
  status?: string
  search?: string
  category?: number
}

/** Payload para actualizar un producto (título, descripción, imágenes ALT) */
export interface WCUpdateProductPayload {
  name?: string
  description?: string
  short_description?: string
  /** Para actualizar el ALT de las imágenes se pasa el array completo con el campo `alt` modificado */
  images?: Pick<WCProductImage, 'id' | 'alt'>[]
}

/** Resultado de una optimización IA + push a WooCommerce */
export interface WCOptimizeResult {
  productId: number
  updatedFields: {
    name?: string
    description?: string
    short_description?: string
    imagesAlt?: { id: number; alt: string }[]
  }
  creditsRemaining: number
  pushedAt: string
}
