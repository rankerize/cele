'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'

import DiagnosticLoadingScreen from '@/components/dashboard/DiagnosticLoadingScreen'
import OnboardingWizard from '@/components/dashboard/OnboardingWizard'
import SiteStatusBanner from '@/components/dashboard/SiteStatusBanner'
import SiteHealthBar from '@/components/dashboard/SiteHealthBar'
import AlertsPanel from '@/components/dashboard/AlertsPanel'
import KpiStrip from '@/components/dashboard/KpiStrip'
import ContentPipelineWidget from '@/components/dashboard/ContentPipelineWidget'
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed'
import QuickActionBar from '@/components/dashboard/QuickActionBar'

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface GscStats {
  totals: { keywords: number; clicks: number; impressions: number; ctr: number; avgPosition: number }
  prevTotals: { keywords: number; clicks: number; impressions: number; avgPosition: number }
}

interface EditorialStats {
  total: number
  published: number
  draft: number
  pending: number
}

interface HistoryItem {
  id: string
  title: string
  status: string
  type: 'creation' | 'improvement'
  createdAt: string
  wordpressUrl?: string
  keyword?: string
}

interface DiagnosticData {
  status: StatusData | null
  gsc: GscStats | null
  editorial: EditorialStats | null
  history: HistoryItem[]
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  projectId: string
  projectName: string
  projectDomain: string
  projectCountry?: string | null
  projectCms?: string | null
  hasWordPress: boolean
  hasAI: boolean
  hasGSC: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(lastSync: number): string {
  const secs = Math.floor((Date.now() - lastSync) / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h`
}

function buildEditorialStats(items: any[]): EditorialStats {
  return {
    total: items.length,
    published: items.filter(i => i.status === 'publish').length,
    draft: items.filter(i => i.status === 'draft').length,
    pending: items.filter(i => i.status === 'pending' || i.status === 'future').length,
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DiagnosticHome({ projectId, projectName, projectDomain, projectCountry, projectCms, hasWordPress, hasAI, hasGSC }: Props) {
  const [data, setData] = useState<DiagnosticData>({ status: null, gsc: null, editorial: null, history: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastSync, setLastSync] = useState<number | null>(null)

  const fetchAll = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)

    try {
      // All fetches in parallel — errors are silenced per-call
      const [statusRes, gscRes, editorialRes, historyRes] = await Promise.allSettled([
        fetch(`/api/dashboard/status?projectId=${projectId}`).then(r => r.json()),
        fetch(`/api/gsc/dashboard-stats?projectId=${projectId}`).then(r => r.json()),
        fetch(`/api/editorial/map?projectId=${projectId}`).then(r => r.json()),
        fetch(`/api/history?projectId=${projectId}`).then(r => r.json()),
      ])

      setData({
        status: statusRes.status === 'fulfilled' && statusRes.value.success ? statusRes.value.data : null,
        gsc: gscRes.status === 'fulfilled' && gscRes.value.success ? gscRes.value.data : null,
        editorial: editorialRes.status === 'fulfilled' && editorialRes.value.success
          ? buildEditorialStats(editorialRes.value.data)
          : null,
        history: historyRes.status === 'fulfilled' && historyRes.value.success
          ? (historyRes.value.data as HistoryItem[]).slice(0, 5)
          : [],
      })
      setLastSync(Date.now())
    } catch {
      // silenced — partial data already set above
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ──── Loading skeleton ────────────────────────────────────────────────────

  if (loading) {
    return <DiagnosticLoadingScreen />
  }


  // ──── Onboarding gate ─────────────────────────────────────────────────────
  // Mostrar selector de plataforma si WordPress no está conectado.
  // Usamos los datos frescos de la API si están disponibles, si no los props del servidor.
  const integrations = data.status?.integrations
  const wpConnected = integrations ? integrations.wordpress : hasWordPress
  const gscConnected = integrations ? integrations.gsc : hasGSC

  if (!wpConnected) {
    return (
      <OnboardingWizard
        projectId={projectId}
        hasWordPress={false}
        hasGSC={gscConnected}
        hasAI={integrations?.ai ?? hasAI}
      />
    )
  }

  // Si WP está conectado pero GSC o IA faltan, mostramos el wizard de pasos
  if (integrations && !(integrations.gsc && integrations.ai)) {
    return (
      <OnboardingWizard
        projectId={projectId}
        hasWordPress={true}
        hasGSC={integrations.gsc}
        hasAI={integrations.ai}
      />
    )
  }


  const aiName = 'IA'
  const alerts = data.status?.alerts ?? []
  const healthScore = data.status?.healthScore ?? 0

  const healthFactors = [
    integrations?.wordpress && { label: 'WordPress', impact: 'positive' as const, detail: 'WordPress conectado' },
    integrations?.gsc && { label: 'Search Console', impact: 'positive' as const, detail: 'GSC activo' },
    integrations?.ai && { label: aiName, impact: 'positive' as const, detail: 'IA configurada' },
    (alerts.find(a => a.type === 'cannibalization')?.count ?? 0) > 0
      ? { label: 'Canibalizaciones', impact: 'negative' as const, detail: `${alerts.find(a => a.type === 'cannibalization')?.count} conflictos` }
      : null,
    (alerts.find(a => a.type === 'striking_distance')?.count ?? 0) > 0
      ? { label: 'Quick Wins', impact: 'neutral' as const, detail: `${alerts.find(a => a.type === 'striking_distance')?.count} keywords en 4-20` }
      : null,
  ].filter(Boolean) as { label: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }[]

  // How many interlinking opportunities pending?
  // We derive from alert count if available, else null
  const interlinkingCount: number | null = null // Can be wired later via /api/interlinking/analyze

  // ──── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="rounded-[32px] border border-slate-900/8 bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-800">
              MVP Copiloto SEO
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
              {projectName}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {projectDomain}
              {projectCountry ? ` · ${projectCountry}` : ''}
              {projectCms ? ` · ${projectCms}` : ''}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              Este espacio organiza el MVP en tres rutas: diagnóstico, contenido e interlinking. La meta no es solo ver datos,
              sino transformar señales SEO en decisiones y activos listos para publicar.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
            {[
              { label: 'Diagnóstico', value: hasGSC ? 'Con datos' : 'Pendiente' },
              { label: 'Contenido', value: hasAI ? 'Listo' : 'Pendiente' },
              { label: 'Interlinking', value: hasWordPress ? 'Activo' : 'Pendiente' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-900/8 bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-black text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-900 tracking-tight">
            Centro de Control <span className="gradient-text">SEO</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Diagnóstico en tiempo real de tu sitio
          </p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50"
          title="Actualizar todo"
        >
          {refreshing
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />
          }
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* ── 1. Site Status Banner ── */}
      {integrations && (
        <SiteStatusBanner
          wordpress={integrations.wordpress}
          gsc={integrations.gsc}
          ai={integrations.ai}
          aiProvider={integrations.aiProvider}
          gscSiteUrl={integrations.gscSiteUrl}
          lastSynced={lastSync ? relativeTime(lastSync) : null}
        />
      )}

      {/* ── 2. Health Score ── */}
      <SiteHealthBar score={healthScore} factors={healthFactors} />

      {/* ── 3. Alerts + KPIs (side by side on md+) ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[11px] font-black text-slate-500 uppercase tracking-widest">
            🚦 Ruta MVP
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: 'Diagnóstico', description: 'Canibalización, CTR bajo, quick wins y señales de salud.' },
            { title: 'Contenido', description: 'Brief, borrador y publicación alineada a intención.' },
            { title: 'Interlinking', description: 'Enlaces internos que refuerzan clusters y categorías.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-slate-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alerts */}
        <section>
          <h2 className="font-display text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
            Alertas Activas
          </h2>
          <AlertsPanel alerts={alerts} hasGSC={integrations?.gsc ?? false} />
        </section>

        {/* KPIs */}
        <section>
          <h2 className="font-display text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 inline-block" />
            Rendimiento Orgánico · 4 semanas
          </h2>
          {data.gsc ? (
            <KpiStrip totals={data.gsc.totals} prevTotals={data.gsc.prevTotals} />
          ) : (
            <div className="h-full min-h-[120px] flex items-center justify-center rounded-xl border border-dashed border-slate-200 text-slate-600 text-sm">
              Sin datos de Search Console
            </div>
          )}
        </section>
      </div>

      {/* ── 4. Content Pipeline ── */}
      <section>
        <h2 className="font-display text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
          Pipeline de Contenido
        </h2>
        <ContentPipelineWidget
          editorialStats={data.editorial}
          interlinkingOpportunities={interlinkingCount}
        />
      </section>

      {/* ── 5. Recent Activity ── */}
      <section>
        <h2 className="font-display text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Actividad Reciente
        </h2>
        <RecentActivityFeed items={data.history} />
      </section>

      {/* ── 6. Quick Action Bar ── */}
      <section>
        <h2 className="font-display text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
          Acciones Rápidas
        </h2>
        <QuickActionBar aiName={aiName} />
      </section>

    </div>
  )
}
