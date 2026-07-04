import { useState, useEffect } from 'react'
import { X, Check, Loader2, Sparkles, FolderPlus } from 'lucide-react'
import { AutoCategorizeResult } from '@/types/content'

interface AutoCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  posts: { id: number; title: string }[]
  onComplete: () => void
}

export default function AutoCategoryModal({ isOpen, onClose, posts, onComplete }: AutoCategoryModalProps) {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<AutoCategorizeResult[]>([])
  const [error, setError] = useState('')
  const [processingState, setProcessingState] = useState<{ [postId: number]: 'pending' | 'saving' | 'done' | 'error' }>({})

  useEffect(() => {
    if (isOpen) {
      if (posts.length > 0) {
        analyze()
      } else {
        setLoading(false)
        setError('No hay posts seleccionados para analizar.')
      }
    } else {
      setResults([])
      setError('')
      setProcessingState({})
    }
  }, [isOpen])

  const analyze = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/editorial/auto-categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setResults(json.data)
      const initialState: any = {}
      json.data.forEach((r: AutoCategorizeResult) => initialState[r.postId] = 'pending')
      setProcessingState(initialState)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (result: AutoCategorizeResult) => {
    setProcessingState(prev => ({ ...prev, [result.postId]: 'saving' }))
    try {
      const res = await fetch('/api/wordpress/posts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: result.postId, categoryName: result.proposedCategory })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      
      setProcessingState(prev => ({ ...prev, [result.postId]: 'done' }))
    } catch (err) {
      console.error(err)
      setProcessingState(prev => ({ ...prev, [result.postId]: 'error' }))
    }
  }

  const allDone = results.length > 0 && results.every(r => processingState[r.postId] === 'done')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white leading-tight">Categorización Inteligente</h2>
              <p className="text-sm text-slate-500">Analizando {posts.length} entradas sin categoría</p>
            </div>
          </div>
          <button onClick={() => { onClose(); if(allDone) onComplete(); }} className="p-2 text-slate-600 hover:text-white rounded-lg hover:bg-slate-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 hidden-scrollbar relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
              <p className="text-slate-600 font-medium animate-pulse">Analizando con Gemini AI...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {results.map(result => {
                const post = posts.find(p => p.id === result.postId)
                const state = processingState[result.postId]
                
                return (
                  <div key={result.postId} className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-display text-white font-medium text-sm mb-1">{post?.title || 'Entrada Desconocida'}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500">Sugerencia:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${result.isNewCategory ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          {result.isNewCategory && <FolderPlus className="w-3 h-3" />}
                          {result.proposedCategory}
                        </span>
                        {result.isNewCategory && (
                          <span className="text-[10px] text-amber-500/80 uppercase font-bold tracking-wider">(Se creará nueva)</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-2 italic flex items-start gap-1">
                        <span className="text-brand-400 text-xl leading-none">"</span>
                        {result.reason}
                        <span className="text-brand-400 text-xl leading-none">"</span>
                      </p>
                    </div>

                    <div className="shrink-0">
                      {state === 'done' ? (
                        <div className="flex items-center gap-2 text-emerald-400 px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Aplicado</span>
                        </div>
                      ) : state === 'saving' ? (
                        <button disabled className="btn-secondary opacity-50 cursor-not-allowed flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </button>
                      ) : state === 'error' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 text-xs">Error</span>
                          <button onClick={() => handleApprove(result)} className="btn-secondary py-1.5 px-3 text-xs">Reintentar</button>
                        </div>
                      ) : (
                        <button onClick={() => handleApprove(result)} className="btn-primary py-2 px-4 shadow-brand text-sm shadow-md">
                          Aprobar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 bg-white/50 flex justify-end gap-3 rounded-b-xl">
          <button onClick={() => { onClose(); if(allDone) onComplete(); }} className="btn-secondary">
            {allDone ? 'Finalizar' : 'Cerrar'}
          </button>
          {!loading && results.length > 0 && !allDone && (
            <button 
              onClick={() => {
                results.forEach(r => {
                  if (processingState[r.postId] === 'pending' || processingState[r.postId] === 'error') {
                    handleApprove(r)
                  }
                })
              }} 
              className="btn-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-emerald"
            >
              Aprobar Todos
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
