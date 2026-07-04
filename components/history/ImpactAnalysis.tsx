'use client'

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Loader2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Eye,
  MousePointerClick,
  Percent,
  Zap,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

interface ImpactData {
  itemId: string
  postUrl: string
  improvedAt: string
  before: {
    impressions: number
    clicks: number
    position: number
    ctr: string
  } | null
  current: {
    impressions: number
    clicks: number
    position: string
    ctr: string
  }
  delta: {
    position: string | null
    impressions: number | null
    clicks: number | null
    ctr: string | null
  } | null
  impactScore: number
  topQueries: { query: string; impressions: number; clicks: number; position: number; ctr: string }[]
  windowDays: number
}

interface Props {
  historyItemId: string
  postUrl: string
  onClose: () => void
}

function ScoreGauge({ score }: { score: number }) {
  const getScoreConfig = (s: number) => {
    if (s >= 70) return { label: 'Excelente', color: 'text-emerald-400', bar: 'bg-emerald-500', ring: 'stroke-emerald-500' }
    if (s >= 50) return { label: 'Positivo', color: 'text-brand-400', bar: 'bg-brand-500', ring: 'stroke-brand-500' }
    if (s >= 30) return { label: 'Neutro', color: 'text-amber-400', bar: 'bg-amber-500', ring: 'stroke-amber-500' }
    return { label: 'Por mejorar', color: 'text-red-400', bar: 'bg-red-500', ring: 'stroke-red-500' }
  }
  const cfg = getScoreConfig(score)
  const circum = 2 * Math.PI * 40
  const offset = circum - (score / 100) * circum

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-400" />
          <circle
            cx="48" cy="48" r="40" fill="none"
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circum}
            strokeDashoffset={offset}
            className={`transition-all duration-1000 ease-out ${cfg.ring}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${cfg.color}`}>{score}</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
      <span className="text-[10px] text-slate-500">Score de Impacto SEO</span>
    </div>
  )
}

function DeltaBadge({ value, unit = '', inverse = false }: { value: number | string | null, unit?: string, inverse?: boolean }) {
  if (value === null || value === undefined) return <span className="text-xs text-slate-500">N/A</span>
  const numVal = parseFloat(String(value))
  const isPositive = inverse ? numVal < 0 : numVal > 0
  const isNeutral = numVal === 0

  if (isNeutral) return (
    <span className="flex items-center gap-0.5 text-slate-600 text-xs font-medium">
      <Minus className="w-3 h-3" /> Sin cambio
    </span>
  )

  return (
    <span className={`flex items-center gap-0.5 text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
      {isPositive && numVal > 0 ? '+' : ''}{value}{unit}
    </span>
  )
}

function MetricCard({
  icon: Icon,
  label,
  before,
  current,
  delta,
  unit = '',
  inversePositive = false,
}: {
  icon: any; label: string; before: string | number | null; current: string | number; delta: string | number | null; unit?: string; inversePositive?: boolean
}) {
  return (
    <div className="bg-white/50 border border-slate-200/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-slate-600" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-black text-slate-900">{current}{unit}</div>
          {before !== null && (
            <div className="text-[10px] text-slate-600 mt-0.5">Antes: {before}{unit}</div>
          )}
        </div>
        <DeltaBadge value={delta} unit={unit} inverse={inversePositive} />
      </div>
    </div>
  )
}

export default function ImpactAnalysis({ historyItemId, postUrl, onClose }: Props) {
  const [data, setData] = useState<ImpactData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const fetchImpact = async () => {
    if (loaded) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/history/${historyItemId}/impact`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json.data)
      setLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar métricas')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch when rendered
  if (!loading && !loaded && !error) {
    fetchImpact()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-600/10 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900">Panel de Impacto SEO</h2>
              <p className="text-[10px] text-slate-500">Comparativa Antes vs. Ahora · Últimos 30 días</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* URL */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ExternalLink className="w-3 h-3 shrink-0" />
            <a href={postUrl} target="_blank" rel="noreferrer" className="hover:text-brand-400 transition-colors truncate">
              {postUrl}
            </a>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
              <div className="text-center">
                <p className="text-slate-700 font-medium">Consultando Google Search Console...</p>
                <p className="text-xs text-slate-500 mt-1">Comparando métricas del período</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">{error}</p>
                {error.includes('GSC') && (
                  <p className="text-xs text-red-500 mt-1">Asegúrate de que Google Search Console esté conectado en la configuración.</p>
                )}
                {error.includes('no tiene URL') && (
                  <p className="text-xs text-red-500 mt-1">Este item de historial no tiene una URL de WordPress asociada. Solo los posts actualizados tienen análisis de impacto.</p>
                )}
              </div>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Score + No-before warning */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gradient-to-br from-purple-600/10 via-white/50 to-white border border-purple-500/20 rounded-2xl">
                <ScoreGauge score={data.impactScore} />
                <div className="flex-1 space-y-2">
                  {data.before === null ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Sin datos de "Antes" registrados
                      </p>
                      <p className="text-[11px] text-amber-500/70 mt-1">
                        Este artículo se mejoró sin métricas GSC previas. El score refleja solo el rendimiento actual. Futuros artículos guardarán el snapshot automáticamente.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Estas métricas comparan el rendimiento registrado al momento de la mejora con los datos más recientes de Google Search Console (últimos {data.windowDays} días).
                    </p>
                  )}
                  <div className="text-[10px] text-slate-600 pt-1">
                    Mejorado el {new Date(data.improvedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={Eye}
                  label="Impresiones"
                  before={data.before?.impressions ?? null}
                  current={data.current.impressions.toLocaleString()}
                  delta={data.delta?.impressions ?? null}
                />
                <MetricCard
                  icon={MousePointerClick}
                  label="Clics"
                  before={data.before?.clicks ?? null}
                  current={data.current.clicks.toLocaleString()}
                  delta={data.delta?.clicks ?? null}
                />
                <MetricCard
                  icon={Target}
                  label="Posición Media"
                  before={data.before ? Math.round(data.before.position) : null}
                  current={data.current.position}
                  delta={data.delta?.position ?? null}
                  inversePositive={true}
                />
                <MetricCard
                  icon={Percent}
                  label="CTR"
                  before={data.before?.ctr ?? null}
                  current={data.current.ctr}
                  delta={data.delta?.ctr ?? null}
                  unit="%"
                />
              </div>

              {/* Top Queries */}
              {data.topQueries.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Queries que generan tráfico ahora
                  </h3>
                  <div className="space-y-1.5">
                    {data.topQueries.map((q, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 bg-white/40 border border-slate-200/40 rounded-lg">
                        <span className="text-[10px] font-black text-slate-600 w-4 shrink-0">#{i + 1}</span>
                        <span className="text-xs text-slate-700 flex-1 truncate font-medium">{q.query}</span>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 shrink-0">
                          <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{q.impressions}</span>
                          <span className="flex items-center gap-0.5 text-brand-400"><MousePointerClick className="w-2.5 h-2.5" />{q.clicks}</span>
                          <span className="flex items-center gap-0.5"><Target className="w-2.5 h-2.5" />{Math.round(q.position)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 shrink-0">
          <button onClick={onClose} className="w-full btn-secondary py-2 text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
