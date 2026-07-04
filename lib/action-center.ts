// ─── Action Center — Servicio de Consolidación y Trazabilidad ───────────────
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import {
  SEOAction,
  ActionType,
  ActionStatus,
  ActionPriority,
  ActionFilters,
  ActionStatusUpdate,
  ActionTraceEvent,
  PRIORITY_ORDER,
} from '@/types/action'

const COLLECTION = 'action_center'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `ac_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function now(): string {
  return new Date().toISOString()
}

// ─── CRUD Operations ─────────────────────────────────────────────────────────

export async function createAction(
  data: Omit<SEOAction, 'id' | 'createdAt' | 'updatedAt' | 'trace' | 'status'>
): Promise<SEOAction> {
  const id = generateId()
  const timestamp = now()

  const trace: ActionTraceEvent[] = [
    {
      timestamp,
      event: 'created',
      note: `Acción generada por módulo: ${data.sourceModule}`,
    },
  ]

  const action: SEOAction = {
    ...data,
    id,
    status: 'pending' as ActionStatus,
    createdAt: timestamp,
    updatedAt: timestamp,
    trace,
  }

  await adminDb.collection(COLLECTION).doc(id).set(action)
  return action
}

export async function getActions(filters: ActionFilters = {}): Promise<SEOAction[]> {
  let query: FirebaseFirestore.Query = adminDb.collection(COLLECTION)

  if (filters.type && filters.type !== 'all') {
    query = query.where('type', '==', filters.type)
  }
  if (filters.status && filters.status !== 'all') {
    query = query.where('status', '==', filters.status)
  }
  if (filters.priority && filters.priority !== 'all') {
    query = query.where('priority', '==', filters.priority)
  }
  if (filters.source && filters.source !== 'all') {
    query = query.where('sourceModule', '==', filters.source)
  }

  const snapshot = await query.get()
  let actions = snapshot.docs.map((doc) => doc.data() as SEOAction)

  // Filtrado local por búsqueda de texto
  if (filters.search) {
    const term = filters.search.toLowerCase()
    actions = actions.filter(
      (a) =>
        a.keyword?.toLowerCase().includes(term) ||
        a.url?.toLowerCase().includes(term) ||
        a.category?.toLowerCase().includes(term)
    )
  }

  // Ordenar: prioridad primero, luego fecha desc
  actions.sort((a, b) => {
    const paDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (paDiff !== 0) return paDiff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return actions
}

export async function getActionById(id: string): Promise<SEOAction | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get()
  if (!doc.exists) return null
  return doc.data() as SEOAction
}

export async function updateActionStatus(
  id: string,
  update: ActionStatusUpdate
): Promise<SEOAction | null> {
  const ref = adminDb.collection(COLLECTION).doc(id)
  const doc = await ref.get()
  if (!doc.exists) return null

  const current = doc.data() as SEOAction
  const timestamp = now()

  // Construir evento de traza
  const traceEvent: ActionTraceEvent = {
    timestamp,
    event: update.status as ActionTraceEvent['event'],
    by: update.by,
    note: update.note,
    result: update.result,
  }

  const updates: Partial<SEOAction> & Record<string, unknown> = {
    status: update.status,
    updatedAt: timestamp,
    trace: FieldValue.arrayUnion(traceEvent) as unknown as ActionTraceEvent[],
  }

  // Timestamps semánticos
  if (update.status === 'approved') updates.approvedAt = timestamp
  if (update.status === 'approved' && update.by) updates.approvedBy = update.by
  if (update.status === 'executed') {
    updates.executedAt = timestamp
    if (update.result) updates.executionResult = update.result
  }
  if (update.status === 'failed' && update.error) updates.executionError = update.error
  if (update.status === 'discarded') updates.discardedAt = timestamp

  await ref.update(updates)

  // Devolver acción actualizada
  const updated = await ref.get()
  return updated.data() as SEOAction
}

export async function deleteAction(id: string): Promise<boolean> {
  try {
    await adminDb.collection(COLLECTION).doc(id).delete()
    return true
  } catch {
    return false
  }
}

// ─── Estadísticas rápidas ─────────────────────────────────────────────────────

export async function getActionCenterStats(): Promise<{
  total: number
  pending: number
  critical: number
  executing: number
  executed: number
  discarded: number
}> {
  const snapshot = await adminDb.collection(COLLECTION).get()
  const actions = snapshot.docs.map((d) => d.data() as SEOAction)

  return {
    total: actions.length,
    pending: actions.filter((a) => a.status === 'pending').length,
    critical: actions.filter((a) => a.priority === 'critical' && a.status === 'pending').length,
    executing: actions.filter((a) => a.status === 'executing').length,
    executed: actions.filter((a) => a.status === 'executed').length,
    discarded: actions.filter((a) => a.status === 'discarded').length,
  }
}

// ─── Seed: Consolida acciones desde módulos existentes ───────────────────────

interface SeedResult {
  created: number
  skipped: number
  errors: string[]
}

export async function seedActionsFromModules(
  gscData?: {
    rows?: Array<{
      keys: string[]
      clicks: number
      impressions: number
      ctr: number
      position: number
    }>
  },
  canniData?: Array<{
    keyword: string
    url?: string
    category?: string
    conflictLevel?: string
    reason?: string
  }>,
  editorialData?: Array<{
    keyword: string
    url?: string
    category?: string
    branch?: string
    status?: string
  }>
): Promise<SeedResult> {
  const result: SeedResult = { created: 0, skipped: 0, errors: [] }

  // ── 1. Acciones desde GSC: optimize_ctr (alto CTR potencial, baja posición) ──
  if (gscData?.rows) {
    const ctrOpportunities = gscData.rows.filter(
      (row) => row.position > 5 && row.position <= 20 && row.impressions > 100 && row.ctr < 0.05
    )

    for (const row of ctrOpportunities.slice(0, 10)) {
      try {
        const keyword = row.keys[0]
        // Verificar si ya existe una acción similar
        const existing = await adminDb
          .collection(COLLECTION)
          .where('type', '==', 'optimize_ctr')
          .where('keyword', '==', keyword)
          .where('status', 'in', ['pending', 'reviewed', 'approved'])
          .get()

        if (!existing.empty) {
          result.skipped++
          continue
        }

        const priority: ActionPriority =
          row.impressions > 1000 ? 'high' : row.impressions > 500 ? 'medium' : 'low'

        await createAction({
          type: 'optimize_ctr',
          priority,
          keyword,
          url: row.keys[1],
          reason: `Posición ${row.position.toFixed(1)}, CTR ${(row.ctr * 100).toFixed(1)}% con ${row.impressions} impresiones — oportunidad de mejora de título/meta`,
          explanation: `Esta keyword tiene buena visibilidad (${row.impressions} impresiones) pero bajo CTR (${(row.ctr * 100).toFixed(1)}%). Mejorar el título SEO y la meta descripción puede incrementar el CTR significativamente. Prioridad basada en el volumen de impresiones perdidas.`,
          sourceModule: 'gsc',
          sourceData: {
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          },
          riskLevel: 'low',
        })
        result.created++
      } catch (e) {
        result.errors.push(`GSC CTR: ${String(e)}`)
      }
    }
  }

  // ── 2. Acciones desde canibalización ─────────────────────────────────────
  if (canniData) {
    for (const item of canniData.slice(0, 15)) {
      try {
        const existing = await adminDb
          .collection(COLLECTION)
          .where('type', '==', 'review_cannibalization')
          .where('keyword', '==', item.keyword)
          .where('status', 'in', ['pending', 'reviewed'])
          .get()

        if (!existing.empty) {
          result.skipped++
          continue
        }

        const priority: ActionPriority =
          item.conflictLevel === 'alto'
            ? 'critical'
            : item.conflictLevel === 'medio'
            ? 'high'
            : 'medium'

        await createAction({
          type: 'review_cannibalization',
          priority,
          keyword: item.keyword,
          url: item.url,
          category: item.category,
          reason: item.reason || 'Múltiples URLs compiten por esta keyword',
          explanation: `Se detectó canibalización semántica para la keyword "${item.keyword}". Múltiples URLs del sitio están posicionando por términos similares, lo que puede diluir la autoridad y confundir a los motores de búsqueda. Se recomienda revisar y consolidar las URLs afectadas.`,
          sourceModule: 'cannibalization',
          sourceData: { conflictLevel: item.conflictLevel },
          riskLevel:
            item.conflictLevel === 'alto'
              ? 'high'
              : item.conflictLevel === 'medio'
              ? 'medium'
              : 'low',
          conflictDetails: item.reason,
        })
        result.created++
      } catch (e) {
        result.errors.push(`Cannibalization: ${String(e)}`)
      }
    }
  }

  // ── 3. Acciones desde mapa editorial: strengthen_interlinking ────────────
  if (editorialData) {
    const orphanedItems = editorialData.filter(
      (item) => item.status === 'publish' && item.keyword
    )

    for (const item of orphanedItems.slice(0, 8)) {
      try {
        const existing = await adminDb
          .collection(COLLECTION)
          .where('type', '==', 'strengthen_interlinking')
          .where('url', '==', item.url)
          .where('status', 'in', ['pending', 'reviewed'])
          .get()

        if (!existing.empty) {
          result.skipped++
          continue
        }

        await createAction({
          type: 'strengthen_interlinking',
          priority: 'medium',
          keyword: item.keyword,
          url: item.url,
          category: item.category,
          branch: item.branch,
          reason: 'Artículo publicado con bajo enlazado interno detectado',
          explanation: `El artículo "${item.keyword}" tiene oportunidades de mejora en su red de enlaces internos. Reforzar el enlazado hacia y desde este contenido puede mejorar su posicionamiento y la distribución del PageRank interno.`,
          sourceModule: 'interlinking',
          sourceData: { title: item.keyword, url: item.url },
          riskLevel: 'low',
        })
        result.created++
      } catch (e) {
        result.errors.push(`Interlinking: ${String(e)}`)
      }
    }
  }

  return result
}
