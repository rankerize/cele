'use client'

import { useState, useEffect, useRef } from 'react'
import { TargetPageData, SourcePageData, FullRecommendation } from '@/types/interlinking'
import {
  Layers, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  Zap, RotateCcw, X, Edit3, Check, ArrowLeft, Info, Shield
} from 'lucide-react'

interface BatchResult {
  target: TargetPageData
  recommendation: FullRecommendation | null
  error?: string
  executedIdxs?: number[]
  editingAnchor?: { sourceIdx: number; value: string } | null
}

interface BatchSummary {
  total: number
  approved: number
  review: number
  discarded: number
}

interface Props {
  targets: TargetPageData[]
  sources: SourcePageData[]
  onBack: () => void
}

type Phase = 'analyzing' | 'ready' | 'error'

function OpportunityBadge({ level }: { level?: 'high' | 'medium' | 'low' }) {
  if (!level) return null
  const styles = {
    high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
  }
  const labels = { high: 'Alta', medium: 'Media', low: 'Baja' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[level]}`}>
      {labels[level]}
    </span>
  )
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'text-emerald-400 bg-emerald-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    low: 'text-slate-600 bg-slate-500/10',
  }
  const labels = { high: 'Alta', medium: 'Media', low: 'Baja' }
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${styles[level]}`}>{labels[level]}</span>
}

