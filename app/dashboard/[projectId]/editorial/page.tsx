'use client'

import { useState, useEffect, useRef } from 'react'
import { EditorialMapItem } from '@/types/content'
import { Network, Search, Loader2, Plus, X, Check, Sparkles, ChevronDown } from 'lucide-react'
import EditorialTable from '@/components/editorial/EditorialTable'
import EditorialMindMap from '@/components/editorial/EditorialMindMap'
import AutoCategoryModal from '@/components/editorial/AutoCategoryModal'

export default function EditorialMapPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EditorialMapItem[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [view, setView] = useState<'table' | 'tree'>('tree')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'publish' | 'draft'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [statusOpen, setStatusOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)
  const [loadingStep, setLoadingStep] = useState(0)

  const LOADING_STEPS = [
    { icon: '🔗', text: 'Conectando con tu sitio WordPress...' },
    { icon: '📄', text: 'Escaneando entradas y borradores...' },
    { icon: '🗂️', text: 'Mapeando categorías y keywords...' },
    { icon: '🏗️', text: 'Construyendo tu arquitectura editorial...' },
    { icon: '✨', text: 'Preparando el mapa de contenidos...' },
  ]

  // Estados para auto-categorización
  const [isAutoCatModalOpen, setIsAutoCatModalOpen] = useState(false)
  const [uncategorizedPosts, setUncategorizedPosts] = useState<{ id: number; title: string }[]>([])

  // Estados para crear categorías
  const [isCreatingCat, setIsCreatingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [isSavingCat, setIsSavingCat] = useState(false)

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      setIsCreatingCat(false)
      return
    }
    setIsSavingCat(true)
    try {
      const res = await fetch('/api/wordpress/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName })
      })
      if (res.ok) {
        setNewCatName('')
        setIsCreatingCat(false)
        loadData() // Recarga el mapa y las categorías
      }
    } catch(err) {
      console.error(err)
    } finally {
      setIsSavingCat(false)
    }
  }

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/editorial/map').then(res => res.json()),
      fetch('/api/wordpress/categories').then(res => res.json())
    ])
      .then(([mapJson, catJson]) => {
        if (mapJson.success) setData(mapJson.data)
        if (catJson.success) setCategories(catJson.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Rotating copy during load
  useEffect(() => {
    if (!loading) return
    setLoadingStep(0)
    const interval = setInterval(() => {
      setLoadingStep(s => (s + 1) % LOADING_STEPS.length)
    }, 1800)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.slug.toLowerCase().includes(search.toLowerCase()) ||
      item.categoria.toLowerCase().includes(search.toLowerCase()) ||
      (item.keywordPrincipal && item.keywordPrincipal.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesCategory = filterCategory === 'all' || item.categoria === filterCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleUpdateStatus = async (id: number, newStatus: 'publish' | 'draft') => {
    try {
      const res = await fetch('/api/wordpress/post/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      // Optimistically update local state
      setData(prev => prev.map(item =>
        item.id === id ? { ...item, status: newStatus } : item
      ))
    } catch (err) {
      console.error('Error al actualizar estado:', err)
      throw err
    }
  }

  const handleOpenAutoCat = () => {
    const uncategorized = data.filter(d => !d.categoria || d.categoria.toLowerCase() === 'sin categoría' || d.categoria.toLowerCase() === 'uncategorized')
    setUncategorizedPosts(uncategorized.map(u => ({ id: u.id, title: u.title })))
    setIsAutoCatModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <AutoCategoryModal 
        isOpen={isAutoCatModalOpen} 
        onClose={() => setIsAutoCatModalOpen(false)} 
        posts={uncategorizedPosts}
        onComplete={() => {
          setIsAutoCatModalOpen(false)
          loadData() 
        }}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
            <Network className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Mapa Editorial</h1>
            <p className="text-sm text-slate-500">Analiza y organiza toda tu arquitectura de contenidos</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-200 p-1.5 rounded-lg">
          <button
            onClick={handleOpenAutoCat}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 border border-brand-500/20 transition-colors mr-2 hidden md:flex"
            title="Analizar y clasificar posts 'Sin categoría' con IA"
          >
            <Sparkles className="w-4 h-4" />
            Clasificar Entradas
          </button>
          
          <div className="w-px h-6 bg-white mr-2 hidden md:block"></div>

          <button
            onClick={() => setView('table')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'table' ? 'bg-slate-50 text-white' : 'text-slate-600 hover:text-white hover:bg-slate-50'
            }`}
          >
            Tabla
          </button>
          <button
            onClick={() => setView('tree')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'tree' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-white hover:bg-slate-50'
            }`}
          >
            Mapa Conceptual
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

            {/* Búsqueda */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por título, keyword, categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            {/* Filtros en la misma fila */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Estado filter */}
              <div ref={statusRef} className="relative">
                <button
                  onClick={() => { setStatusOpen(o => !o); setCatOpen(false) }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150 ${
                    filterStatus !== 'all'
                      ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-white'
                  }`}
                >
                  <span>
                    {filterStatus === 'all' ? 'Todos los estados' : filterStatus === 'publish' ? '✅ Publicados' : '📝 Borradores'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${statusOpen ? 'rotate-180' : ''}`} />
                </button>
                {statusOpen && (
                  <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[170px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                    {[
                      { value: 'all', label: 'Todos los estados' },
                      { value: 'publish', label: '✅ Publicados' },
                      { value: 'draft', label: '📝 Borradores' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setFilterStatus(opt.value as 'all' | 'publish' | 'draft'); setStatusOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                          filterStatus === opt.value
                            ? 'bg-brand-600/30 text-brand-300 font-semibold'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Categoría filter */}
              <div ref={catRef} className="relative">
                <button
                  onClick={() => { setCatOpen(o => !o); setStatusOpen(false) }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150 ${
                    filterCategory !== 'all'
                      ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-white'
                  }`}
                >
                  <span className="max-w-[140px] truncate">
                    {filterCategory === 'all' ? 'Todas las categorías' : filterCategory}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
                </button>
                {catOpen && (
                  <div className="absolute top-full left-0 mt-1.5 z-50 w-56 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl animate-fade-in">
                    <button
                      onClick={() => { setFilterCategory('all'); setCatOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                        filterCategory === 'all'
                          ? 'bg-brand-600/30 text-brand-300 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-white'
                      }`}
                    >
                      Todas las categorías
                    </button>
                    <div className="border-t border-slate-200/50 mx-2" />
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setFilterCategory(cat.name); setCatOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                          filterCategory === cat.name
                            ? 'bg-brand-600/30 text-brand-300 font-semibold'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-white'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {(filterStatus !== 'all' || filterCategory !== 'all') && (
                <button
                  onClick={() => { setFilterStatus('all'); setFilterCategory('all') }}
                  className="text-xs text-slate-600 hover:text-white flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-3 h-3" /> Limpiar
                </button>
              )}
            </div>
          </div>


          
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            
            {/* Creador de Categorías */}
            <div className="flex items-center">
              {isCreatingCat ? (
                <div className="flex items-center gap-2 bg-white border border-brand-500/50 rounded-lg p-1 animate-fade-in">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nueva categoría..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    className="bg-transparent border-none text-sm text-white focus:outline-none focus:ring-0 w-32 px-2"
                    disabled={isSavingCat}
                  />
                  <button 
                    onClick={handleCreateCategory}
                    disabled={isSavingCat || !newCatName.trim()}
                    className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors disabled:opacity-50"
                  >
                    {isSavingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => { setIsCreatingCat(false); setNewCatName('') }}
                    disabled={isSavingCat}
                    className="p-1 hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreatingCat(true)}
                  className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-500/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Rama
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600 border-l border-slate-200 pl-4">
              <span className="font-semibold text-white">{filteredData.length}</span> entradas
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-x-auto relative hidden-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center">
              {/* Progress bar */}
              <div className="w-full h-0.5 bg-slate-50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 via-violet-500 to-brand-400"
                  style={{
                    width: '60%',
                    animation: 'shimmer-bar 1.6s ease-in-out infinite alternate',
                  }}
                />
              </div>

              {/* Rotating copy */}
              <div className="flex flex-col items-center justify-center gap-3 py-8 px-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" style={{ animation: 'pulse-icon 1.8s ease-in-out infinite' }}>
                    {LOADING_STEPS[loadingStep].icon}
                  </span>
                  <p
                    key={loadingStep}
                    className="text-sm font-medium text-slate-700"
                    style={{ animation: 'fade-step 0.4s ease-out' }}
                  >
                    {LOADING_STEPS[loadingStep].text}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {LOADING_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-500"
                      style={{
                        width: i === loadingStep ? '20px' : '6px',
                        height: '6px',
                        background: i === loadingStep ? 'rgb(99 102 241)' : 'rgb(51 65 85)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Skeleton rows */}
              <div className="w-full px-6 pb-6 space-y-0 border-t border-slate-200">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 py-4 border-b border-slate-200/60"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    {/* Title col */}
                    <div className="flex-1 space-y-2">
                      <div
                        className="h-3 rounded-full bg-slate-50"
                        style={{
                          width: `${60 + (i % 3) * 12}%`,
                          animation: 'shimmer 1.8s ease-in-out infinite',
                          animationDelay: `${i * 120}ms`,
                        }}
                      />
                      <div
                        className="h-2 rounded-full bg-white"
                        style={{
                          width: `${30 + (i % 4) * 8}%`,
                          animation: 'shimmer 1.8s ease-in-out infinite',
                          animationDelay: `${i * 120 + 200}ms`,
                        }}
                      />
                    </div>
                    {/* Category pill */}
                    <div
                      className="h-5 w-28 rounded-full bg-slate-50 shrink-0"
                      style={{
                        animation: 'shimmer 1.8s ease-in-out infinite',
                        animationDelay: `${i * 120 + 80}ms`,
                      }}
                    />
                    {/* Keyword col */}
                    <div className="w-48 shrink-0 space-y-1.5 hidden md:block">
                      <div
                        className="h-2.5 rounded-full bg-slate-50"
                        style={{
                          width: '80%',
                          animation: 'shimmer 1.8s ease-in-out infinite',
                          animationDelay: `${i * 120 + 160}ms`,
                        }}
                      />
                      <div
                        className="h-2 rounded-full bg-white"
                        style={{
                          width: '55%',
                          animation: 'shimmer 1.8s ease-in-out infinite',
                          animationDelay: `${i * 120 + 240}ms`,
                        }}
                      />
                    </div>
                    {/* Status badge */}
                    <div
                      className="h-5 w-16 rounded-md bg-slate-50 shrink-0"
                      style={{
                        animation: 'shimmer 1.8s ease-in-out infinite',
                        animationDelay: `${i * 120 + 320}ms`,
                      }}
                    />
                  </div>
                ))}
              </div>

              <style>{`
                @keyframes shimmer {
                  0%, 100% { opacity: 0.4; }
                  50% { opacity: 0.9; }
                }
                @keyframes shimmer-bar {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(200%); }
                }
                @keyframes fade-step {
                  from { opacity: 0; transform: translateY(6px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-icon {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.2); }
                }
              `}</style>
            </div>
          ) : view === 'table' ? (
            <EditorialTable data={filteredData} onStatusChange={handleUpdateStatus} />
          ) : (
            <EditorialMindMap 
              data={filteredData} 
              categories={categories}
              onReload={loadData}
            />
          )}
        </div>
      </div>
    </div>
  )
}
