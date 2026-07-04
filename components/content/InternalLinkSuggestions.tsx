'use client'

import React from 'react'
import { InternalLinkSuggestion } from '@/types/content'
import { Link as LinkIcon, Check, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  suggestions: InternalLinkSuggestion[]
  loading: boolean
  onApply: (suggestion: InternalLinkSuggestion) => void
  appliedUrls: string[]
}

export default function InternalLinkSuggestions({ suggestions, loading, onApply, appliedUrls }: Props) {
  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white/30 rounded-xl border border-slate-200/50 border-dashed">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-slate-600 font-medium">Analizando Mapa Editorial y contenido...</p>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white/30 rounded-xl border border-slate-200/50 border-dashed">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-slate-500" />
        </div>
        <div>
          <p className="text-sm text-white font-bold">No se encontraron enlaces naturales</p>
          <p className="text-xs text-slate-500 mt-1">La IA no detectó oportunidades claras de enlazado en este texto.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-brand-400" /> Sugerencias de Enlazado ({suggestions.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {suggestions.map((suggestion, idx) => {
          const isApplied = appliedUrls.includes(suggestion.suggestedUrl)
          
          return (
            <div 
              key={idx}
              className={cn(
                "p-4 rounded-xl border transition-all group",
                isApplied 
                   ? "bg-emerald-500/5 border-emerald-500/20" 
                   : "bg-white/50 border-slate-200 hover:border-brand-500/40"
              )}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">
                    Ancla: "{suggestion.anchorText}"
                  </p>
                  <h4 className="text-sm font-bold text-white mb-1 truncate" title={suggestion.postTitle}>
                    Hacia: {suggestion.postTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
                    {suggestion.reason}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-white/50 px-2 py-1 rounded border border-slate-200/50 max-w-max">
                     <LinkIcon className="w-3 h-3" />
                     <span className="truncate max-w-[200px]">{suggestion.suggestedUrl}</span>
                  </div>
                </div>

                <button
                  disabled={isApplied}
                  onClick={() => onApply(suggestion)}
                  className={cn(
                    "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    isApplied 
                      ? "bg-emerald-500 text-white cursor-default" 
                      : "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20 active:scale-95"
                  )}
                >
                  {isApplied ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      
      <p className="text-[10px] text-slate-500 italic px-2">
        * Al aplicar, se buscará la primera coincidencia exacta del ancla en el texto y se insertará el enlace automáticamente.
      </p>
    </div>
  )
}
