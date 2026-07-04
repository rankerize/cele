'use client'

import { useState, useRef } from 'react'
import { Search, TrendingUp, DollarSign, BarChart2, Target, AlertTriangle, CheckCircle2, Loader2, ExternalLink, ChevronDown, Coins } from 'lucide-react'
import { useAppCache } from '@/lib/AppCacheContext'
import { gsap, useGSAP } from '@/lib/animations'
import { cn } from '@/lib/utils'

// ── Tipos locales ──────────────────────────────────────────────────────────────
interface KeywordResult {
  keyword: string
  searchVolume: number
  cpc: number
  competition: number
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  keywordDifficulty?: number
  searchIntent?: string | null
  trend?: number[]
}

const COUNTRIES = [
  { label: 'España', value: 'España' },
  { label: 'México', value: 'México' },
  { label: 'Colombia', value: 'Colombia' },
  { label: 'Argentina', value: 'Argentina' },
  { label: 'Chile', value: 'Chile' },
  { label: 'Perú', value: 'Perú' },
  { label: 'Estados Unidos (ES)', value: 'Estados Unidos' },
]

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  informational: { label: 'Informacional', color: 'text-brand-400 bg-brand-500/10 border-brand-500/20' },
  navigational: { label: 'Navegacional', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  commercial: { label: 'Comercial', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  transactional: { label: 'Transaccional', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
}

// ── Mini sparkline component ───────────────────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 64
  const h = 24
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ')

  const last = data[data.length - 1]
  const prev = data[data.length - 2]
  const isUp = last >= prev

  return (
    <svg width={w} height={h} className="overflow-visible">
      {/* Glow shadow */}
      <polyline 
        fill="none" 
        stroke={isUp ? '#10b981' : '#f59e0b'} 
        strokeWidth="4" 
        points={points} 
        className="opacity-20 blur-[2px]" 
      />
      {/* Main line */}
      <polyline 
        fill="none" 
        stroke={isUp ? '#10b981' : '#f59e0b'} 
        strokeWidth="1.5" 
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points} 
      />
    </svg>
  )
}

