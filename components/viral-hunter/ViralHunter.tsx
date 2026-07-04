'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Radar,
  TrendingUp,
  Zap,
  AlertTriangle,
  Repeat2,
  Clock3,
  Loader2,
  Sparkles,
  PenSquare,
  Copy,
  CheckCheck,
  Globe,
  Layers,
  Tag,
  CheckCircle2,
} from 'lucide-react'
import { ViralHunterResult, ViralTerm } from '@/lib/ai-prompts/viral-hunter'

// ─── Config visual por urgencia ───────────────────────────────────────────────
const urgencyMap = {
  Alta:  { label: '🔥 Alta',  className: 'bg-red-500/10 border-red-500/25 text-red-400' },
  Media: { label: '⚡ Media', className: 'bg-amber-500/10 border-amber-500/25 text-amber-400' },
  Baja:  { label: '🌱 Baja',  className: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' },
}

const movimientoMap: Record<string, { Icon: React.ElementType; className: string; label: string }> = {
  Breakout:    { Icon: Radar,      className: 'bg-red-500/10 border-red-500/25 text-red-400',       label: '🚀 Breakout' },
  Creciendo:   { Icon: TrendingUp, className: 'bg-amber-500/10 border-amber-500/25 text-amber-400', label: '📈 Creciendo' },
  'Pico Viral':{ Icon: Zap,        className: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400', label: '⚡ Pico Viral' },
  Estacional:  { Icon: Repeat2,    className: 'bg-brand-500/10 border-brand-500/25 text-brand-400',    label: '🔁 Estacional' },
}

function scoreColor(score: number) {
  if (score >= 80) return { text: 'text-red-400',    ring: 'border-red-500/60',    bg: 'bg-red-500/10' }
  if (score >= 60) return { text: 'text-amber-400',  ring: 'border-amber-500/60',  bg: 'bg-amber-500/10' }
  if (score >= 40) return { text: 'text-yellow-400', ring: 'border-yellow-500/60', bg: 'bg-yellow-500/10' }
  return               { text: 'text-brand-400',   ring: 'border-brand-500/60',   bg: 'bg-brand-500/10' }
}

// Nichos genéricos como fallback si WP no está conectado
const FALLBACK_NICHES = ['Belleza', 'Fitness', 'Tecnología', 'Gastronomía', 'Moda', 'Viajes', 'Finanzas', 'Marketing', 'E-commerce']
const COUNTRIES = ['Colombia', 'México', 'España', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'Venezuela', 'Uruguay']

// ─── Componente principal ────────────────────────────────────────────────────
export default function ViralHunter() {
  const router = useRouter()
  const [niche, setNiche]         = useState('')
  const [country, setCountry]     = useState('Colombia')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<ViralHunterResult | null>(null)
  const [error, setError]         = useState<string | null>(null)

  // Categorías del sitio WordPress real
  const [siteCategories, setSiteCategories]   = useState<string[]>([])
  const [loadingCats, setLoadingCats]         = useState(true)
  const [catsFromSite, setCatsFromSite]       = useState(false)

  // Detectar categorías reales del sitio al montar
  useEffect(() => {
    async function fetchSiteCategories() {
      try {
        const res = await fetch('/api/wordpress/categories')
        if (!res.ok) throw new Error('sin conexión')
        const data = await res.json()
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // Filtrar "Sin categoría" y tomar máximo 10
          const cats: string[] = data.data
            .map((c: { name: string }) => c.name)
            .filter((name: string) => !['sin categoría', 'uncategorized', 'general'].includes(name.toLowerCase()))
            .slice(0, 10)
          if (cats.length > 0) {
            setSiteCategories(cats)
            setCatsFromSite(true)
            // Pre-llenar con la primera categoría del sitio si todavía está vacío
            setNiche(prev => prev || cats[0])
            setLoadingCats(false)
            return
          }
        }
        throw new Error('sin categorías')
      } catch {
        setSiteCategories(FALLBACK_NICHES)
        setCatsFromSite(false)
      } finally {
        setLoadingCats(false)
      }
    }
    fetchSiteCategories()
  }, [])

  async function handleAnalyze() {
    if (!niche.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/viral-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche.trim(), country, language: 'es' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al conectar con la IA')
      setResult(data as ViralHunterResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  function handleCreatePost(term: ViralTerm) {
    const params = new URLSearchParams({
      keyword: term.termino,
      titulo: term.ideaDeContenido,
      nicho: niche,
      pais: country,
    })
    router.push(`/dashboard/create?${params.toString()}`)
  }

  function handleCreateBatch(term?: ViralTerm) {
    // Si se pasa un término específico, lo usa como nicho del lote
    // Si no, usa el nicho actual de la búsqueda
    const batchNiche = term
      ? `${niche} - ${term.termino}`
      : niche
    const params = new URLSearchParams({
      nicho: batchNiche,
      paisMercado: country,
    })
    router.push(`/dashboard/batch?${params.toString()}`)
  }

  const quickPicks = loadingCats ? [] : siteCategories

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <Radar className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            Viral Hunter
            <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/25 text-red-400">
              LIVE
            </span>
          </h1>
          <p className="text-sm text-slate-500">
            Detecta términos <span className="text-violet-400 font-semibold">Breakout</span> en tu nicho antes de que se saturen · Impulsado por IA
          </p>
        </div>
      </div>

      {/* ── Panel de búsqueda ── */}
      <div className="card p-6 space-y-4">

        {/* Row 1: inputs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Nicho */}
          <div className="flex-1 space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              Nicho / Industria
            </label>
            <input
              type="text"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              placeholder="Ej: Belleza, Fitness, Tecnología..."
              className="w-full bg-white border border-slate-200 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          {/* País */}
          <div className="sm:w-44 space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              País
            </label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-violet-500/60 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none cursor-pointer"
            >
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: quick picks + badge de origen + botón */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge de origen */}
          {!loadingCats && (
            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${
              catsFromSite
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-white border-slate-200 text-slate-500'
            }`}>
              {catsFromSite
                ? <><CheckCircle2 className="w-3 h-3" /> Categorías de tu sitio</>
                : <><Tag className="w-3 h-3" /> Nichos genéricos</>
              }
            </span>
          )}

          {/* Quick picks */}
          {loadingCats
            ? <span className="text-[11px] text-slate-600 animate-pulse">Detectando nicho del sitio...</span>
            : quickPicks.map(ex => (
                <button
                  key={ex}
                  onClick={() => setNiche(ex)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                    niche === ex
                      ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {ex}
                </button>
              ))
          }

          {/* Botón — a la derecha */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !niche.trim()}
            className="ml-auto btn-primary bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap px-6 py-2.5 transition-all"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analizando...</>
              : <><Sparkles className="w-4 h-4" /> Cazar Tendencias</>
            }
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Loading state ── */}
      {loading && (
        <div className="card flex flex-col items-center justify-center py-20 gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-2 border-violet-500/20 flex items-center justify-center">
              <Radar className="w-8 h-8 text-violet-400/60" />
            </div>
            <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-b-2 border-violet-400/40 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          </div>
          <div className="text-center space-y-2">
            <p className="text-base font-bold text-slate-900 animate-pulse">Escaneando señales virales...</p>
            <p className="text-sm text-slate-500">
              Cruzando Google Trends Breakout · TikTok · Instagram · Pinterest para{' '}
              <span className="text-violet-400">{niche}</span> en <span className="text-violet-400">{country}</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Resultados ── */}
      {result && !loading && (
        <div className="space-y-5 animate-fade-in">

          {/* Resumen de mercado */}
          <div className="card p-5">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="flex-1 space-y-1.5">
                <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Análisis del mercado — {niche} · {country}
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{result.resumenMercado}</p>
              </div>

              <div className="shrink-0 md:w-64 bg-red-500/8 border border-red-500/20 rounded-xl p-4 space-y-1">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                  🏆 Mejor Oportunidad Ahora
                </p>
                <p className="text-sm font-semibold text-slate-900 leading-snug">{result.mejorOportunidad}</p>
              </div>
            </div>

            {/* Acción global: Crear lote sobre todo el nicho */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                <Clock3 className="w-3 h-3" />
                Análisis generado · {new Date(result.timestampAnalisis).toLocaleString('es-ES')}
              </p>
              <button
                onClick={() => handleCreateBatch()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 hover:border-brand-500/50 text-brand-300 hover:text-brand-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5" />
                Crear lote sobre &quot;{niche}&quot;
              </button>
            </div>
          </div>

          {/* Grid de tarjetas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {result.terminosVirales.map((term, i) => (
              <ViralTermCard
                key={i}
                term={term}
                rank={i + 1}
                onCreatePost={() => handleCreatePost(term)}
                onCreateBatch={() => handleCreateBatch(term)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tarjeta de término viral ────────────────────────────────────────────────
function ViralTermCard({
  term,
  rank,
  onCreatePost,
  onCreateBatch,
}: {
  term: ViralTerm
  rank: number
  onCreatePost: () => void
  onCreateBatch: () => void
}) {
  const [copied, setCopied] = useState(false)
  const sc  = scoreColor(term.puntuacionViralidad)
  const urg = urgencyMap[term.urgencia]         ?? urgencyMap.Media
  const mov = movimientoMap[term.tipoMovimiento] ?? movimientoMap.Creciendo

  function copyKeyword() {
    navigator.clipboard.writeText(term.termino)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card p-5 flex flex-col gap-4 hover:border-violet-500/30 transition-all duration-200 group">

      {/* Header */}
      <div className="flex items-start gap-3">
        <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black ${
          rank === 1 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white text-slate-500 border border-slate-200'
        }`}>
          #{rank}
        </span>

        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-slate-900 text-base leading-tight truncate group-hover:text-violet-600 transition-colors">
            {term.termino}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">📍 {term.plataformaOrigen}</p>
        </div>

        <div className={`shrink-0 w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center ${sc.ring} ${sc.bg}`}>
          <span className={`text-sm font-black ${sc.text} leading-none`}>{term.puntuacionViralidad}</span>
          <span className="text-[8px] text-slate-600 leading-none mt-0.5">Score</span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${mov.className}`}>
          {mov.label}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${urg.className}`}>
          {urg.label}
        </span>
      </div>

      {/* Razón de tendencia */}
      <div className="bg-violet-500/6 border border-violet-500/15 rounded-lg px-3 py-2">
        <p className="text-[12px] text-violet-300 leading-relaxed">
          💡 {term.razonTendencia}
        </p>
      </div>

      {/* Idea de contenido */}
      <p className="text-[13px] text-slate-600 leading-relaxed">
        <span className="text-slate-600 font-semibold">Idea: </span>{term.ideaDeContenido}
      </p>

      {/* Keywords SEO */}
      {term.keywordsSugeridas?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Keywords SEO sugeridas</p>
          <div className="flex flex-wrap gap-1.5">
            {term.keywordsSugeridas.slice(0, 4).map((kw, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA Buttons — 3 acciones */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 mt-auto">
        {/* Crear post único */}
        <button
          onClick={onCreatePost}
          title="Crear un artículo individual sobre esta tendencia"
          className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 hover:text-violet-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
        >
          <PenSquare className="w-3.5 h-3.5" />
          Crear Post
        </button>

        {/* Crear lote sobre este término */}
        <button
          onClick={onCreateBatch}
          title="Crear múltiples artículos sobre esta tendencia en lote"
          className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 hover:border-brand-500/50 text-brand-300 hover:text-brand-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
        >
          <Layers className="w-3.5 h-3.5" />
          Crear Lote
        </button>

        {/* Copiar keyword */}
        <button
          onClick={copyKeyword}
          title="Copiar término viral al portapapeles"
          className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
        >
          {copied
            ? <><CheckCheck className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copiado</span></>
            : <><Copy className="w-3.5 h-3.5" /> Copiar</>
          }
        </button>
      </div>
    </div>
  )
}
