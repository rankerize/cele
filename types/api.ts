export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface GenerateContentRequest {
  nicho: string
  keywordPrincipal: string
  paisMercado: string
  intencionBusqueda: string
  tipoPieza: string
  ctaFinal: string
  tono: string
  longitudAproximada: string
  categoriaDeseada?: string
}

export interface PublishToWordPressRequest {
  title: string
  slug: string
  content: string
  excerpt?: string
  metaDescription?: string
  categoria: string
  faqs?: { pregunta: string; respuesta: string }[]
}
