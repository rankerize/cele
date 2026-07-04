// ─── Action Center — Modelo de Datos ────────────────────────────────────────

export type ActionType =
  | 'create_content'
  | 'improve_content'
  | 'optimize_ctr'
  | 'strengthen_interlinking'
  | 'reassign_category'
  | 'review_cannibalization'
  | 'stop_creation'
  | 'manual_review'

export type ActionStatus =
  | 'pending'
  | 'reviewed'
  | 'approved'
  | 'executing'
  | 'executed'
  | 'discarded'
  | 'failed'

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low'

export type ActionRisk = 'high' | 'medium' | 'low' | 'none'

export type ActionSource =
  | 'gsc'
  | 'wordpress'
  | 'editorial'
  | 'cannibalization'
  | 'interlinking'
  | 'batch'
  | 'site_analysis'

// ─── Trace Event ────────────────────────────────────────────────────────────

export interface ActionTraceEvent {
  timestamp: string
  event:
    | 'created'
    | 'approved'
    | 'discarded'
    | 'executing'
    | 'executed'
    | 'failed'
    | 'reviewed'
    | 'reopened'
  by?: string
  note?: string
  result?: string
}

// ─── Acción SEO Principal ────────────────────────────────────────────────────

export interface SEOAction {
  id: string
  type: ActionType
  priority: ActionPriority
  status: ActionStatus

  // Contexto del contenido
  keyword?: string
  url?: string
  category?: string
  branch?: string // rama temática

  // Descripción y datos
  reason: string // razón principal legible
  explanation?: string // explicación detallada de qué hacer
  warnings?: string[]

  // Origen
  sourceModule: ActionSource
  sourceData?: Record<string, unknown> // datos crudos que originaron la acción

  // Riesgo
  riskLevel: ActionRisk
  conflictDetails?: string

  // Timestamps
  createdAt: string
  updatedAt: string
  approvedAt?: string
  executedAt?: string
  discardedAt?: string

  // Trazabilidad
  approvedBy?: string
  executionResult?: string
  executionError?: string
  trace: ActionTraceEvent[]
}

// ─── Filtros de búsqueda ─────────────────────────────────────────────────────

export interface ActionFilters {
  type?: ActionType | 'all'
  status?: ActionStatus | 'all'
  priority?: ActionPriority | 'all'
  source?: ActionSource | 'all'
  search?: string // keyword o URL
}

// ─── Payload de actualización de estado ─────────────────────────────────────

export interface ActionStatusUpdate {
  status: ActionStatus
  by?: string
  note?: string
  result?: string
  error?: string
}

// ─── Helpers: Labels y metadatos visuales ───────────────────────────────────

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  create_content: 'Crear contenido',
  improve_content: 'Mejorar contenido',
  optimize_ctr: 'Optimizar CTR',
  strengthen_interlinking: 'Reforzar enlazado',
  reassign_category: 'Reasignar categoría',
  review_cannibalization: 'Revisar canibalización',
  stop_creation: 'Detener creación',
  manual_review: 'Revisión manual',
}

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisada',
  approved: 'Aprobada',
  executing: 'Ejecutando',
  executed: 'Ejecutada',
  discarded: 'Descartada',
  failed: 'Fallida',
}

export const ACTION_PRIORITY_LABELS: Record<ActionPriority, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export const ACTION_SOURCE_LABELS: Record<ActionSource, string> = {
  gsc: 'Google Search Console',
  wordpress: 'WordPress',
  editorial: 'Mapa Editorial',
  cannibalization: 'Canibalización',
  interlinking: 'Enlazado Interno',
  batch: 'Lote de Artículos',
  site_analysis: 'Análisis de Sitio',
}

export const PRIORITY_ORDER: Record<ActionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}
