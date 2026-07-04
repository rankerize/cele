import { WPPost } from './wordpress'
import { GscDataRow } from './gsc'

export type OpportunityLevel = 'high' | 'medium' | 'low'
export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type NextAction = 'approve' | 'review' | 'discard'

export interface TargetPageData {
  url: string
  title: string
  slug: string
  category?: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  internalLinksCount?: number
  // Contexto adicional si existe
  keywords?: string[]
}

export interface SourcePageData {
  id: number
  url: string
  title: string
  category?: string
  excerpt?: string
  content?: string
  internalOutboundLinksCount?: number
}

// 1. Salida del Prompt 1: Priorización
export interface TargetPrioritizationResult {
  targetUrl: string
  shouldStrengthen: boolean
  opportunityLevel: OpportunityLevel
  reasoning: string
}

// 2. Salida del Prompt 2: Recomendación de Fuentes
export interface SourceRecommendation {
  sourceUrl: string
  sourceId: number
  sourceTitle: string
  thematicRelation: string
  confidence: ConfidenceLevel
  reason: string
  warnings: string[]
}

export interface RecommendationResult {
  recommendedSourcePages: SourceRecommendation[]
  pagesToAvoid: { sourceUrl: string; reason: string }[]
  generalWarnings: string[]
}

// 3. Salida del Prompt 3: Sugerencia de Anchors
export interface AnchorSuggestion {
  sourceUrl: string
  sourceId: number
  recommendedAnchorTexts: string[]
  recommendedPlacement: string
  reason: string
}

// ----- Estructura Completa de la UI y Motor ------

export interface InterlinkingOpportunity {
  target: TargetPageData
  prioritization?: TargetPrioritizationResult
}

// Salida final unificada para la Vista Detalle
export interface FullRecommendation {
  targetUrl: string
  targetKeyword?: string
  shouldStrengthen: boolean
  opportunityLevel: OpportunityLevel
  reasoning: string
  recommendedSourcePages: {
    sourceId: number
    sourceUrl: string
    sourceTitle: string
    thematicRelation: string
    recommendedAnchorTexts: string[]
    recommendedPlacement: string
    confidence: ConfidenceLevel
    reason: string
    warnings: string[]
  }[]
  pagesToAvoid: {
    sourceUrl: string
    reason: string
  }[]
  generalWarnings: string[]
  nextAction: NextAction
}
