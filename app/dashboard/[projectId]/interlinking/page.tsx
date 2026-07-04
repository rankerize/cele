'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Network, Loader2, AlertTriangle, RefreshCw, Globe, ChevronRight, BarChart2 } from 'lucide-react'
import { TargetPageData, SourcePageData } from '@/types/interlinking'
import DiagnosticDashboard from '@/components/interlinking/DiagnosticDashboard'
import OpportunitiesTable from '@/components/interlinking/OpportunitiesTable'
import OpportunityDetail from '@/components/interlinking/OpportunityDetail'
import BatchProgress from '@/components/interlinking/BatchProgress'
import { useAppCache } from '@/lib/AppCacheContext'
import CacheStatusBadge from '@/components/ui/CacheStatusBadge'

type View = 'diagnostic' | 'table' | 'detail' | 'batch'

interface AnalyzeData {
  stats: {
    totalPosts: number
    totalTargets: number
    strikingDistanceCount: number
    orphanedCount: number
    highVolumeCount: number
  }
  targets: TargetPageData[]
  sources: SourcePageData[]
}

export default function InterlinkingPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const cache = useAppCache()
  const [view, setView] = useState<View>('diagnostic')
  // Iniciar con loading=false si ya tenemos datos en cache
  const [loading, setLoading] = useState(!cache.postsLoaded)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyzeData | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<TargetPageData | null>(null)
  const [batchTargets, setBatchTargets] = useState<TargetPageData[]>([])
  const [siteUrl, setSiteUrl] = useState('')
  const [sites, setSites] = useState<{ siteUrl: string }[]>([])

  useEffect(() => {
    fetchSites()
  }, [])

  async function fetchSites() {
    try {
      const res = await fetch('/api/gsc/sites')
      if (!res.ok) {
        if (res.status === 401) { setLoading(false); return }
        throw new Error('Error al cargar sitios de GSC')
      }
      const json = await res.json()
      setSites(json.data || [])
      const url = json.currentSiteUrl || json.data?.[0]?.siteUrl || ''
      setSiteUrl(url)
      if (url) analyze(url)
      else setLoading(false)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  async function analyze(url?: string) {
    setLoading(true)
    setError(null)
    try {
      const target = url || siteUrl
      const res = await fetch(`/api/interlinking/analyze?siteUrl=${encodeURIComponent(target)}&projectId=${encodeURIComponent(projectId)}`)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Error al analizar')
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectTarget(target: TargetPageData) {
    setSelectedTarget(target)
    setView('detail')
  }

  function handleBatchAnalyze(targets: TargetPageData[]) {
    setBatchTargets(targets)
    setView('batch')
  }

  function handleCloseDetail() {
    setSelectedTarget(null)
    setView('table')
  }

  function handleBackFromBatch() {
    setBatchTargets([])
    setView('table')
  }

  const breadcrumbs: { label: string; view: View; show: boolean }[] = [
    { label: 'Diagnóstico', view: 'diagnostic', show: true },
    { label: 'Oportunidades', view: 'table', show: true },
    { label: 'Análisis en lote', view: 'batch', show: view === 'batch' },
  ]

  if (!loading && sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Globe className="w-10 h-10 text-violet-400" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-white mb-2">Conecta Google Search Console</h2>
          <p className="text-slate-600 text-sm max-w-sm">Para usar el módulo de Enlazado Interno necesitas vincular tu cuenta de Google en Integraciones.</p>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard/settings'}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all text-sm"
        >
          Ir a Integraciones
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Network className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Enlazado Interno Estratégico</h1>
            <p className="text-slate-500 text-sm">Diagnóstico, recomendación y ejecución basados en datos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CacheStatusBadge
            lastFetch={cache.lastFetch['posts']}
            loading={loading}
            onRefresh={() => analyze()}
          />
          {sites.length > 1 && (
            <select
              value={siteUrl}
              onChange={e => { setSiteUrl(e.target.value); analyze(e.target.value) }}
              className="bg-white border border-slate-200 rounded-lg text-sm text-white px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
            >
              {sites.map(s => <option key={s.siteUrl} value={s.siteUrl}>{s.siteUrl}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Breadcrumb nav */}
      {!loading && data && (
        <nav className="flex items-center gap-1 text-sm flex-wrap">
          {breadcrumbs.filter(b => b.show || b.view === 'diagnostic' || b.view === 'table').map((crumb, i) => {
            if (!crumb.show && crumb.view === 'batch' && view !== 'batch') return null
            const isActive = view === crumb.view || (view === 'detail' && crumb.view === 'table')
            return (
              <span key={crumb.view} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                <button
                  onClick={() => crumb.view !== 'batch' && setView(crumb.view)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {crumb.view === 'diagnostic' && <BarChart2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                  {crumb.view === 'table' && <Network className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                  {crumb.label}
                  {crumb.view === 'table' && data && (
                    <span className="ml-1.5 text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded-full">
                      {data.targets.length}
                    </span>
                  )}
                  {crumb.view === 'batch' && batchTargets.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-violet-600/30 text-violet-400 px-1.5 py-0.5 rounded-full">
                      {batchTargets.length}
                    </span>
                  )}
                </button>
              </span>
            )
          })}
          {view === 'detail' && selectedTarget && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="px-3 py-1.5 rounded-lg bg-brand-600/20 text-brand-300 border border-brand-500/30 font-medium text-sm truncate max-w-[200px]">
                {selectedTarget.title}
              </span>
            </>
          )}
        </nav>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Error al cargar datos</p>
            <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
            <button onClick={() => analyze()} className="mt-2 text-xs text-red-300 hover:text-red-200 underline">
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" style={{ animationDuration: '1s' }} />
            <div className="absolute inset-2 rounded-full border-r-2 border-brand-500 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
            <Network className="absolute inset-0 m-auto w-5 h-5 text-slate-500" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Analizando estructura de enlazado…</p>
            <p className="text-slate-500 text-sm mt-1 animate-pulse">Cruzando GSC + WordPress</p>
          </div>
        </div>
      )}

      {/* Main content */}
      {!loading && data && (
        <>
          {view === 'diagnostic' && (
            <DiagnosticDashboard
              stats={data.stats}
              targets={data.targets}
              onExplore={() => setView('table')}
              onSelectTarget={handleSelectTarget}
            />
          )}

          {(view === 'table' || view === 'detail') && (
            <OpportunitiesTable
              targets={data.targets}
              onSelectTarget={handleSelectTarget}
              onBatchAnalyze={handleBatchAnalyze}
            />
          )}

          {view === 'batch' && (
            <BatchProgress
              targets={batchTargets}
              sources={data.sources}
              onBack={handleBackFromBatch}
            />
          )}
        </>
      )}

      {/* Detail panel (slide-in overlay) */}
      {view === 'detail' && selectedTarget && data && (
        <OpportunityDetail
          target={selectedTarget}
          sources={data.sources}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  )
}
