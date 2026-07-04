'use client'

import { useState } from 'react'
import { Eye, Check, X, Play, MessageSquare, AlertTriangle, ExternalLink } from 'lucide-react'
import { SEOAction } from '@/types/action'
import ActionStatusBadge from './ActionStatusBadge'
import ActionTypeBadge from './ActionTypeBadge'
import ActionPriorityBadge from './ActionPriorityBadge'

interface Props {
  action: SEOAction
  onSelect: (action: SEOAction) => void
  onStatusChange: (id: string, status: SEOAction['status'], note?: string) => Promise<void>
}

const PRIORITY_LEFT_BORDER: Record<SEOAction['priority'], string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-slate-600',
}

const RISK_STYLES: Record<SEOAction['riskLevel'], string> = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-slate-500',
  none: 'hidden',
}

export default function ActionRow({ action, onSelect, onStatusChange }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  const canApprove = ['pending', 'reviewed'].includes(action.status)
  const canDiscard = ['pending', 'reviewed', 'approved'].includes(action.status)
  const canExecute = action.status === 'approved'
  const canReopen = ['executed', 'discarded', 'failed'].includes(action.status)

  async function handleStatus(status: SEOAction['status']) {
    setLoading(status)
    try {
      await onStatusChange(action.id, status)
    } finally {
      setLoading(null)
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }

  const isLoading = loading !== null

  return (
    <tr
      className={`
        border-l-2 ${PRIORITY_LEFT_BORDER[action.priority]}
        hover:bg-slate-50/40 transition-colors duration-150 group
        ${action.status === 'discarded' || action.status === 'executed' ? 'opacity-60' : ''}
      `}
    >
      {/* Tipo */}
      <td className="px-4 py-3">
        <ActionTypeBadge type={action.type} />
      </td>

      {/* Prioridad */}
      <td className="px-3 py-3">
        <ActionPriorityBadge priority={action.priority} showLabel={false} />
      </td>

      {/* Keyword / URL */}
      <td className="px-3 py-3 max-w-[200px]">
        <div className="space-y-0.5">
          {action.keyword && (
            <p className="text-sm font-medium text-slate-900 truncate" title={action.keyword}>
              {action.keyword}
            </p>
          )}
          {action.url && (
            <a
              href={action.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-brand-400 transition-colors truncate"
              title={action.url}
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              {action.url.replace(/^https?:\/\/[^/]+/, '')}
            </a>
          )}
        </div>
      </td>

      {/* Categoría / Rama */}
      <td className="px-3 py-3 max-w-[140px]">
        <div className="space-y-0.5">
          {action.category && (
            <p className="text-xs text-slate-700 truncate">{action.category}</p>
          )}
          {action.branch && (
            <p className="text-[11px] text-slate-500 truncate">{action.branch}</p>
          )}
        </div>
      </td>

      {/* Razón */}
      <td className="px-3 py-3 max-w-[240px]">
        <div className="space-y-1">
          <p className="text-xs text-slate-700 line-clamp-2" title={action.reason}>
            {action.reason}
          </p>
          {action.riskLevel !== 'none' && (
            <span className={`flex items-center gap-1 text-[10px] font-medium ${RISK_STYLES[action.riskLevel]}`}>
              <AlertTriangle className="w-3 h-3" />
              Riesgo {action.riskLevel === 'high' ? 'alto' : action.riskLevel === 'medium' ? 'medio' : 'bajo'}
            </span>
          )}
        </div>
      </td>

      {/* Fuente */}
      <td className="px-3 py-3">
        <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
          {action.sourceModule}
        </span>
      </td>

      {/* Estado */}
      <td className="px-3 py-3">
        <ActionStatusBadge status={action.status} />
      </td>

      {/* Fecha */}
      <td className="px-3 py-3">
        <span className="text-[11px] text-slate-500">{formatDate(action.createdAt)}</span>
      </td>

      {/* Acciones rápidas */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          {/* Ver detalle */}
          <button
            title="Ver detalle"
            onClick={() => onSelect(action)}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Aprobar */}
          {canApprove && (
            <button
              title="Aprobar"
              disabled={isLoading}
              onClick={() => handleStatus('approved')}
              className="p-1.5 rounded-md text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-40"
            >
              {loading === 'approved' ? (
                <span className="w-3.5 h-3.5 border border-emerald-400 border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Ejecutar (redirige al módulo) */}
          {canExecute && (
            <button
              title="Ejecutar (ir al módulo)"
              onClick={() => onSelect(action)}
              className="p-1.5 rounded-md text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Marcar revisión */}
          {['pending', 'approved'].includes(action.status) && (
            <button
              title="Marcar para revisión"
              disabled={isLoading}
              onClick={() => handleStatus('reviewed')}
              className="p-1.5 rounded-md text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all disabled:opacity-40"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Descartar / Reabrir */}
          {canDiscard && (
            <button
              title="Descartar"
              disabled={isLoading}
              onClick={() => handleStatus('discarded')}
              className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
            >
              {loading === 'discarded' ? (
                <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
