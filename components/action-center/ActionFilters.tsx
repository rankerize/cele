'use client'

import { Search, X, SlidersHorizontal } from 'lucide-react'
import { ActionFilters, ActionType, ActionStatus, ActionPriority, ActionSource } from '@/types/action'

interface Props {
  filters: ActionFilters
  onChange: (filters: ActionFilters) => void
  totalCount: number
  filteredCount: number
}

const TYPE_OPTIONS: Array<{ value: ActionFilters['type']; label: string }> = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'create_content', label: 'Crear contenido' },
  { value: 'improve_content', label: 'Mejorar contenido' },
  { value: 'optimize_ctr', label: 'Optimizar CTR' },
  { value: 'strengthen_interlinking', label: 'Reforzar enlazado' },
  { value: 'reassign_category', label: 'Reasignar categoría' },
  { value: 'review_cannibalization', label: 'Revisar canibalización' },
  { value: 'stop_creation', label: 'Detener creación' },
  { value: 'manual_review', label: 'Revisión manual' },
]

const STATUS_OPTIONS: Array<{ value: ActionFilters['status']; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'reviewed', label: 'Revisada' },
  { value: 'approved', label: 'Aprobada' },
  { value: 'executing', label: 'Ejecutando' },
  { value: 'executed', label: 'Ejecutada' },
  { value: 'discarded', label: 'Descartada' },
  { value: 'failed', label: 'Fallida' },
]

const PRIORITY_OPTIONS: Array<{ value: ActionFilters['priority']; label: string }> = [
  { value: 'all', label: 'Toda prioridad' },
  { value: 'critical', label: '🔴 Crítica' },
  { value: 'high', label: '🟠 Alta' },
  { value: 'medium', label: '🟡 Media' },
  { value: 'low', label: '⚪ Baja' },
]

const SOURCE_OPTIONS: Array<{ value: ActionFilters['source']; label: string }> = [
  { value: 'all', label: 'Todos los módulos' },
  { value: 'gsc', label: 'Google Search Console' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'editorial', label: 'Mapa Editorial' },
  { value: 'cannibalization', label: 'Canibalización' },
  { value: 'interlinking', label: 'Enlazado Interno' },
  { value: 'batch', label: 'Lote de Artículos' },
  { value: 'site_analysis', label: 'Análisis de Sitio' },
]

export default function ActionFiltersBar({ filters, onChange, totalCount, filteredCount }: Props) {
  const hasActiveFilters =
    (filters.type && filters.type !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.priority && filters.priority !== 'all') ||
    (filters.source && filters.source !== 'all') ||
    !!filters.search

  function clearFilters() {
    onChange({ type: 'all', status: 'all', priority: 'all', source: 'all', search: '' })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search + clear */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por keyword o URL..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-9 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent w-full"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-slate-500 shrink-0" />

          <select
            value={filters.type || 'all'}
            onChange={(e) => onChange({ ...filters, type: e.target.value as ActionFilters['type'] })}
            className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent w-auto"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value!}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={filters.status || 'all'}
            onChange={(e) => onChange({ ...filters, status: e.target.value as ActionFilters['status'] })}
            className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent w-auto"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value!}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={filters.priority || 'all'}
            onChange={(e) => onChange({ ...filters, priority: e.target.value as ActionFilters['priority'] })}
            className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent w-auto"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value!}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={filters.source || 'all'}
            onChange={(e) => onChange({ ...filters, source: e.target.value as ActionFilters['source'] })}
            className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent w-auto"
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value!}>
                {o.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>

        {/* Contador */}
        <div className="text-xs text-slate-500 shrink-0">
          {hasActiveFilters ? (
            <span>
              <span className="text-slate-900 font-semibold">{filteredCount}</span>
              <span> de {totalCount}</span>
            </span>
          ) : (
            <span>
              <span className="text-slate-900 font-semibold">{totalCount}</span>
              <span> acciones</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
