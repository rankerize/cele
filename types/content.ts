export interface ContentFormData {
  nicho: string
  keywordPrincipal: string
  paisMercado: string
  intencionBusqueda: 'informativa' | 'comercial' | 'comparativa' | 'transaccional'
  tipoPieza: 'blog' | 'landing' | 'pagina-servicio' | 'categoria' | 'ficha-producto'
  ctaFinal: string
  tono: string
  longitudAproximada: string
  categoriaDeseada?: string
}

export interface ContentIdea {
  title: string
  keyword: string
  description: string
  angle: string
  longTails: string[]
}

export interface GeneratedContent {
  intencionRefinada: string
  keywordsSecundarias: string[]
  titleSEO: string
  metaDescription: string
  estructuraH1: string
  estructuraH2: string[]
  estructuraH3: string[]
  preguntasFrecuentes: { pregunta: string; respuesta: string }[]
  borrador: string
  slugSugerido: string
  categoriaSugerida: string
  fuentes: string[]
}

export interface ContentItem {
  id: string
  createdAt: string
  type: 'creation' | 'improvement' | 'batch'
  formData?: ContentFormData
  generatedContent?: GeneratedContent
  editedContent?: EditedContent
  improvementData?: ImprovementSuggestion
  wordpressPostId?: number
  wordpressPostUrl?: string
  categoryName?: string
  status: 'generated' | 'sent' | 'error' | 'improved'
  gscMetrics?: {
    impressions: number
    clicks: number
    position: number
  }
}

export interface EditedContent {
  title: string
  slug: string
  metaDescription: string
  categoria: string
  content: string
  faqs: { pregunta: string; respuesta: string }[]
  excerpt: string
  fuentes: string[]
  status?: 'draft' | 'publish' | 'pending'
}

export interface PublishResult {
  success: boolean
  postId?: number
  postUrl?: string
  categoryName?: string
  categoryCreated?: boolean
  error?: string
}

export type ConflictLevel = 'bajo' | 'medio' | 'alto'
export type RecommendedAction = 'crear-nuevo' | 'actualizar-existente' | 'revisar-manual'

export interface EditorialMapItem {
  id: number
  title: string
  slug: string
  url: string
  status: string
  keywordPrincipal: string
  keywordsSecundarias?: string[]
  categoria: string
  ramaTematica?: string
  intencionBusqueda?: string
  padreId?: number
  relacionadosIds?: number[]
}

export interface ConflictMatch {
  post: EditorialMapItem
  score: number
  reasons: string[]
}

export interface ConflictAnalysis {
  level: ConflictLevel
  matches: ConflictMatch[]
  recommendedAction: RecommendedAction
}

export interface ImprovementSuggestion {
  analisisSEO: string
  sugerenciasTitulo: string[]
  sugerenciasContenido: string[]
  nuevasKeywords: string[]
  faqsRecomendadas: { pregunta: string; respuesta: string }[]
  // Nuevos campos para mejora completa
  improvedTitle: string
  improvedContent: string
  improvedSeoTitle: string
  improvedMetaDescription: string
  improvedSlug: string
  scoreSEO: number 
}

export interface AutoCategorizeResult {
  postId: number
  proposedCategory: string
  isNewCategory: boolean
  reason: string
}

export interface InternalLinkSuggestion {
  anchorText: string
  suggestedUrl: string
  postTitle: string
  reason: string
}

export interface BatchPlanItem {
  id: string
  keyword: string
  title: string
  angle: string
  intencionBusqueda: 'informativa' | 'comercial' | 'comparativa' | 'transaccional' | string
  categoriaDeseada: string
  gscConflict: boolean
  gscConflictReason?: string
  approved: boolean
  status: 'pending' | 'generating' | 'published' | 'error'
  resultUrl?: string
  error?: string
}

export interface BatchPlan {
  topic: string
  items: BatchPlanItem[]
}
