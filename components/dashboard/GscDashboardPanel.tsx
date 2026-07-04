'use client'

import { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, Minus, Target, BarChart3, Globe, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface WeeklyPoint {
  week: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface BandData {
  count: number
  clicks: number
  impressions: number
  topKeywords?: { query: string; position: number; clicks: number; impressions: number }[]
}

interface DashboardStats {
  period: {
    current: { start: string; end: string }
    previous: { start: string; end: string }
  }
  totals: { keywords: number; clicks: number; impressions: number; ctr: number; avgPosition: number }
  prevTotals: { keywords: number; clicks: number; impressions: number; avgPosition: number }
  bands: { top3: BandData; pos4to10: BandData; pos10plus: BandData }
  chart: { current: WeeklyPoint[]; previous: WeeklyPoint[] }
  siteUrl: string
}

function pct(a: number, b: number): number {
  if (b === 0) return 0
  return ((a - b) / b) * 100
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

function Trend({ current, previous, inverted = false }: { current: number; previous: number; inverted?: boolean }) {
  const diff = pct(current, previous)
  if (previous === 0) return null
  const positive = inverted ? diff < 0 : diff > 0
  const neutral = Math.abs(diff) < 0.5
  if (neutral) return (
    <span className="inline-flex items-center gap-0.5 text-xs text-slate-500">
      <Minus className="w-3 h-3" /> 0%
    </span>
  )
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(diff).toFixed(1)}%
    </span>
  )
}

// ── Gráfico SVG de líneas ──────────────────────────────────────────────────
function LineChart({ current, previous, metric }: { current: WeeklyPoint[]; previous: WeeklyPoint[]; metric: 'clicks' | 'impressions' }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; curr: number; prev: number; week: string } | null>(null)

  const W = 680, H = 200, PL = 50, PR = 20, PT = 16, PB = 36
  const innerW = W - PL - PR
  const innerH = H - PT - PB

  if (current.length < 2) return (
    <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
      Datos insuficientes para mostrar el gráfico.
    </div>
  )

  const len = current.length
  const maxVal = Math.max(
    ...current.map(p => p[metric]),
    ...previous.slice(0, len).map(p => p[metric])
  ) * 1.1 || 1

  const x = (i: number) => PL + (i / (len - 1)) * innerW
  const y = (v: number) => PT + innerH - (v / maxVal) * innerH

  const pathFor = (points: WeeklyPoint[]) => {
    if (points.length < 2) return ''
    let d = `M ${x(0)} ${y(points[0][metric])}`
    for (let i = 1; i < Math.min(points.length, len); i++) {
      const x0 = x(i - 1), y0 = y(points[i - 1][metric])
      const x1 = x(i), y1 = y(points[i][metric])
      const cp1x = x0 + (x1 - x0) / 3
      const cp2x = x1 - (x1 - x0) / 3
      d += ` C ${cp1x} ${y0}, ${cp2x} ${y1}, ${x1} ${y1}`
    }
    return d
  }

  const areaFor = (points: WeeklyPoint[]) => {
    if (points.length < 2) return ''
    let d = `M ${x(0)} ${PT + innerH}`
    d += ` L ${x(0)} ${y(points[0][metric])}`
    for (let i = 1; i < Math.min(points.length, len); i++) {
      const x0 = x(i - 1), y0 = y(points[i - 1][metric])
      const x1 = x(i), y1 = y(points[i][metric])
      const cp1x = x0 + (x1 - x0) / 3
      const cp2x = x1 - (x1 - x0) / 3
      d += ` C ${cp1x} ${y0}, ${cp2x} ${y1}, ${x1} ${y1}`
    }
    d += ` L ${x(Math.min(points.length, len) - 1)} ${PT + innerH} Z`
    return d
  }

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    val: maxVal * t,
    yPos: PT + innerH * (1 - t)
  }))

  // X-axis labels (show ~6 evenly spaced)
  const labelStep = Math.max(1, Math.floor(len / 6))

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mouseX = (e.clientX - rect.left) * (W / rect.width)
    const idx = Math.round((mouseX - PL) / (innerW / (len - 1)))
    const clamped = Math.max(0, Math.min(len - 1, idx))
    setHoveredIdx(clamped)
    const cx = x(clamped)
    const cy = y(current[clamped][metric])
    setTooltip({
      x: cx,
      y: cy,
      curr: current[clamped][metric],
      prev: previous[clamped]?.[metric] ?? 0,
      week: current[clamped].week,
    })
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoveredIdx(null); setTooltip(null) }}
      >
        <defs>
          <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PL} y1={t.yPos} x2={W - PR} y2={t.yPos} stroke="#1e293b" strokeWidth="1" />
            <text x={PL - 6} y={t.yPos + 4} textAnchor="end" fontSize="9" fill="#64748b">
              {formatNum(Math.round(t.val))}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {current.map((p, i) => {
          if (i % labelStep !== 0 && i !== len - 1) return null
          const label = new Date(p.week + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
          return (
            <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#64748b">{label}</text>
          )
        })}

        {/* Previous year area + line */}
        <path d={areaFor(previous)} fill="url(#gradPrev)" />
        <path d={pathFor(previous)} fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />

        {/* Current year area + line */}
        <path d={areaFor(current)} fill="url(#gradCurrent)" />
        <path d={pathFor(current)} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />

        {/* Hover line */}
        {hoveredIdx !== null && (
          <>
            <line
              x1={x(hoveredIdx)} y1={PT}
              x2={x(hoveredIdx)} y2={PT + innerH}
              stroke="#6366f1" strokeWidth="1" strokeDasharray="3 2" opacity="0.5"
            />
            {/* Current dot */}
            <circle cx={x(hoveredIdx)} cy={y(current[hoveredIdx][metric])} r="5" fill="#6366f1" stroke="#0f172a" strokeWidth="2" />
            {/* Prev dot */}
            {previous[hoveredIdx] && (
              <circle cx={x(hoveredIdx)} cy={y(previous[hoveredIdx][metric])} r="4" fill="#475569" stroke="#0f172a" strokeWidth="2" />
            )}
          </>
        )}

        {/* Tooltip */}
        {tooltip && (() => {
          const diffVal = tooltip.prev > 0 ? pct(tooltip.curr, tooltip.prev) : null
          const boxW = 130, boxH = 56
          let bx = tooltip.x + 10
          if (bx + boxW > W - PR) bx = tooltip.x - boxW - 10
          const by = Math.max(PT, tooltip.y - boxH / 2)
          return (
            <g>
              <rect x={bx} y={by} width={boxW} height={boxH} rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
              <text x={bx + 8} y={by + 14} fontSize="9" fill="#94a3b8">
                {new Date(tooltip.week + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
              </text>
              <text x={bx + 8} y={by + 30} fontSize="11" fontWeight="600" fill="#e2e8f0">
                {formatNum(tooltip.curr)} {metric === 'impressions' ? 'imp' : 'clics'}
              </text>
              {diffVal !== null && (
                <text x={bx + 8} y={by + 46} fontSize="9" fill={diffVal >= 0 ? '#34d399' : '#f87171'}>
                  {diffVal >= 0 ? '▲' : '▼'} {Math.abs(diffVal).toFixed(1)}% vs año ant.
                </text>
              )}
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function GscDashboardPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chartMetric, setChartMetric] = useState<'clicks' | 'impressions'>('clicks')
  const [expandedBand, setExpandedBand] = useState<'top3' | 'pos4to10' | null>(null)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gsc/dashboard-stats')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setStats(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="card border border-slate-200 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-slate-50" />
        <div className="h-5 w-48 rounded bg-slate-50" />
        <div className="ml-auto h-4 w-20 rounded bg-slate-50" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white" />)}
      </div>
      <div className="h-[200px] rounded-xl bg-white" />
    </div>
  )

  if (error) return null // Si hay error, no mostrar nada (el dashboard aún funciona sin GSC)

  if (!stats) return null

  const { totals, prevTotals, bands, chart, period } = stats

  // ── Band cards config ──
  const bandCards = [
    {
      id: 'top3' as const,
      label: 'Top 1–3',
      sublabel: 'Posiciones élite',
      count: bands.top3.count,
      clicks: bands.top3.clicks,
      impressions: bands.top3.impressions,
      topKws: bands.top3.topKeywords,
      color: 'from-emerald-600/20 to-emerald-500/5 border-emerald-500/30',
      dotColor: 'bg-emerald-400',
      textColor: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      pill: 'bg-emerald-500/10 text-emerald-300',
    },
    {
      id: 'pos4to10' as const,
      label: 'Pos 4–10',
      sublabel: 'Primera página',
      count: bands.pos4to10.count,
      clicks: bands.pos4to10.clicks,
      impressions: bands.pos4to10.impressions,
      topKws: bands.pos4to10.topKeywords,
      color: 'from-brand-600/20 to-brand-500/5 border-brand-500/30',
      dotColor: 'bg-brand-400',
      textColor: 'text-brand-400',
      badgeColor: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
      pill: 'bg-brand-500/10 text-brand-300',
    },
    {
      id: 'pos10plus' as const,
      label: 'Pos +10',
      sublabel: 'Fuera de página 1',
      count: bands.pos10plus.count,
      clicks: bands.pos10plus.clicks,
      impressions: bands.pos10plus.impressions,
      topKws: undefined,
      color: 'from-amber-600/20 to-amber-500/5 border-amber-500/30',
      dotColor: 'bg-amber-400',
      textColor: 'text-amber-400',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
      pill: 'bg-amber-500/10 text-amber-300',
    },
  ]

  const totalKws = totals.keywords || 1

  return (
    <div className="space-y-5 animate-slide-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-slate-900">Rendimiento en Search Console</h2>
              <span className="text-[10px] bg-brand-600/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-full font-medium">LIVE</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              <Globe className="w-3 h-3 inline mr-1 opacity-60" />
              {stats.siteUrl} · últimas 4 semanas vs año anterior
            </p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          className="btn-secondary px-2.5 py-1.5 text-xs"
          title="Actualizar datos"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Keywords totales', curr: totals.keywords, prev: prevTotals.keywords, display: formatNum(totals.keywords), icon: Target },
          { label: 'Clics', curr: totals.clicks, prev: prevTotals.clicks, display: formatNum(totals.clicks), icon: TrendingUp },
          { label: 'Impresiones', curr: totals.impressions, prev: prevTotals.impressions, display: formatNum(totals.impressions), icon: BarChart3 },
          { label: 'Posición media', curr: totals.avgPosition, prev: prevTotals.avgPosition, display: totals.avgPosition.toFixed(1), icon: Globe, inverted: true },
        ].map(({ label, curr, prev, display, icon: Icon, inverted }) => (
          <div key={label} className="bg-white/60 border border-slate-200/60 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">{label}</span>
              <Icon className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <p className="text-xl font-bold text-slate-900 leading-none">{display}</p>
            <Trend current={curr} previous={prev} inverted={inverted} />
          </div>
        ))}
      </div>

      {/* ── Bandas de posición ── */}
      <div>
        <h3 className="font-display text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Distribución de keywords por posición
        </h3>

        {/* Barra proporcional visual */}
        <div className="flex rounded-lg overflow-hidden h-3 mb-4 gap-px">
          <div
            className="bg-emerald-500 transition-all duration-700"
            style={{ width: `${(bands.top3.count / totalKws) * 100}%` }}
            title={`Top 3: ${bands.top3.count} keywords`}
          />
          <div
            className="bg-brand-500 transition-all duration-700"
            style={{ width: `${(bands.pos4to10.count / totalKws) * 100}%` }}
            title={`Pos 4-10: ${bands.pos4to10.count} keywords`}
          />
          <div
            className="bg-amber-500/60 transition-all duration-700 flex-1"
            title={`+10: ${bands.pos10plus.count} keywords`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {bandCards.map((band) => {
            const pct = ((band.count / totalKws) * 100).toFixed(1)
            const isExpanded = expandedBand === band.id
            const hasTopKws = band.topKws && band.topKws.length > 0

            return (
              <div
                key={band.id}
                className={`rounded-xl border bg-gradient-to-br p-4 transition-all duration-200 ${band.color}`}
              >
                {/* Header de la banda */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${band.dotColor}`} />
                      <span className="text-sm font-bold text-slate-900">{band.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 ml-4">{band.sublabel}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${band.badgeColor}`}>
                    {pct}%
                  </span>
                </div>

                {/* Número grande */}
                <div className="mb-3">
                  <span className={`text-3xl font-black ${band.textColor}`}>{band.count.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 ml-1">keywords</span>
                </div>

                {/* Sub-métricas */}
                <div className="flex gap-2 text-xs text-slate-600 border-t border-white/5 pt-3">
                  <span>{formatNum(band.clicks)} clics</span>
                  <span className="text-slate-600">·</span>
                  <span>{formatNum(band.impressions)} imp.</span>
                </div>

                {/* Top keywords expandibles */}
                {hasTopKws && (
                  <>
                    <button
                      onClick={() => setExpandedBand(isExpanded ? null : band.id as 'top3' | 'pos4to10')}
                      className={`mt-3 w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-colors ${band.pill} hover:opacity-90`}
                    >
                      <span>Ver top keywords</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1.5">
                        {band.topKws!.map((kw, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-black/20 rounded-lg px-2.5 py-1.5">
                            <span className="text-slate-700 truncate flex-1 mr-2">{kw.query}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`font-bold ${band.textColor}`}>#{kw.position}</span>
                              <span className="text-slate-500">{formatNum(kw.clicks)}c</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Gráfico YoY ── */}
      <div className="bg-white/40 border border-slate-200/60 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900">Evolución año a año</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparación semana a semana • {period.current.start} vs {period.previous.start.slice(0, 4)}
            </p>
          </div>
          {/* Legend + toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-brand-400 rounded inline-block" />
                <span className="text-slate-600">Este año</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-slate-500 rounded inline-block" style={{ borderTop: '1.5px dashed #475569', height: 0 }} />
                <span className="text-slate-600">Año anterior</span>
              </span>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-slate-200">
              <button
                onClick={() => setChartMetric('clicks')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${chartMetric === 'clicks' ? 'bg-brand-600 text-slate-900' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Clics
              </button>
              <button
                onClick={() => setChartMetric('impressions')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${chartMetric === 'impressions' ? 'bg-brand-600 text-slate-900' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Impresiones
              </button>
            </div>
          </div>
        </div>

        <LineChart
          current={chart.current}
          previous={chart.previous}
          metric={chartMetric}
        />

        {/* Resumen de variación */}
        {(() => {
          const totalCurrClicks = chart.current.reduce((s, p) => s + p.clicks, 0)
          const totalPrevClicks = chart.previous.reduce((s, p) => s + p.clicks, 0)
          const diffClicks = pct(totalCurrClicks, totalPrevClicks)
          const totalCurrImp = chart.current.reduce((s, p) => s + p.impressions, 0)
          const totalPrevImp = chart.previous.reduce((s, p) => s + p.impressions, 0)
          const diffImp = pct(totalCurrImp, totalPrevImp)
          return (
            <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap gap-4 text-xs">
              <span className="text-slate-500">
                Clics (16 semanas): <strong className="text-slate-900">{formatNum(totalCurrClicks)}</strong>
                {' '}<span className={diffClicks >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {diffClicks >= 0 ? '▲' : '▼'} {Math.abs(diffClicks).toFixed(1)}% vs año ant.
                </span>
              </span>
              <span className="text-slate-500">
                Impresiones: <strong className="text-slate-900">{formatNum(totalCurrImp)}</strong>
                {' '}<span className={diffImp >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {diffImp >= 0 ? '▲' : '▼'} {Math.abs(diffImp).toFixed(1)}% vs año ant.
                </span>
              </span>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
