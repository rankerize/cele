'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  PenSquare, ArrowRight, Zap, Globe, CheckCircle,
  RefreshCw, Loader2, BarChart3, Network, Link2, Layers
} from 'lucide-react'

import OnboardingWizard from '@/components/dashboard/OnboardingWizard'
import SiteHealthBar from '@/components/dashboard/SiteHealthBar'
import ActionPriorityCards from '@/components/dashboard/ActionPriorityCards'

const GscDashboardPanel = dynamic(
  () => import('@/components/dashboard/GscDashboardPanel'),
  { ssr: false, loading: () => <div className="h-48 rounded-2xl bg-white/40 animate-pulse border border-slate-200" /> }
)

interface StatusData {
  integrations: {
    wordpress: boolean
    gsc: boolean
    ai: boolean
    aiProvider: string
    gscSiteUrl: string | null
  }
  healthScore: number
  alerts: Array<{ type: string; count: number; route: string; label: string; severity: 'high' | 'medium' | 'low' }>
}

interface Props {
  projectId: string
  hasWordPress: boolean
  hasAI: boolean
  hasGSC: boolean
}

const allConnected = (s: StatusData) =>
  s.integrations.wordpress && s.integrations.gsc && s.integrations.ai

export default function DashboardController({ projectId, hasWordPress, hasAI, hasGSC }: Props) {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/status')
      const json = await res.json()
      if (json.success) setStatus(json.data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStatus() }, [])

  // Use server-side quick check to show skeleton onboarding while loading
  const isBasicSetupDone = hasWordPress && hasAI && hasGSC

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 w-64 bg-white rounded-xl animate-pulse" />
        <div className="h-24 rounded-2xl bg-white/50 animate-pulse border border-slate-200" />
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/30 animate-pulse border border-slate-200/50" />)}
        </div>
      </div>
    )
  }

  // Show onboarding if missing integrations
  if (status && !allConnected(status)) {
    return (
      <OnboardingWizard
        projectId={projectId}
        hasWordPress={status.integrations.wordpress}
        hasGSC={status.integrations.gsc}
        hasAI={status.integrations.ai}
      />
    )
  }

  const aiName = 'IA'

  // Health score factors
  const factors = status ? [
    status.integrations.wordpress && { label: 'WordPress', impact: 'positive' as const, detail: 'WordPress conectado' },
    status.integrations.gsc && { label: 'Search Console', impact: 'positive' as const, detail: 'GSC activo' },
    status.integrations.ai && { label: aiName, impact: 'positive' as const, detail: 'IA configurada' },
    (status.alerts.find(a => a.type === 'cannibalization')?.count ?? 0) > 0
      ? { label: 'Canibalizaciones', impact: 'negative' as const, detail: `${status.alerts.find(a => a.type === 'cannibalization')?.count} conflictos activos` }
      : null,
    (status.alerts.find(a => a.type === 'striking_distance')?.count ?? 0) > 0
      ? { label: 'Quick Wins disponibles', impact: 'neutral' as const, detail: `${status.alerts.find(a => a.type === 'striking_distance')?.count} keywords en 4-20` }
      : null,
  ].filter(Boolean) as { label: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }[]
  : []

  const quickActions = [
    {
      href: '/dashboard/seo',
      icon: BarChart3,
      label: 'SEO Estratégico',
      description: 'Analiza keywords, canibalizaciones y oportunidades de posicionamiento',
      color: 'text-brand-400',
      bg: 'bg-brand-600/10 border-brand-500/20 hover:border-brand-500/40',
    },
    {
      href: '/dashboard/editorial',
      icon: Network,
      label: 'Mapa Editorial',
      description: 'Organiza la arquitectura temática y categorías de tu sitio',
      color: 'text-purple-400',
      bg: 'bg-purple-600/10 border-purple-500/20 hover:border-purple-500/40',
    },
    {
      href: '/dashboard/interlinking',
      icon: Link2,
      label: 'Enlazado Interno',
      description: 'Detecta y aplica oportunidades de enlazado para reforzar autoridad',
      color: 'text-cyan-400',
      bg: 'bg-cyan-600/10 border-cyan-500/20 hover:border-cyan-500/40',
    },
    {
      href: '/dashboard/batch',
      icon: Layers,
      label: 'Plan de Contenido',
      description: 'Genera un cluster de artículos estratégicamente sin canibalizar',
      color: 'text-emerald-400',
      bg: 'bg-emerald-600/10 border-emerald-500/20 hover:border-emerald-500/40',
    },
    {
      href: '/dashboard/improve',
      icon: RefreshCw,
      label: 'Mejorar Contenido',
      description: `Optimiza posts existentes con ${aiName} para subir posiciones`,
      color: 'text-amber-400',
      bg: 'bg-amber-600/10 border-amber-500/20 hover:border-amber-500/40',
    },
    {
      href: '/dashboard/create',
      icon: PenSquare,
      label: 'Crear Artículo',
      description: `Genera contenido HTML optimizado para SEO con ${aiName}`,
      color: 'text-slate-600',
      bg: 'bg-slate-600/10 border-slate-500/20 hover:border-slate-500/40',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-900 tracking-tight">
            Centro de Control <span className="gradient-text">SEO</span>
          </h1>
          {status?.integrations.gscSiteUrl && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {status.integrations.gscSiteUrl}
            </p>
          )}
        </div>
        <button
          onClick={fetchStatus}
          className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
          title="Actualizar estado"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>

      {/* Site Health Bar */}
      {status && (
        <SiteHealthBar
          score={status.healthScore}
          factors={factors}
        />
      )}

      {/* ── Acciones Prioritarias del Sitio ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-black text-slate-600 uppercase tracking-widest">
            🎯 Acciones del Sitio
          </h2>
          {status && status.alerts.length > 0 && (
            <span className="text-[10px] text-slate-500 font-semibold">
              {status.alerts.length} acción{status.alerts.length > 1 ? 'es' : ''} detectada{status.alerts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <ActionPriorityCards
          alerts={status?.alerts ?? []}
          hasGSC={status?.integrations.gsc ?? false}
        />
      </section>

      {/* ── GSC Analytics Panel ── */}
      {hasGSC && (
        <section>
          <h2 className="font-display text-sm font-black text-slate-600 uppercase tracking-widest mb-4">
            📈 Rendimiento Orgánico
          </h2>
          <GscDashboardPanel />
        </section>
      )}

      {/* ── Módulos de la plataforma ── */}
      <section>
        <h2 className="font-display text-sm font-black text-slate-600 uppercase tracking-widest mb-4">
          ⚡ Módulos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map(({ href, icon: Icon, label, description, color, bg }) => (
            <Link
              key={href}
              href={href}
              className={`card border group cursor-pointer ${bg} transition-all duration-200`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl ${bg.split(' ')[0]} border ${bg.split(' ')[1]}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-600 group-hover:translate-x-1 transition-all duration-200" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-sm mb-1">{label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features strip */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white/50 rounded-xl border border-slate-200 text-xs text-slate-500">
        {[
          { icon: Zap, text: `Motor de IA: ${aiName}` },
          { icon: Globe, text: 'Publicación directa en WordPress' },
          { icon: CheckCircle, text: 'Anti-canibalización automática' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-brand-400/70" />
            {text}
          </div>
        ))}
      </div>
    </div>
  )
}