// ── Difficulty badge ───────────────────────────────────────────────────────────
function DifficultyBadge({ value }: { value: number | undefined }) {
  if (value === undefined) return null
  const isEasy = value < 30
  const isMedium = value < 60
  
  const color =
    isEasy ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
    : isMedium ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
    : 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]'

  return (
    <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${color}`}>
      KD {value}
    </span>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function KeywordResearchPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  
  const { credits, deductCredits } = useAppCache()
  
  const [keyword, setKeyword] = useState('')
  const [country, setCountry] = useState('España')
  const [mode, setMode] = useState<'ideas' | 'related'>('ideas')
  const [results, setResults] = useState<KeywordResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [sortBy, setSortBy] = useState<'searchVolume' | 'cpc' | 'keywordDifficulty'>('searchVolume')
  const [seed, setSeed] = useState('')

  const COST_PER_SEARCH = 15

  useGSAP(() => {
    gsap.from(containerRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out',
    })
  }, { scope: containerRef })

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) return

    if (credits < COST_PER_SEARCH) {
      setError(`No tienes suficientes créditos. Necesitas ${COST_PER_SEARCH} créditos para esta acción.`)
      return
    }

    setIsLoading(true)
    setError(null)
    setResults([])
    setSeed(keyword.trim())

    try {
      const res = await fetch('/api/keywords/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), country, mode, limit: 50 }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Error al obtener datos de keywords.')
      } else {
        setResults(data.data || [])
        setSearched(true)
        deductCredits(COST_PER_SEARCH) // Cobrar 15 créditos tras el éxito
        
        // Animar la entrada de resultados
        setTimeout(() => {
          if (resultsRef.current) {
            gsap.from(resultsRef.current.children, {
              y: 20,
              opacity: 0,
              stagger: 0.1,
              duration: 0.5,
              ease: 'power2.out',
              clearProps: 'all'
            })
          }
        }, 50)
      }
    } catch {
      setError('Error de conexión con DataForSEO.')
    } finally {
      setIsLoading(false)
    }
  }

  const sorted = [...results].sort((a, b) => {
    if (sortBy === 'searchVolume') return b.searchVolume - a.searchVolume
    if (sortBy === 'cpc') return b.cpc - a.cpc
    if (sortBy === 'keywordDifficulty') return (a.keywordDifficulty ?? 100) - (b.keywordDifficulty ?? 100)
    return 0
  })

  const totalVolume = results.reduce((s, r) => s + r.searchVolume, 0)
  const avgKD = results.length > 0
    ? Math.round(results.reduce((s, r) => s + (r.keywordDifficulty ?? 0), 0) / results.length)
    : 0
  const avgCPC = results.length > 0
    ? (results.reduce((s, r) => s + r.cpc, 0) / results.length).toFixed(2)
    : '0'

  return (
    <div ref={containerRef} className="space-y-6">

      {/* Header Premium Autoskill */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500 blur-xl opacity-20 rounded-2xl" />
              <div className="relative p-3.5 bg-gradient-to-br from-violet-500/20 to-purple-500/5 border border-violet-500/30 rounded-2xl backdrop-blur-xl">
                <Target className="w-6 h-6 text-violet-400" />
              </div>
            </div>
            <div>
              <h2 className="font-display text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">
                Keyword Explorer PRO
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Search className="w-3.5 h-3.5 text-violet-500" />
                <p className="text-xs text-slate-600">Motor de Inteligencia de Búsqueda impulsado por DataForSEO</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/50 backdrop-blur-md rounded-lg border border-slate-200 shadow-inner">
             <Coins className="w-4 h-4 text-amber-400" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
               Costo: <span className="text-amber-400">15 CR</span>
             </span>
          </div>
        </div>

        {/* Search form Premium */}
        <form onSubmit={handleSearch} className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-violet-500/10 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 pointer-events-none" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Ejemplo: zapatos running mujer, curso de SEO, CRM ventas..."
              disabled={isLoading}
              className="relative w-full pl-11 pr-4 py-3.5 bg-slate-50/50 backdrop-blur-md border border-slate-200/50 rounded-xl text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all disabled:opacity-50 shadow-inner hover:border-slate-300"
            />
          </div>

          {/* Country selector */}
          <div className="relative">
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              disabled={isLoading}
              className="appearance-none h-full pl-4 pr-10 py-3.5 bg-slate-50/50 backdrop-blur-md border border-slate-200/50 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50 cursor-pointer shadow-inner font-medium min-w-[140px]"
            >
              {COUNTRIES.map(c => (
                <option key={c.value} value={c.value} className="bg-white">{c.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 pointer-events-none" />
          </div>

          <button
            type="submit"
            disabled={isLoading || !keyword.trim()}
            className="group relative px-6 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] active:scale-[0.98]"
          >
            {/* Overlay brillo hover */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            
            <div className="relative flex items-center gap-2">
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Analizando...</>
              ) : (
                <><TrendingUp className="w-5 h-5" />Extraer Datos</>
              )}
            </div>
          </button>
        </form>

        {/* Mode toggle */}
        <div className="relative z-10 mt-4 flex items-center justify-between border-t border-slate-200/50 pt-4">
          <div className="flex gap-2 p-1 bg-slate-50/50 rounded-xl border border-slate-200/50 shadow-inner inline-flex">
            {(['ideas', 'related'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  mode === m
                    ? 'bg-violet-500/20 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                }`}
              >
                {m === 'ideas' ? '💡 Ideas Semánticas' : '🔗 Términos Relacionados'}
              </button>
            ))}
          </div>
          
          {/* DataForSEO attribution */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50/30 border border-slate-200/30 backdrop-blur-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
            <a
              href="https://dataforseo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold tracking-widest uppercase text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              Verify vía DataForSEO <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-sm text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.1)] backdrop-blur-md">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Results Section */}
      {searched && results.length > 0 && (
        <div ref={resultsRef} className="space-y-6">

          {/* Premium Stats summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <Search className="w-5 h-5 text-violet-400" />, label: 'Volumen Total Relevante', value: totalVolume.toLocaleString(), glow: 'violet' },
              { icon: <Target className="w-5 h-5 text-amber-400" />, label: 'Dificultad Media', value: `${avgKD}/100`, glow: 'amber' },
              { icon: <DollarSign className="w-5 h-5 text-emerald-400" />, label: 'CPC Promedio Comercial', value: `$${avgCPC}`, glow: 'emerald' },
            ].map((s, i) => (
              <div key={i} className="relative overflow-hidden group p-5 bg-white border border-slate-200 rounded-2xl shadow-lg hover:border-slate-200 transition-all">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${s.glow}-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-${s.glow}-500/20 transition-all`} />
                <div className="relative z-10 flex items-start gap-4">
                  <div className={`p-3 bg-${s.glow}-500/10 border border-${s.glow}-500/20 rounded-xl shadow-inner`}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                    <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Container Premium */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            
            {/* Table internal header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-display text-sm font-bold text-slate-900">Análisis Extraído</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold text-violet-700 bg-violet-500/10 border border-violet-500/20 rounded-md">
                  {results.length} resultados
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sort by:</span>
                <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-inner">
                  {([
                    ['searchVolume', 'Volumen'],
                    ['cpc', 'Monetización'],
                    ['keywordDifficulty', 'Oportunidad'],
                  ] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setSortBy(val)}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all",
                        sortBy === val
                          ? "bg-violet-500/20 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto hidden-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white/50 text-[10px] text-slate-600 uppercase tracking-widest font-black">
                    <th className="px-6 py-4 text-left">Estructura Semántica</th>
                    <th className="px-6 py-4 text-right">Búsquedas/Mes</th>
                    <th className="px-6 py-4 text-center">Score KD</th>
                    <th className="px-6 py-4 text-right">Ads CPC</th>
                    <th className="px-6 py-4 text-center">Clasificación Intención</th>
                    <th className="px-6 py-4 text-center">Curva Tendencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sorted.map((kw, i) => (
                    <tr
                      key={`${kw.keyword}-${i}`}
                      className="hover:bg-slate-50/40 transition-colors group"
                    >
                      {/* Keyword */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-600 w-5 text-right shrink-0">{i + 1}.</span>
                          <span className="text-slate-800 font-bold group-hover:text-violet-700 transition-colors cursor-default">
                            {kw.keyword}
                          </span>
                        </div>
                      </td>

                      {/* Search Volume */}
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "font-black text-base drop-shadow-sm",
                          kw.searchVolume > 10000 ? "text-violet-600" : kw.searchVolume > 1000 ? "text-slate-800" : "text-slate-500"
                        )}>
                          {kw.searchVolume.toLocaleString()}
                        </span>
                      </td>

                      {/* Difficulty */}
                      <td className="px-6 py-4 text-center">
                        <DifficultyBadge value={kw.keywordDifficulty} />
                      </td>

                      {/* CPC */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-emerald-400/90 font-black text-sm drop-shadow-[0_0_5px_rgba(16,185,129,0.2)]">
                          ${kw.cpc.toFixed(2)}
                        </span>
                      </td>

                      {/* Intent */}
                      <td className="px-6 py-4 text-center">
                        {kw.searchIntent && INTENT_LABELS[kw.searchIntent] ? (
                          <span className={cn(
                            "text-[9px] uppercase tracking-wider font-black px-2.5 py-1 rounded-md border",
                            INTENT_LABELS[kw.searchIntent].color
                          )}>
                            {INTENT_LABELS[kw.searchIntent].label}
                          </span>
                        ) : (
                          <span className="text-slate-700 font-black text-[10px]">—</span>
                        )}
                      </td>

                      {/* Trend sparkline */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                          {kw.trend ? (
                            <Sparkline data={kw.trend} />
                          ) : (
                            <span className="text-slate-700 font-black text-[10px]">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty states */}
      {searched && results.length === 0 && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-dashed border-slate-200 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-slate-200">
              <BarChart2 className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-900 font-bold text-lg">No hay datos suficientes para <span className="text-violet-600">"{seed}"</span></p>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">Prueba ampliando el término, quitando tildes o usando un concepto más genérico para obtener ideas semánticas.</p>
          </div>
        </div>
      )}

      {!searched && !isLoading && (
         <div className="flex flex-col items-center justify-center py-24 px-4 bg-white border border-dashed border-slate-200 rounded-2xl relative overflow-hidden group hover:border-violet-500/30 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/80 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-violet-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-3xl rotate-3 flex items-center justify-center shadow-2xl relative z-10 group-hover:-rotate-3 transition-transform duration-500">
                <Search className="w-8 h-8 text-violet-500 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
              </div>
            </div>
            
            <h3 className="font-display text-2xl font-black text-slate-900 tracking-tight mb-2">Ingresa tu Semilla Semántica</h3>
            <p className="text-slate-600 text-sm mb-8 max-w-md">
              Generamos cientos de ideas de palabras clave con sus patrones de volumen reales, dificultad real, comportamiento y costo por clic en la base de datos de Google.
            </p>
            
            <div className="flex items-center gap-2 flex-wrap justify-center max-w-2xl">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest w-full text-center mb-1">Búsquedas Populares</span>
              {['rutina gym hipertrofia', 'cómo invertir en S&P500', 'diseño web corporativo', 'abogado laboralista'].map(ex => (
                <button
                  key={ex}
                  onClick={() => {
                    setKeyword(ex)
                    const form = document.querySelector('form')
                    if (form) setTimeout(() => form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 100)
                  }}
                  className="px-4 py-2 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:border-violet-500/50 hover:text-violet-700 hover:bg-violet-500/10 transition-all shadow-sm"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
