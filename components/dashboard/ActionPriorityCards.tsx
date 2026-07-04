'use client'

import Link from 'next/link'
import { AlertTriangle, Rocket, Plus, ArrowRight, TrendingUp } from 'lucide-react'

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

const CARD_CONFIGS = {
  cannibalization: {
    icon: AlertTriangle,
    title: 'Canibalizaciones Detectadas',
    color: 'from-red-600/20 to-red-700/5',
    border: 'border-red-500/30 hover:border-red-500/50',
    badge: 'bg-red-500/15 text-red-400 border-red-500/20',
    cta: 'Ver Conflictos',
    ctaStyle: 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20',
    tip: 'Dos o más URLs compitiendo por la misma keyword reduce la autoridad de ambas. Resuélvelo ahora.',
  },
  striking_distance: {
    icon: TrendingUp,
    title: 'Quick Wins Disponibles',
    color: 'from-amber-600/20 to-amber-700/5',
    border: 'border-amber-500/30 hover:border-amber-500/50',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    cta: 'Optimizar Contenido',
    ctaStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
    tip: 'Keywords en posición 4–20 están a un paso del Top 3. Optimizar el contenido existente puede multiplicar tus clics esta semana.',
  },
  orphaned: {
    icon: Plus,
    title: 'Oportunidades sin Atacar',
    color: 'from-brand-600/20 to-brand-700/5',
    border: 'border-brand-500/30 hover:border-brand-500/50',
    badge: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
    cta: 'Crear Contenido',
    ctaStyle: 'bg-brand-500/10 text-brand-400 border-brand-500/30 hover:bg-brand-500/20',
    tip: 'Queries con impresiones sólidas que no tienen una URL clara rankeando. Son el mejor punto de partida para nuevo contenido.',
  },
} as const

export default function ActionPriorityCards({ alerts, hasGSC }: Props) {
  if (!hasGSC) {
    // Show placeholder if GSC not connected
    return (
      <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-white/30 text-center">
        <Rocket className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500 mb-1">Acciones inteligentes desactivadas</p>
        <p className="text-xs text-slate-600">
          Conecta Google Search Console para que el sistema detecte automáticamente las mejores oportunidades de tu sitio.
        </p>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <Rocket className="w-5 h-5 text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-emerald-400 mb-1">¡Sitio en excelente forma!</p>
        <p className="text-xs text-slate-500">
          No se detectaron canibalizaciones, tienes pocas oportunidades sin explotar. Considera lanzar un nuevo cluster de contenido.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, i) => {
        const config = CARD_CONFIGS[alert.type as keyof typeof CARD_CONFIGS]
        if (!config) return null
        const Icon = config.icon

        return (
          <div
            key={i}
            className={`relative p-5 rounded-2xl border bg-gradient-to-br ${config.color} ${config.border} transition-all duration-200 group`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Icon + badge */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${config.badge} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-bold text-slate-900">{config.title}</h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${config.badge}`}>
                      {alert.count}
                    </span>
                    <span className={`hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      alert.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                      alert.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-brand-500/20 text-brand-400'
                    }`}>{alert.severity === 'high' ? 'Urgente' : alert.severity === 'medium' ? 'Prioridad' : 'Acción'}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug line-clamp-2">{config.tip}</p>
                </div>
              </div>

              {/* CTA */}
              <Link
                href={alert.route}
                className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border transition-all shrink-0 ${config.ctaStyle} group-hover:scale-105`}
              >
                {config.cta}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
