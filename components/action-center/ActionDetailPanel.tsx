'use client'

import { useEffect, useRef } from 'react'
import {
  X,
  Check,
  Play,
  MessageSquare,
  RotateCcw,
  ExternalLink,
  Clock,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import { SEOAction, ActionTraceEvent, ACTION_SOURCE_LABELS } from '@/types/action'
import ActionStatusBadge from './ActionStatusBadge'
import ActionTypeBadge from './ActionTypeBadge'
import ActionPriorityBadge from './ActionPriorityBadge'

interface Props {
  action: SEOAction | null
  onClose: () => void
  onStatusChange: (id: string, status: SEOAction['status'], note?: string) => Promise<void>
}

const TRACE_ICONS: Record<ActionTraceEvent['event'], React.ReactNode> = {
  created: <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />,
  reviewed: <span className="w-2 h-2 rounded-full bg-brand-400 inline-block" />,
  approved: <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />,
  executing: <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse inline-block" />,
  executed: <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />,
  failed: <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />,
  discarded: <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />,
  reopened: <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />,
}

const TRACE_LABELS: Record<ActionTraceEvent['event'], string> = {
  created: 'Acción creada',
  reviewed: 'Marcada para revisión',
  approved: 'Aprobada',
  executing: 'Ejecución iniciada',
  executed: 'Ejecutada correctamente',
  failed: 'Falló la ejecución',
  discarded: 'Descartada',
  reopened: 'Reabierta',
}

const RISK_CONFIG = {
  high: { icon: ShieldAlert, color: 'text-red-400', label: 'Riesgo alto', bg: 'bg-red-500/10 border-red-500/20' },
  medium: { icon: Shield, color: 'text-amber-400', label: 'Riesgo medio', bg: 'bg-amber-500/10 border-amber-500/20' },
  low: { icon: ShieldCheck, color: 'text-emerald-400', label: 'Riesgo bajo', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  none: { icon: ShieldCheck, color: 'text-slate-500', label: 'Sin riesgo', bg: 'bg-white border-slate-200' },
}

const MODULE_REDIRECT: Record<string, string> = {
  gsc: '/dashboard/seo',
  editorial: '/dashboard/editorial',
  cannibalization: '/dashboard/seo',
  interlinking: '/dashboard/interlinking',
  batch: '/dashboard/batch',
  wordpress: '/dashboard/improve',
  site_analysis: '/dashboard/seo',
}

export default function ActionDetailPanel({ action, onClose, onStatusChange }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const canApprove = action ? ['pending', 'reviewed'].includes(action.status) : false
  const canDiscard = action ? ['pending', 'reviewed', 'approved'].includes(action.status) : false
  const canExecute = action?.status === 'approved'
  const canReopen = action ? ['executed', 'discarded', 'failed'].includes(action.status) : false

  function formatDateTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function handleStatus(status: SEOAction['status']) {
    if (!action) return
    await onStatusChange(action.id, status)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          action ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          fixed right-0 top-0 h-full w-full max-w-[560px] bg-white border-l border-slate-200
          z-50 flex flex-col shadow-2xl shadow-black/50
          transform transition-transform duration-300 ease-out
          ${action ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {!action ? null : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <ActionTypeBadge type={action.type} size="md" />
                  <ActionPriorityBadge priority={action.priority} size="md" />
                </div>
                <ActionStatusBadge status={action.status} size="md" />
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shrink-0 ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Contexto */}
              <div className="space-y-3">
                {action.keyword && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Keyword</p>
                    <p className="text-base font-semibold text-slate-900">{action.keyword}</p>
                  </div>
                )}
                {action.url && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">URL</p>
                    <a
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 break-all"
                    >
                      {action.url}
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {action.category && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Categoría</p>
                      <p className="text-sm text-slate-700">{action.category}</p>
                    </div>
                  )}
                  {action.branch && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Rama temática</p>
                      <p className="text-sm text-slate-700">{action.branch}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Módulo origen</p>
                    <p className="text-sm text-slate-700">{ACTION_SOURCE_LABELS[action.sourceModule]}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Detectado</p>
                    <p className="text-sm text-slate-700">{formatDateTime(action.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Razón */}
              <div className="rounded-xl bg-white/60 border border-slate-200 p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Razón de la recomendación</p>
                <p className="text-sm text-slate-800 leading-relaxed">{action.reason}</p>
              </div>

              {/* Explicación */}
              {action.explanation && (
                <div className="rounded-xl bg-brand-500/5 border border-brand-500/20 p-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-brand-400">Qué hacer</p>
                  <p className="text-sm text-slate-800 leading-relaxed">{action.explanation}</p>
                </div>
              )}

              {/* Riesgo */}
              {(() => {
                const rc = RISK_CONFIG[action.riskLevel]
                const RiskIcon = rc.icon
                return (
                  <div className={`flex items-start gap-3 rounded-xl border p-4 ${rc.bg}`}>
                    <RiskIcon className={`w-5 h-5 mt-0.5 shrink-0 ${rc.color}`} />
                    <div>
                      <p className={`text-sm font-semibold ${rc.color}`}>{rc.label}</p>
                      {action.conflictDetails && (
                        <p className="text-xs text-slate-600 mt-1">{action.conflictDetails}</p>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Advertencias */}
              {action.warnings && action.warnings.length > 0 && (
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Advertencias</p>
                  </div>
                  <ul className="space-y-1.5">
                    {action.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Datos fuente */}
              {action.sourceData && Object.keys(action.sourceData).length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Datos del módulo origen</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(action.sourceData).map(([key, val]) => (
                      <div key={key} className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{key}</p>
                        <p className="text-sm font-medium text-slate-800 mt-0.5">
                          {typeof val === 'number'
                            ? key.toLowerCase().includes('ctr')
                              ? `${(val * 100).toFixed(1)}%`
                              : key.toLowerCase().includes('position')
                              ? val.toFixed(1)
                              : val.toLocaleString()
                            : String(val)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resultado de ejecución */}
              {action.executionResult && (
                <div className="rounded-xl bg-teal-500/5 border border-teal-500/20 p-4 space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-teal-400">Resultado</p>
                  <p className="text-sm text-slate-800">{action.executionResult}</p>
                </div>
              )}

              {action.executionError && (
                <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-red-400">Error en ejecución</p>
                  <p className="text-sm text-slate-700">{action.executionError}</p>
                </div>
              )}

              {/* Timeline de trazabilidad */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Historial de la acción</p>
                <div className="space-y-3">
                  {[...action.trace].reverse().map((event, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        {TRACE_ICONS[event.event]}
                        {i < action.trace.length - 1 && (
                          <div className="w-px h-4 bg-slate-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-700">
                            {TRACE_LABELS[event.event]}
                          </span>
                          {event.by && (
                            <span className="text-[10px] text-slate-500">· {event.by}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-600" />
                          <span className="text-[10px] text-slate-600">{formatDateTime(event.timestamp)}</span>
                        </div>
                        {event.note && (
                          <p className="text-xs text-slate-500 mt-1 italic">{event.note}</p>
                        )}
                        {event.result && (
                          <p className="text-xs text-teal-400 mt-1">{event.result}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer — botones de acción */}
            <div className="p-5 border-t border-slate-200 space-y-3">
              {/* Ejecutar → redirige al módulo */}
              {canExecute && (
                <a
                  href={MODULE_REDIRECT[action.sourceModule] || '/dashboard'}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-brand-900/30 active:scale-95"
                >
                  <Play className="w-4 h-4" />
                  Ir al módulo para ejecutar
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}

              <div className="flex items-center gap-2">
                {canApprove && (
                  <button
                    onClick={() => handleStatus('approved')}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-medium text-sm rounded-xl border border-emerald-500/20 transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    Aprobar
                  </button>
                )}

                {['pending', 'approved'].includes(action.status) && (
                  <button
                    onClick={() => handleStatus('reviewed')}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 font-medium text-sm rounded-xl border border-brand-500/20 transition-all active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Revisión
                  </button>
                )}

                {canDiscard && (
                  <button
                    onClick={() => handleStatus('discarded')}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 font-medium text-sm rounded-xl border border-red-500/20 transition-all active:scale-95"
                  >
                    <X className="w-4 h-4" />
                    Descartar
                  </button>
                )}

                {canReopen && (
                  <button
                    onClick={() => handleStatus('pending')}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-medium text-sm rounded-xl border border-amber-500/20 transition-all active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reabrir
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
              >
                Cerrar panel
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
