'use client'

import { useState, useCallback } from 'react'
import { SEOAction, ActionFilters } from '@/types/action'
import ActionRow from './ActionRow'
import ActionFiltersBar from './ActionFilters'
import ActionDetailPanel from './ActionDetailPanel'
import { ChevronLeft, ChevronRight, Inbox, RefreshCw } from 'lucide-react'

interface Props {
  initialActions: SEOAction[]
}

const PAGE_SIZE = 20

export default function ActionCenterTable({ initialActions }: Props) {
  const [actions, setActions] = useState<SEOAction[]>(initialActions)
  const [filters, setFilters] = useState<ActionFilters>({ type: 'all', status: 'all', priority: 'all', source: 'all' })
  const [selectedAction, setSelectedAction] = useState<SEOAction | null>(null)
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  // ── Filtrado local ─────────────────────────────────────────────────────────
  const filteredActions = actions.filter((a) => {
    if (filters.type && filters.type !== 'all' && a.type !== filters.type) return false
    if (filters.status && filters.status !== 'all' && a.status !== filters.status) return false
    if (filters.priority && filters.priority !== 'all' && a.priority !== filters.priority) return false
    if (filters.source && filters.source !== 'all' && a.sourceModule !== filters.source) return false
    if (filters.search) {
      const term = filters.search.toLowerCase()
      return (
        a.keyword?.toLowerCase().includes(term) ||
        a.url?.toLowerCase().includes(term) ||
        a.category?.toLowerCase().includes(term) ||
        false
      )
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredActions.length / PAGE_SIZE))
  const paginated = filteredActions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleFiltersChange(f: ActionFilters) {
    setFilters(f)
    setPage(1)
  }

  // ── Actualizar estado de una acción ───────────────────────────────────────
  const handleStatusChange = useCallback(
    async (id: string, status: SEOAction['status'], note?: string) => {
      const res = await fetch(`/api/action-center/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, by: 'usuario', note }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setActions((prev) => prev.map((a) => (a.id === id ? data : a)))
        if (selectedAction?.id === id) setSelectedAction(data)
      }
    },
    [selectedAction]
  )

  // ── Refresh completo desde API ────────────────────────────────────────────
  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/action-center')
      if (res.ok) {
        const { data } = await res.json()
        setActions(data)
        setPage(1)
      }
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <ActionFiltersBar
            filters={filters}
            onChange={handleFiltersChange}
            totalCount={actions.length}
            filteredCount={filteredActions.length}
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refrescar acciones"
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all disabled:opacity-50 shrink-0 mt-0.5"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        {filteredActions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-600 font-medium">Sin acciones</p>
            <p className="text-slate-600 text-sm mt-1">
              {Object.values(filters).some((v) => v && v !== 'all') || filters.search
                ? 'Prueba con otros filtros'
                : 'El sistema irá generando acciones al analizar tus módulos'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  {['Tipo', 'Prior.', 'Keyword / URL', 'Categoría', 'Razón', 'Fuente', 'Estado', 'Fecha', 'Acción'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap first:pl-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginated.map((action) => (
                  <ActionRow
                    key={action.id}
                    action={action}
                    onSelect={setSelectedAction}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 text-xs">
            Página {page} de {totalPages} · {filteredActions.length} resultados
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.min(
                Math.max(page - 2, 1) + i,
                totalPages
              )
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    pageNum === page
                      ? 'bg-brand-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Panel detalle */}
      <ActionDetailPanel
        action={selectedAction}
        onClose={() => setSelectedAction(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
