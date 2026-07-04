'use client'

import { TargetPageData } from '@/types/interlinking'
import { TrendingUp, AlertCircle, Star, Zap, BarChart2, ArrowRight, Eye } from 'lucide-react'

interface Stats {
  totalPosts: number
  totalTargets: number
  strikingDistanceCount: number
  orphanedCount: number
  highVolumeCount: number
}

interface Props {
  stats: Stats
  targets: TargetPageData[]
  onExplore: () => void
  onSelectTarget: (target: TargetPageData) => void
}

function OpportunityBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
  }
  const labels = { high: 'Alta', medium: 'Media', low: 'Baja' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[level]}`}>
      {labels[level]}
    </span>
  )
}

function getOpportunityLevel(target: TargetPageData): 'high' | 'medium' | 'low' {
  if (target.position >= 4 && target.position <= 10 && target.impressions > 100) return 'high'
  if (target.position >= 4 && target.position <= 20 && target.impressions > 30) return 'medium'
  return 'low'
}

export default function DiagnosticDashboard({ stats, targets, onExplore, onSelectTarget }: Props) {
  const topTargets = targets.slice(0, 5)

  const cards = [
    {
      icon: TrendingUp,
      label: 'Páginas en Striking Distance',
      value: stats.strikingDistanceCount,
      sub: 'Posición 4-20 con potencial',
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      icon: AlertCircle,
      label: 'Páginas sin tráfico (posibles huérfanas)',
      value: stats.orphanedCount,
      sub: 'Sin clics ni impresiones en GSC',
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
      iconColor: 'text-amber-400',
    },
    {
      icon: Star,
      label: 'Páginas de alto volumen',
      value: stats.highVolumeCount,
      sub: 'Más de 500 impresiones',
      color: 'from-violet-500/20 to-violet-600/10 border-violet-500/20',
      iconColor: 'text-violet-400',
    },
    {
      icon: BarChart2,
      label: 'Total páginas analizadas',
      value: stats.totalPosts,
      sub: `${stats.totalTargets} con oportunidades detectadas`,
      color: 'from-brand-500/20 to-brand-600/10 border-brand-500/20',
      iconColor: 'text-brand-400',
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Diagnóstico General</h2>
          <p className="text-slate-600 mt-1 text-sm">
            Estado del interlinking de tu sitio basado en datos de GSC y WordPress
          </p>
        </div>
        <button
          onClick={onExplore}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-brand-500/20"
        >
          Ver todas las oportunidades
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        {cards.map(({ icon: Icon, label, value, sub, color, iconColor }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-xs font-medium mb-1">{label}</p>
                <p className="text-3xl font-bold text-white tabular-nums">{value.toLocaleString()}</p>
                <p className="text-slate-500 text-xs mt-1">{sub}</p>
              </div>
              <div className={`p-2 rounded-xl bg-white/5 ${iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top oportunidades */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-400" />
            Mayores oportunidades detectadas
          </h3>
          <button
            onClick={onExplore}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            Ver tabla completa →
          </button>
        </div>

        <div className="space-y-2">
          {topTargets.map((target, i) => {
            const level = getOpportunityLevel(target)
            return (
              <button
                key={target.url}
                onClick={() => onSelectTarget(target)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-brand-500/40 hover:bg-slate-50/80 transition-all duration-200 text-left group"
              >
                <span className="text-slate-600 text-xs font-bold tabular-nums w-4 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
                    {target.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{target.url}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-white tabular-nums">{target.impressions.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-600">impresiones</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className={`text-xs font-bold tabular-nums ${target.position <= 10 ? 'text-emerald-400' : target.position <= 20 ? 'text-amber-400' : 'text-slate-600'}`}>
                      #{Math.round(target.position)}
                    </p>
                    <p className="text-[10px] text-slate-600">posición</p>
                  </div>
                  <OpportunityBadge level={level} />
                  <Eye className="w-3.5 h-3.5 text-slate-600 group-hover:text-brand-400 transition-colors" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
