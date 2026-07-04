'use client'

import { useState, useMemo } from 'react'
import { TargetPageData } from '@/types/interlinking'
import { Search, ArrowUpDown, ChevronUp, ChevronDown, Zap, Layers, CheckSquare, Square, MinusSquare } from 'lucide-react'

interface Props {
  targets: TargetPageData[]
  onSelectTarget: (target: TargetPageData) => void
  onBatchAnalyze: (targets: TargetPageData[]) => void
}

type SortKey = 'impressions' | 'clicks' | 'position' | 'ctr' | 'title'

function OpportunityBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
  }
  const labels = { high: 'Alta', medium: 'Media', low: 'Baja' }
  const dots = { high: 'bg-emerald-400', medium: 'bg-amber-400', low: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[level]}`} />
      {labels[level]}
    </span>
  )
}

function getOpportunityLevel(target: TargetPageData): 'high' | 'medium' | 'low' {
  if (target.position >= 4 && target.position <= 10 && target.impressions > 100) return 'high'
  if (target.position >= 4 && target.position <= 20 && target.impressions > 30) return 'medium'
  return 'low'
}

export default function OpportunitiesTable({ targets, onSelectTarget, onBatchAnalyze }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('impressions')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 text-violet-400" />
      : <ChevronUp className="w-3 h-3 text-violet-400" />
  }

  const filtered = useMemo(() => {
    let list = targets.map(t => ({ ...t, _level: getOpportunityLevel(t) }))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q))
    }
    if (filterLevel !== 'all') list = list.filter(t => t._level === filterLevel)
    list.sort((a, b) => {
      let va: string | number = a[sortKey] ?? ''
      let vb: string | number = b[sortKey] ?? ''
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [targets, search, sortKey, sortDir, filterLevel])

  const allSelected = filtered.length > 0 && filtered.every(t => selectedUrls.has(t.url))
  const someSelected = filtered.some(t => selectedUrls.has(t.url)) && !allSelected
  const selectedCount = selectedUrls.size

  function toggleAll() {
    if (allSelected) {
      setSelectedUrls(prev => {
        const next = new Set(prev)
        filtered.forEach(t => next.delete(t.url))
        return next
      })
    } else {
      setSelectedUrls(prev => {
        const next = new Set(prev)
        filtered.forEach(t => next.add(t.url))
        return next
      })
    }
  }

  function toggleOne(url: string) {
    setSelectedUrls(prev => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  function handleBatchAnalyze() {
    const selected = targets.filter(t => selectedUrls.has(t.url))
    if (selected.length === 0) return
    onBatchAnalyze(selected)
  }

  const thClass = "px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors select-none"
  const tdClass = "px-3 py-3 text-sm"

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, URL o categoría..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'high', 'medium', 'low'] as const).map(level => {
            const labels = { all: 'Todas', high: 'Alta', medium: 'Media', low: 'Baja' }
            const active = filterLevel === level
            return (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                  active
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-white hover:border-slate-200'
                }`}
              >
                {labels[level]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-600">{filtered.length} de {targets.length} páginas</p>
        {selectedCount > 0 && (
          <button
            onClick={() => setSelectedUrls(new Set())}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            Limpiar selección
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-white/80 border-b border-slate-200">
              <tr>
                {/* Checkbox col */}
                <th className="px-3 py-3 w-10">
                  <button
                    onClick={toggleAll}
                    className="text-slate-500 hover:text-violet-400 transition-colors"
                  >
                    {allSelected
                      ? <CheckSquare className="w-4 h-4 text-violet-400" />
                      : someSelected
                        ? <MinusSquare className="w-4 h-4 text-violet-400" />
                        : <Square className="w-4 h-4" />
                    }
                  </button>
                </th>
                <th className={thClass} onClick={() => handleSort('title')}>
                  <span className="flex items-center gap-1">Página <SortIcon col="title" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('impressions')}>
                  <span className="flex items-center gap-1">Impresiones <SortIcon col="impressions" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('clicks')}>
                  <span className="flex items-center gap-1">Clics <SortIcon col="clicks" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('ctr')}>
                  <span className="flex items-center gap-1">CTR <SortIcon col="ctr" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('position')}>
                  <span className="flex items-center gap-1">Posición <SortIcon col="position" /></span>
                </th>
                <th className={thClass}>Categoría</th>
                <th className={thClass}>Oportunidad</th>
                <th className={thClass}>Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-600 text-sm">
                    No se encontraron páginas con los filtros actuales
                  </td>
                </tr>
              )}
              {filtered.map((target) => {
                const checked = selectedUrls.has(target.url)
                return (
                  <tr
                    key={target.url}
                    className={`transition-colors cursor-pointer group ${
                      checked ? 'bg-violet-500/5 hover:bg-violet-500/8' : 'hover:bg-white/60'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3" onClick={e => { e.stopPropagation(); toggleOne(target.url) }}>
                      <div className={`flex items-center justify-center w-4 h-4 rounded border transition-all ${
                        checked ? 'bg-violet-600 border-violet-500' : 'border-slate-600 group-hover:border-violet-500/50'
                      }`}>
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </td>
                    <td
                      className={`${tdClass} max-w-[240px]`}
                      onClick={() => onSelectTarget(target)}
                    >
                      <p className="font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                        {target.title}
                      </p>
                      <p className="text-xs text-slate-600 truncate mt-0.5">{target.url}</p>
                    </td>
                    <td className={`${tdClass} text-white font-semibold tabular-nums`} onClick={() => onSelectTarget(target)}>
                      {target.impressions.toLocaleString()}
                    </td>
                    <td className={`${tdClass} text-slate-700 tabular-nums`} onClick={() => onSelectTarget(target)}>
                      {target.clicks.toLocaleString()}
                    </td>
                    <td className={`${tdClass} tabular-nums ${target.ctr < 0.02 && target.impressions > 100 ? 'text-red-400' : 'text-slate-700'}`} onClick={() => onSelectTarget(target)}>
                      {(target.ctr * 100).toFixed(1)}%
                    </td>
                    <td className={tdClass} onClick={() => onSelectTarget(target)}>
                      <span className={`font-bold tabular-nums text-sm ${
                        target.position <= 3 ? 'text-emerald-400' :
                        target.position <= 10 ? 'text-amber-400' :
                        target.position <= 20 ? 'text-orange-400' : 'text-slate-500'
                      }`}>
                        #{Math.round(target.position)}
                      </span>
                    </td>
                    <td className={tdClass} onClick={() => onSelectTarget(target)}>
                      <span className="text-xs text-slate-600 bg-white px-2 py-0.5 rounded-md">
                        {target.category || '—'}
                      </span>
                    </td>
                    <td className={tdClass} onClick={() => onSelectTarget(target)}>
                      <OpportunityBadge level={target._level} />
                    </td>
                    <td className={tdClass}>
                      <button
                        onClick={e => { e.stopPropagation(); onSelectTarget(target) }}
                        className="flex items-center gap-1 px-3 py-1 bg-brand-600/20 hover:bg-brand-600/40 text-brand-400 hover:text-brand-300 rounded-lg text-xs font-semibold transition-all border border-brand-500/20"
                      >
                        <Zap className="w-3 h-3" />
                        Analizar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating batch action bar */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
        selectedCount > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <div className="flex items-center gap-4 px-5 py-3.5 bg-white/95 backdrop-blur-xl border border-violet-500/30 rounded-2xl shadow-2xl shadow-violet-500/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">
                {selectedCount} página{selectedCount !== 1 ? 's' : ''} seleccionada{selectedCount !== 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-violet-400 mt-0.5">Listas para análisis en lote</p>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-50" />
          <button
            onClick={handleBatchAnalyze}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-brand-600 hover:from-violet-500 hover:to-brand-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20"
          >
            <Zap className="w-3.5 h-3.5" />
            Analizar en lote
          </button>
          <button
            onClick={() => setSelectedUrls(new Set())}
            className="text-slate-500 hover:text-slate-700 text-xs transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
