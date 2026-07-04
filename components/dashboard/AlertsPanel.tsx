'use client'

import Link from 'next/link'
import { AlertTriangle, TrendingUp, Plus, ArrowRight, Rocket } from 'lucide-react'

interface Alert {
  type: string
  count: number
  route: string
  label: string
  severity: 'high' | 'medium' | 'low'
}

interface Props {
  alerts: Alert[]
  hasGSC: boolean
}

const CONFIG = {
  cannibalization: {
    icon: AlertTriangle,
    title: 'Canibalizaciones',
    desc: 'URLs compitiendo por las mismas keywords',
    color: 'border-red-500/30 bg-red-500/5',
    badge: 'bg-red-500/15 text-red-400 border-red-500/25',
    cta: 'Resolver',
    ctaStyle: 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/30',
    iconColor: 'text-red-400',
    severityLabel: 'Urgente',
  },
  striking_distance: {
    icon: TrendingUp,
    title: 'Quick Wins',
    desc: 'Keywords en pos. 4–20 listas para subir',
    color: 'border-amber-500/30 bg-amber-500/5',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    cta: 'Optimizar',
    ctaStyle: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30',
    iconColor: 'text-amber-400',
    severityLabel: 'Prioridad',
  },
  orphaned: {
    icon: Plus,
    title: 'Sin Atacar',
    desc: 'Oportunidades de contenido nuevo detectadas',
    color: 'border-brand-500/30 bg-brand-500/5',
    badge: 'bg-brand-500/15 text-brand-400 border-brand-500/25',
    cta: 'Crear',
    ctaStyle: 'bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 border-brand-500/30',
    iconColor: 'text-brand-400',
    severityLabel: 'Acción',
  },
} as const

export default function AlertsPanel({ alerts, hasGSC }: Props) {
  if (!hasGSC) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-dashed border-slate-200 bg-white/30 text-center h-full min-h-[120px]">
        <Rocket className="w-7 h-7 text-slate-600" />
        <div>
          <p className="text-sm font-semibold text-slate-500">Alertas desactivadas</p>
          <p className="text-xs text-slate-600 mt-0.5">Conecta Google Search Console para detectar oportunidades</p>
        </div>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center h-full min-h-[120px]">
        <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Rocket className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-400">¡Sitio en excelente forma!</p>
          <p className="text-xs text-slate-500 mt-0.5">Sin canibalizaciones ni problemas detectados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {alerts.map((alert, i) => {
        const cfg = CONFIG[alert.type as keyof typeof CONFIG]
        if (!cfg) return null
        const Icon = cfg.icon

        return (
          <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border ${cfg.color} transition-all duration-200 group`}>
            {/* Icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.badge} border`}>
              <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-slate-900">{cfg.title}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
                  {alert.count}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">{cfg.desc}</p>
            </div>

            {/* CTA */}
            <Link
              href={alert.route}
              className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 ${cfg.ctaStyle}`}
            >
              {cfg.cta}
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )
      })}
    </div>
  )
}
