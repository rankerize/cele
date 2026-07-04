'use client'

import { TrendingUp, TrendingDown, Minus, Target, BarChart3, Globe, MousePointer } from 'lucide-react'

interface GscTotals {
  keywords: number
  clicks: number
  impressions: number
  ctr: number
  avgPosition: number
}

interface Props {
  totals: GscTotals
  prevTotals: Partial<GscTotals>
}

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString('es-MX')
}

function pct(curr: number, prev: number) {
  if (!prev) return null
  return ((curr - prev) / prev) * 100
}

function Delta({ curr, prev, inverted = false }: { curr: number; prev?: number; inverted?: boolean }) {
  if (!prev) return null
  const diff = pct(curr, prev)!
  const neutral = Math.abs(diff) < 0.5
  if (neutral) return <span className="text-[10px] text-slate-600 flex items-center gap-0.5"><Minus className="w-2.5 h-2.5" /> 0%</span>
  const positive = inverted ? diff < 0 : diff > 0
  return (
    <span className={`text-[10px] flex items-center gap-0.5 font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {Math.abs(diff).toFixed(1)}%
    </span>
  )
}

export default function KpiStrip({ totals, prevTotals }: Props) {
  const kpis = [
    {
      label: 'Clics',
      value: fmt(totals.clicks),
      icon: MousePointer,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20',
      curr: totals.clicks,
      prev: prevTotals.clicks,
    },
    {
      label: 'Impresiones',
      value: fmt(totals.impressions),
      icon: BarChart3,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      curr: totals.impressions,
      prev: prevTotals.impressions,
    },
    {
      label: 'Posición media',
      value: totals.avgPosition.toFixed(1),
      icon: Globe,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      curr: totals.avgPosition,
      prev: prevTotals.avgPosition,
      inverted: true,
    },
    {
      label: 'Keywords activas',
      value: fmt(totals.keywords),
      icon: Target,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      curr: totals.keywords,
      prev: prevTotals.keywords,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map(({ label, value, icon: Icon, color, bg, curr, prev, inverted }) => (
        <div key={label} className={`flex flex-col gap-2 p-4 rounded-xl border ${bg} bg-white/50`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">{label}</span>
            <Icon className={`w-3.5 h-3.5 ${color} opacity-70`} />
          </div>
          <p className={`text-2xl font-black ${color} leading-none`}>{value}</p>
          <Delta curr={curr} prev={prev} inverted={inverted} />
        </div>
      ))}
    </div>
  )
}
