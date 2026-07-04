'use client'

import { useState } from 'react'
import { TargetPageData, SourcePageData, FullRecommendation } from '@/types/interlinking'
import {
  X, Zap, AlertTriangle, CheckCircle2, ExternalLink, ChevronDown,
  ChevronUp, Edit3, Loader2, Check, RotateCcw, Info, Shield, TrendingUp
} from 'lucide-react'

interface Props {
  target: TargetPageData
  sources: SourcePageData[]
  onClose: () => void
}

type ExecutionState = 'idle' | 'loading_recommendation' | 'ready' | 'executing' | 'done' | 'error'

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
  }
  const labels = { high: 'Alta confianza', medium: 'Confianza media', low: 'Baja confianza' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[level]}`}>
      {labels[level]}
    </span>
  )
}

function OpportunityBadge({ level }: { level?: 'high' | 'medium' | 'low' }) {
  if (!level) return null
  const styles = {
    high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
  }
  const labels = { high: 'Oportunidad Alta', medium: 'Oportunidad Media', low: 'Oportunidad Baja' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${styles[level]}`}>
      {labels[level]}
    </span>
  )
}

export default function OpportunityDetail({ target, sources, onClose }: Props) {
  const [state, setState] = useState<ExecutionState>('idle')
  const [recommendation, setRecommendation] = useState<FullRecommendation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0)
  const [editingAnchor, setEditingAnchor] = useState<{ sourceIdx: number; value: string } | null>(null)
  const [executingIdx, setExecutingIdx] = useState<number | null>(null)
  const [doneIdxs, setDoneIdxs] = useState<number[]>([])
  const [errorIdxs, setErrorIdxs] = useState<Record<number, string>>({})

  async function handleGenerateRecommendation() {
    setState('loading_recommendation')
    setError(null)
    try {
      const res = await fetch('/api/interlinking/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, sources }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al generar recomendación')
      setRecommendation(data.recommendation)
      setState('ready')
    } catch (e: any) {
      setError(e.message)
      setState('error')
    }
  }

  async function handleExecute(sourceIdx: number) {
    if (!recommendation) return
    const rec = recommendation.recommendedSourcePages[sourceIdx]
    if (!rec) return

    const anchor = editingAnchor?.sourceIdx === sourceIdx
      ? editingAnchor.value
      : rec.recommendedAnchorTexts[0]

    setExecutingIdx(sourceIdx)
    try {
      const res = await fetch('/api/interlinking/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePostId: rec.sourceId,
          targetUrl: target.url,
          anchorText: anchor,
          placement: rec.recommendedPlacement,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al ejecutar')
      setDoneIdxs(prev => [...prev, sourceIdx])
    } catch (e: any) {
      setErrorIdxs(prev => ({ ...prev, [sourceIdx]: e.message }))
    } finally {
      setExecutingIdx(null)
    }
  }

  const positionColor = target.position <= 3 ? 'text-emerald-400' :
    target.position <= 10 ? 'text-amber-400' :
    target.position <= 20 ? 'text-orange-400' : 'text-slate-600'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="h-full w-full max-w-2xl bg-slate-50 border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-white">Detalle de Oportunidad</h2>
              <p className="text-xs text-slate-500 truncate max-w-[300px]">{target.url}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Resumen SEO */}
          <div className="rounded-2xl border border-slate-200 bg-white/60 p-5">
            <h3 className="font-display text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Resumen SEO</h3>
            <p className="text-base font-bold text-white mb-3">{target.title}</p>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-white rounded-xl border border-slate-200">
                <p className="text-lg font-bold text-white tabular-nums">{target.impressions.toLocaleString()}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Impresiones</p>
              </div>
              <div className="text-center p-3 bg-white rounded-xl border border-slate-200">
                <p className="text-lg font-bold text-white tabular-nums">{target.clicks.toLocaleString()}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Clics</p>
              </div>
              <div className="text-center p-3 bg-white rounded-xl border border-slate-200">
                <p className="text-lg font-bold text-white tabular-nums">{(target.ctr * 100).toFixed(1)}%</p>
                <p className="text-[10px] text-slate-600 mt-0.5">CTR</p>
              </div>
              <div className="text-center p-3 bg-white rounded-xl border border-slate-200">
                <p className={`text-lg font-bold tabular-nums ${positionColor}`}>#{Math.round(target.position)}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Posición</p>
              </div>
            </div>
            {target.category && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="bg-white text-slate-600 px-2 py-0.5 rounded-md">{target.category}</span>
                {target.keywords?.[0] && (
                  <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-md">
                    {target.keywords[0]}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* CTA para generar recomendación */}
          {state === 'idle' && (
            <button
              onClick={handleGenerateRecommendation}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-brand-500/20 text-sm"
            >
              <Zap className="w-4 h-4" />
              Generar análisis estratégico con IA
            </button>
          )}

          {state === 'loading_recommendation' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              <div className="text-center">
                <p className="text-white font-semibold text-sm">Analizando con IA…</p>
                <p className="text-slate-500 text-xs mt-1">Cruzando datos de GSC, WordPress y contexto editorial</p>
              </div>
              <div className="flex gap-2 mt-2">
                {['Priorizando URL', 'Seleccionando fuentes', 'Generando anchors'].map((step, i) => (
                  <span key={i} className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                    {step}
                  </span>
                ))}
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">Error al generar análisis</p>
                <p className="text-xs text-red-400/70 mt-1">{error}</p>
                <button onClick={handleGenerateRecommendation} className="mt-2 text-xs text-red-300 hover:text-red-200 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Reintentar
                </button>
              </div>
            </div>
          )}

          {state === 'ready' && recommendation && (
            <div className="space-y-5 animate-in fade-in duration-400">
              {/* Resumen recomendación */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-brand-400" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Justificación estratégica</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{recommendation.reasoning}</p>
                </div>
                <OpportunityBadge level={recommendation.opportunityLevel} />
              </div>

              {/* Advertencias generales */}
              {recommendation.generalWarnings?.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-400 mb-1.5">Advertencias editoriales</p>
                    <ul className="space-y-1">
                      {recommendation.generalWarnings.map((w, i) => (
                        <li key={i} className="text-xs text-amber-400/70">{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Páginas fuente recomendadas */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-display text-sm font-bold text-white">Páginas fuente recomendadas</h3>
                  <span className="text-xs text-slate-600 bg-white px-2 py-0.5 rounded-full">
                    {recommendation.recommendedSourcePages.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {recommendation.recommendedSourcePages.map((rec, idx) => {
                    const isExpanded = expandedIdx === idx
                    const isDone = doneIdxs.includes(idx)
                    const isExec = executingIdx === idx
                    const execError = errorIdxs[idx]
                    const currentAnchor = editingAnchor?.sourceIdx === idx
                      ? editingAnchor.value
                      : rec.recommendedAnchorTexts[0] || ''

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border transition-all duration-200 ${
                          isDone ? 'border-emerald-500/30 bg-emerald-500/5' :
                          isExpanded ? 'border-brand-500/40 bg-white/80' :
                          'border-slate-200 bg-white/60'
                        }`}
                      >
                        {/* Row header */}
                        <button
                          onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                          className="w-full flex items-center gap-3 p-3.5 text-left"
                        >
                          {isDone
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            : <div className="w-4 h-4 rounded-full border-2 border-slate-600 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{rec.sourceTitle}</p>
                            <p className="text-xs text-slate-600 truncate">{rec.sourceUrl}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <ConfidenceBadge level={rec.confidence} />
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4">
                            {/* Justificación */}
                            <div className="flex items-start gap-2 text-xs text-slate-600">
                              <Info className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                              <p>{rec.reason}</p>
                            </div>

                            {/* Relación temática */}
                            <div className="bg-white/60 rounded-lg p-3">
                              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Relación temática</p>
                              <p className="text-xs text-slate-700">{rec.thematicRelation}</p>
                            </div>

                            {/* Anchor texts */}
                            <div>
                              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
                                Anchor text <span className="text-brand-400">(editable)</span>
                              </p>
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                {rec.recommendedAnchorTexts.map((anchor, ai) => (
                                  <button
                                    key={ai}
                                    onClick={() => setEditingAnchor({ sourceIdx: idx, value: anchor })}
                                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                                      currentAnchor === anchor
                                        ? 'bg-brand-600/30 border-brand-500/40 text-brand-300'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-600'
                                    }`}
                                  >
                                    {anchor}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <input
                                  type="text"
                                  value={currentAnchor}
                                  onChange={e => setEditingAnchor({ sourceIdx: idx, value: e.target.value })}
                                  className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand-500/50"
                                  placeholder="Personaliza el anchor text..."
                                />
                              </div>
                            </div>

                            {/* Placement */}
                            <div className="text-xs text-slate-500">
                              <span className="text-slate-600">Ubicación sugerida:</span>{' '}
                              <span className="text-slate-700">{rec.recommendedPlacement}</span>
                            </div>

                            {/* Advertencias */}
                            {rec.warnings?.length > 0 && (
                              <div className="flex items-start gap-2 p-2 bg-amber-500/8 border border-amber-500/15 rounded-lg">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <ul className="space-y-0.5">
                                  {rec.warnings.map((w, wi) => (
                                    <li key={wi} className="text-xs text-amber-400/80">{w}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Error ejecución */}
                            {execError && (
                              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                                {execError}
                              </div>
                            )}

                            {/* Botón ejecutar */}
                            {isDone ? (
                              <div className="flex items-center gap-2 text-sm text-emerald-400 font-semibold">
                                <Check className="w-4 h-4" /> Enlace insertado correctamente
                              </div>
                            ) : (
                              <button
                                onClick={() => handleExecute(idx)}
                                disabled={isExec || !rec.sourceId}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all duration-200"
                              >
                                {isExec
                                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Insertando enlace...</>
                                  : <><Zap className="w-4 h-4" /> Insertar enlace interno</>
                                }
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Páginas a evitar */}
              {recommendation.pagesToAvoid?.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider">Páginas a evitar</h4>
                  </div>
                  <ul className="space-y-2">
                    {recommendation.pagesToAvoid.map((p, i) => (
                      <li key={i} className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-600 truncate">{p.sourceUrl}</span>
                        <span className="text-xs text-red-400/60">{p.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Regenerar */}
              <button
                onClick={handleGenerateRecommendation}
                className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Regenerar análisis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