export default function BatchProgress({ targets, sources, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('analyzing')
  const [results, setResults] = useState<BatchResult[]>([])
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [executingMap, setExecutingMap] = useState<Record<number, number | null>>({}) // resultIdx -> sourceIdx
  const [doneMap, setDoneMap] = useState<Record<number, number[]>>({}) // resultIdx -> [sourceIdx]
  const [errorMap, setErrorMap] = useState<Record<number, Record<number, string>>>({})
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    runBatch()
  }, [])

  async function runBatch() {
    setPhase('analyzing')
    setError(null)
    try {
      const res = await fetch('/api/interlinking/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets, sources }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Error en el análisis')
      
      const batchResults: BatchResult[] = data.results.map((r: any) => ({
        target: r.target,
        recommendation: r.recommendation,
        error: r.error,
        executedIdxs: [],
        editingAnchor: null,
      }))
      setResults(batchResults)
      setSummary(data.summary)
      setPhase('ready')
    } catch (e: any) {
      setError(e.message)
      setPhase('error')
    }
  }

  async function handleExecuteOne(resultIdx: number, sourceIdx: number) {
    const rec = results[resultIdx]?.recommendation?.recommendedSourcePages[sourceIdx]
    if (!rec) return
    const editingKey = `${resultIdx}-${sourceIdx}`
    const anchor = results[resultIdx]?.editingAnchor?.sourceIdx === sourceIdx
      ? results[resultIdx].editingAnchor!.value
      : rec.recommendedAnchorTexts[0]

    setExecutingMap(prev => ({ ...prev, [resultIdx]: sourceIdx }))
    try {
      const res = await fetch('/api/interlinking/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePostId: rec.sourceId,
          targetUrl: results[resultIdx].target.url,
          anchorText: anchor,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al ejecutar')
      setDoneMap(prev => ({ ...prev, [resultIdx]: [...(prev[resultIdx] || []), sourceIdx] }))
    } catch (e: any) {
      setErrorMap(prev => ({
        ...prev,
        [resultIdx]: { ...(prev[resultIdx] || {}), [sourceIdx]: e.message }
      }))
    } finally {
      setExecutingMap(prev => ({ ...prev, [resultIdx]: null }))
    }
  }

  function updateAnchor(resultIdx: number, sourceIdx: number, value: string) {
    setResults(prev => prev.map((r, i) =>
      i === resultIdx ? { ...r, editingAnchor: { sourceIdx, value } } : r
    ))
  }

  const approved = results.filter(r => r.recommendation?.nextAction === 'approve').length
  const pending = results.filter(r => r.recommendation?.nextAction === 'review').length
  const discarded = results.filter(r => !r.recommendation || r.recommendation.nextAction === 'discard' || r.error).length
  const totalDoneLinks = Object.values(doneMap).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-400">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-white transition-all border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-400" />
              Análisis en Lote
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {targets.length} páginas · {phase === 'analyzing' ? 'Procesando con IA...' : `${results.length} resultados`}
            </p>
          </div>
        </div>

        {phase === 'error' && (
          <button
            onClick={() => { hasFetched.current = false; runBatch() }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-white bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Reintentar
          </button>
        )}
      </div>

      {/* Analyzing skeleton */}
      {phase === 'analyzing' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-violet-500/20">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Analizando {targets.length} páginas con IA…</p>
              <p className="text-slate-500 text-sm mt-1">
                Ejecutando las 3 capas: priorización → fuentes → anchors. Esto puede tomar unos segundos.
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {targets.slice(0, 6).map((t, i) => (
                  <span key={i} className="text-[10px] text-violet-400/60 bg-violet-500/8 border border-violet-500/15 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                    {t.title.slice(0, 25)}…
                  </span>
                ))}
                {targets.length > 6 && (
                  <span className="text-[10px] text-slate-600 px-2 py-0.5">+{targets.length - 6} más</span>
                )}
              </div>
            </div>
          </div>
          {/* Progress skeletons */}
          {Array.from({ length: Math.min(targets.length, 5) }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white border border-slate-200 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}

      {/* Error state */}
      {phase === 'error' && error && (
        <div className="flex items-start gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Error en el análisis en lote</p>
            <p className="text-sm text-red-400/70 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {phase === 'ready' && results.length > 0 && (
        <div className="space-y-5">
          {/* Summary bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total analizadas', value: results.length, color: 'text-white', bg: 'bg-white border-slate-200' },
              { label: 'Aprobadas (Alta prioridad)', value: approved, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
              { label: 'Revisar', value: pending, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20' },
              { label: 'Descartadas', value: discarded, color: 'text-slate-500', bg: 'bg-white border-slate-200' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`p-4 rounded-xl border ${bg}`}>
                <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-600 mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {totalDoneLinks > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-sm text-emerald-300 font-semibold">
                {totalDoneLinks} enlace{totalDoneLinks !== 1 ? 's' : ''} insertado{totalDoneLinks !== 1 ? 's' : ''} en WordPress
              </p>
            </div>
          )}

          {/* Result cards */}
          <div className="space-y-3">
            {results.map((result, resultIdx) => {
              const rec = result.recommendation
              const isExpanded = expandedIdx === resultIdx
              const isDone = !rec || rec.nextAction === 'discard' || !!result.error
              const doneSources = doneMap[resultIdx] || []

              const statusIcon = result.error
                ? <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                : !rec || rec.nextAction === 'discard'
                  ? <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0" />
                  : rec.opportunityLevel === 'high'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    : <Zap className="w-4 h-4 text-amber-400 shrink-0" />

              return (
                <div
                  key={result.target.url}
                  className={`rounded-2xl border transition-all duration-200 ${
                    isExpanded
                      ? 'border-violet-500/30 bg-white/80'
                      : result.error || !rec || rec.nextAction === 'discard'
                        ? 'border-slate-200 bg-white/30 opacity-60'
                        : 'border-slate-200 bg-white/60'
                  }`}
                >
                  {/* Card header */}
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : resultIdx)}
                    disabled={!rec || rec.nextAction === 'discard' || !!result.error}
                    className="w-full flex items-center gap-3 p-4 text-left disabled:cursor-default"
                  >
                    {statusIcon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white truncate max-w-[320px]">{result.target.title}</p>
                        <OpportunityBadge level={rec?.opportunityLevel} />
                      </div>
                      {result.error && <p className="text-xs text-red-400/70 mt-0.5">{result.error}</p>}
                      {rec && !result.error && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[400px]">{rec.reasoning.slice(0, 80)}…</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {rec && rec.recommendedSourcePages.length > 0 && (
                        <span className="text-xs text-slate-500">
                          {doneSources.length}/{rec.recommendedSourcePages.length} ejecutadas
                        </span>
                      )}
                      {!isDone && (
                        isExpanded
                          ? <ChevronUp className="w-4 h-4 text-slate-500" />
                          : <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {/* Expanded: source recommendations */}
                  {isExpanded && rec && rec.nextAction !== 'discard' && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-200 space-y-4">
                      {/* Reasoning */}
                      <div className="flex items-start gap-2 text-xs text-slate-600">
                        <Info className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                        <p>{rec.reasoning}</p>
                      </div>

                      {/* Warnings */}
                      {rec.generalWarnings?.length > 0 && (
                        <div className="flex items-start gap-2 p-2 bg-amber-500/8 border border-amber-500/15 rounded-lg">
                          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <ul className="space-y-0.5">
                            {rec.generalWarnings.map((w, i) => (
                              <li key={i} className="text-xs text-amber-400/80">{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Source pages */}
                      {rec.recommendedSourcePages.length === 0 && (
                        <p className="text-xs text-slate-600 italic">No se encontraron páginas fuente adecuadas.</p>
                      )}

                      <div className="space-y-3">
                        {rec.recommendedSourcePages.map((source, sourceIdx) => {
                          const isDone = doneSources.includes(sourceIdx)
                          const isExec = executingMap[resultIdx] === sourceIdx
                          const execError = errorMap[resultIdx]?.[sourceIdx]
                          const editingForThis = results[resultIdx]?.editingAnchor?.sourceIdx === sourceIdx
                          const currentAnchor = editingForThis
                            ? results[resultIdx].editingAnchor!.value
                            : source.recommendedAnchorTexts[0] || ''

                          return (
                            <div key={sourceIdx} className={`rounded-xl border p-3 transition-all ${isDone ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-200 bg-white/40'}`}>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-white truncate">{source.sourceTitle}</p>
                                  <p className="text-[10px] text-slate-600 truncate">{source.sourceUrl}</p>
                                </div>
                                <ConfidenceBadge level={source.confidence} />
                              </div>

                              {/* Anchors */}
                              <div className="flex items-center gap-2 mb-2">
                                <Edit3 className="w-3 h-3 text-slate-500 shrink-0" />
                                <input
                                  type="text"
                                  value={currentAnchor}
                                  onChange={e => updateAnchor(resultIdx, sourceIdx, e.target.value)}
                                  className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-violet-500/50"
                                  placeholder="Anchor text..."
                                />
                              </div>

                              {execError && <p className="text-[10px] text-red-400 mb-2">{execError}</p>}

                              {isDone ? (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                                  <Check className="w-3.5 h-3.5" /> Enlace insertado
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleExecuteOne(resultIdx, sourceIdx)}
                                  disabled={isExec || !source.sourceId}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-violet-600/20 hover:bg-violet-600/40 disabled:opacity-50 text-violet-300 hover:text-violet-200 text-xs font-semibold rounded-lg transition-all border border-violet-500/20"
                                >
                                  {isExec
                                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Insertando…</>
                                    : <><Zap className="w-3 h-3" /> Insertar enlace</>
                                  }
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
