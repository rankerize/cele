'use client'

import { EditorialMapItem } from '@/types/content'
import { 
  Network, Globe, Folder, FolderOpen, Search,
  CheckCircle2, AlertTriangle, ExternalLink, Link2, 
  ChevronRight, RefreshCw, Save
} from 'lucide-react'
import { useMemo, useState } from 'react'

interface Props {
  data: EditorialMapItem[]
  categories: { id: number; name: string }[]
  onReload: () => void
}

export default function EditorialMindMap({ data, categories, onReload }: Props) {
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  const toggleCategory = (catName: string) => {
    setExpandedCats(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }))
  }

  // Procesamiento
  const { totalKeywords, byCategory } = useMemo(() => {
    let kwCount = 0
    const grouped: Record<string, EditorialMapItem[]> = {}
    
    // 1. Inicializar todas las categorías maestras de WordPress para que existan ramas vacías
    categories.forEach(c => {
      grouped[c.name] = []
    })

    // 2. Poblar con los posts
    data.forEach((item) => {
      const cat = item.categoria || 'Sin categoría'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(item)
      if (item.keywordPrincipal) kwCount++
    })

    // Ordenar las categorías por volumen de artículos (de mayor a menor)
    const sortedCategories = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)
    return { totalKeywords: kwCount, byCategory: sortedCategories }
  }, [data, categories])

  const handleCategoryChange = async (postId: number, newCategoryId: string) => {
    if (!newCategoryId) return
    
    setSavingId(postId)
    try {
      const res = await fetch('/api/editorial/post/category', {
        method: 'PUT',
        body: JSON.stringify({ postId, categoryId: parseInt(newCategoryId) }),
        headers: { 'Content-Type': 'application/json' }
      })
      const json = await res.json()
      
      if (json.success) {
        // Recargar mapa para reflejar el salto
        onReload()
      } else {
        alert('Error al cambiar la categoría: ' + json.error)
      }
    } catch (err: any) {
      alert('Error de red al actualizar la categoría.')
    } finally {
      setSavingId(null)
    }
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Network className="w-12 h-12 mb-4 opacity-50" />
        <p>Aún no hay contenido para mapear en la arquitectura.</p>
      </div>
    )
  }

  return (
    <div className="p-8 pb-32 min-w-max">
      <div className="flex items-start">
        
        {/* NODO RAÍZ (Dominio) */}
        <div className="flex items-center relative z-10">
          <div className="bg-brand-600/10 border-2 border-brand-500/30 p-4 rounded-2xl shadow-xl shadow-brand-900/20 backdrop-blur-sm relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-500 rounded-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-white leading-tight">Tu Ecosistema</h2>
                <div className="flex gap-3 text-xs font-medium mt-1">
                  <span className="text-slate-600">{data.length} Artículos</span>
                  <span className="text-emerald-400">{totalKeywords} Keywords activas</span>
                </div>
              </div>
            </div>
            <div className="absolute right-0 top-1/2 w-4 h-4 bg-white border-2 border-brand-500 rounded-full translate-x-3 -translate-y-1/2 z-20" />
            
            {/* Control Maestro Acordeón */}
            <button 
              onClick={() => {
                const allExpanded = Object.keys(expandedCats).length === byCategory.length && Object.values(expandedCats).every(v => v)
                const newState: Record<string, boolean> = {}
                byCategory.forEach(([cat]) => newState[cat] = !allExpanded)
                setExpandedCats(newState)
              }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-brand-400 hover:text-brand-300 font-medium whitespace-nowrap"
            >
              Expandir / Contraer todo
            </button>
          </div>
        </div>

        {/* RAMAS (Categorías Acordeón) */}
        <div className="flex flex-col gap-4 border-l-2 border-brand-500/20 ml-12 pl-12 relative py-4">
          
          {byCategory.map(([catName, items]) => {
            const isExpanded = expandedCats[catName] || false
            const catKws = items.filter(i => i.keywordPrincipal).length
            const isSEOPerfect = catKws === items.length
            
            return (
              <div key={catName} className="relative flex flex-col items-start group">
                {/* Línea horizontal de conexión principal desde la raíz */}
                <div className="absolute -left-12 top-[26px] w-12 border-t-2 border-brand-500/20 group-hover:border-brand-500/50 transition-colors z-10" />

                {/* NODO DE CATEGORÍA (Botón Acordeón) */}
                <button 
                  onClick={() => toggleCategory(catName)}
                  className={`bg-white border-2 transition-all p-3 shadow-lg relative z-20 flex items-center justify-between min-w-[240px] rounded-xl cursor-pointer ${
                    isExpanded ? 'border-brand-500/60 shadow-brand-500/10' : 'border-slate-200/50 hover:border-brand-400/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <FolderOpen className={`w-5 h-5 ${isSEOPerfect ? 'text-brand-400' : 'text-amber-400'}`} />
                    ) : (
                      <Folder className={`w-5 h-5 ${isSEOPerfect ? 'text-brand-400' : 'text-amber-400'}`} />
                    )}
                    <div className="text-left">
                      <h3 className="font-display text-sm font-bold text-white truncate max-w-[150px]">{catName}</h3>
                      <p className="text-xs text-slate-600">{items.length} posts</p>
                    </div>
                  </div>
                  
                  <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />

                  {/* Puntos de anclaje visuales */}
                  {isExpanded && <div className="absolute right-0 top-1/2 w-3 h-3 bg-white border-2 border-brand-500/80 rounded-full translate-x-2 -translate-y-1/2 z-30" />}
                  <div className="absolute left-0 top-1/2 w-3 h-3 bg-white border-2 border-slate-300 group-hover:border-brand-400/50 rounded-full -translate-x-2 -translate-y-1/2 z-30 transition-colors" />
                </button>

                {/* HOJAS DE LA RAMA (Artículos) */}
                {isExpanded && (
                  <div className="flex flex-col gap-3 border-l-2 border-slate-200/50 ml-10 pl-8 pt-4 pb-2 relative animate-fade-in">
                    {items.map(post => {
                      const hasKeyword = !!post.keywordPrincipal
                      const isPublished = post.status.toLowerCase().includes('publish') || post.status === 'publish'
                      const isSaving = savingId === post.id
                      const currentWpCategoryId = categories.find(c => c.name === catName)?.id || ''
                      
                      return (
                        <div key={post.id} className="relative flex items-center group/leaf">
                          <div className="absolute -left-8 top-1/2 w-8 border-t-2 border-slate-200/50 group-hover/leaf:border-brand-500/40 transition-colors -translate-y-1/2 z-10" />

                          <div className={`bg-white border transition-all p-3 rounded-lg flex items-center gap-3 w-[550px] z-20 ${
                            isSaving ? 'border-brand-500/80 opacity-70 scale-[0.98]' : 'border-slate-200 hover:border-brand-500/50 hover:shadow-brand-500/5'
                          }`}>
                            
                            {/* Semáforo SEO */}
                            <div className="shrink-0 flex flex-col items-center justify-center w-6">
                              {hasKeyword ? (
                                <div title="SEO OK (Tiene Keyword)"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
                              ) : (
                                <div title="Falta Keyword SEO"><AlertTriangle className="w-5 h-5 text-amber-500" /></div>
                              )}
                            </div>

                            {/* Info Articulo */}
                            <div className="flex-1 min-w-0 pr-2">
                              <h4 className="text-sm font-semibold text-slate-800 truncate group-hover/leaf:text-brand-300 transition-colors" title={post.title}>
                                {post.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 truncate">
                                {hasKeyword ? (
                                  <span className="text-[10px] font-medium text-emerald-500/80 bg-emerald-500/10 px-1.5 rounded flex items-center gap-1">
                                    <Search className="w-3 h-3" /> {post.keywordPrincipal}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-500/80 bg-amber-500/10 px-1.5 rounded">Sin enfocar</span>
                                )}
                                <span className={`text-[10px] font-medium ${isPublished ? 'text-slate-600' : 'text-slate-500 italic'}`}>
                                  {isPublished ? 'Publicado' : 'Borrador'}
                                </span>
                              </div>
                            </div>

                            {/* Actions (Cambiar Categoría + Link) */}
                            <div className="flex items-center gap-2 shrink-0 border-l border-slate-200 pl-3">
                              
                              {/* Selector Migración Rápida */}
                              <div className="relative flex items-center">
                                {isSaving ? (
                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-500/10 text-brand-400 text-xs rounded border border-brand-500/20">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Guardando...
                                  </div>
                                ) : (
                                  <select
                                    value={currentWpCategoryId}
                                    onChange={(e) => handleCategoryChange(post.id, e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-700 text-[11px] rounded px-2 py-1 outline-none focus:border-brand-500 cursor-pointer max-w-[130px]"
                                    title="Mover de categoría"
                                  >
                                    <option value="" disabled>Categoría...</option>
                                    {categories.map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              {/* Enlace Externo Funcional */}
                              {post.url ? (
                                <a 
                                  href={post.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-100 rounded transition-all"
                                  title="Abrir artículo en vivo"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              ) : (
                                <div className="p-1.5 text-slate-400 cursor-not-allowed">
                                  <Link2 className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

        </div>
      </div>
    </div>
  )
}
