import { ImprovementSuggestion } from '@/types/content'
import { Lightbulb, Hash, Zap, CheckCircle2, ArrowRight, Star, Copy, Check, Link2 } from 'lucide-react'
import { useState } from 'react'

interface Props {
  suggestion: ImprovementSuggestion
  keyword?: string
  interlinkingDone?: boolean
  interlinkingCount?: number
  onApplyAll: () => void
  onApplyTitle: (title: string) => void
  onApplyContent: (content: string) => void
  onApplyKeywords: (keywords: string[]) => void
}

export default function ImprovementPanel({ suggestion, keyword, interlinkingDone, interlinkingCount, onApplyAll, onApplyTitle, onApplyContent, onApplyKeywords }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopyContent = () => {
    navigator.clipboard.writeText(suggestion.improvedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-fade-in shadow-2xl">
      <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-600/10 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-white">Mejoras Sugeridas</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Potenciado con Inteligencia Artificial</p>
            </div>
         </div>
         {suggestion.scoreSEO && (
           <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
             <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
             <span className="text-xs font-bold text-emerald-400">SEO Score: {suggestion.scoreSEO}/100</span>
           </div>
         )}
      </div>
      
      <div className="p-5 space-y-6">
        {/* Acción Principal */}
        <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">¡Optimización Completa Lista!</h4>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Hemos reescrito el contenido, mejorado los encabezados y optimizado los meta-datos para maximizar tu visibilidad.
              </p>
            </div>
          </div>
          <button 
            onClick={onApplyAll}
            className="w-full btn-primary bg-purple-600 hover:bg-purple-500 text-white border-none py-2.5 text-sm flex items-center justify-center gap-2 group"
          >
            <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
            Aplicar toda la Optimización
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Análisis Técnico */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            Análisis de Auditoría
          </h4>
          <div className="bg-white/40 border border-slate-200/50 rounded-lg p-3">
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "{suggestion.analisisSEO}"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* SEO Meta Review */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Nuevos Meta-datos para Buscadores
            </h4>
            <div className="space-y-2">
              <div className="p-3 bg-brand-500/5 border border-brand-500/10 rounded-lg">
                <span className="text-[9px] font-bold text-brand-400 uppercase">Title Tag</span>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{suggestion.improvedSeoTitle}</p>
              </div>
              <div className="p-3 bg-brand-500/5 border border-brand-500/10 rounded-lg">
                <span className="text-[9px] font-bold text-brand-400 uppercase">Meta Description</span>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">{suggestion.improvedMetaDescription}</p>
              </div>
            </div>
          </div>

          {/* Keywords */}
          {suggestion.nuevasKeywords && suggestion.nuevasKeywords.length > 0 && (
             <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5 flex-wrap">
                <Hash className="w-3 h-3" />
                Semántica Integrada (LSI)
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestion.nuevasKeywords.map((kw, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white text-[11px] text-slate-700 border border-slate-200 rounded-md">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

          {/* Enlazado Interno — Preview de Anchor Texts */}
          {(() => {
            // Combinar keyword principal + LSI keywords como anchor texts
            const anchors = [
              ...(keyword ? [keyword] : []),
              ...(suggestion.nuevasKeywords || []),
            ].filter(Boolean).slice(0, 5)

            if (anchors.length === 0) return null
            return (
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                  <Link2 className="w-3 h-3 text-emerald-400" />
                  Enlazado Interno Automático
                  {interlinkingDone && (
                    <span className="ml-auto text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      ✓ {interlinkingCount} enlace{(interlinkingCount ?? 0) !== 1 ? 's' : ''} insertado{(interlinkingCount ?? 0) !== 1 ? 's' : ''}
                    </span>
                  )}
                </h4>
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg space-y-2">
                  <p className="text-[10px] text-emerald-300/70 leading-relaxed">
                    Al publicar, otros artículos del sitio enlazarán a este usando estos anchor texts:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {anchors.map((anchor, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 rounded-md font-medium"
                      >
                        <Link2 className="w-2.5 h-2.5" />
                        {anchor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

        {/* Acciones de Mejora Detalladas */}
        <div className="space-y-3 pt-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
             <CheckCircle2 className="w-3 h-3" />
             Acciones Estratégicas Aplicadas
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestion.sugerenciasContenido.map((instruction, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-700">
                  {instruction}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Preview / Copy Section */}
        <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
            <div className="text-[10px] text-slate-500">
                La versión maestra incluye <strong>Filtro de Legibilidad</strong> y <strong>Marcado Schema</strong>.
            </div>
            <button 
                onClick={handleCopyContent}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-white transition-colors"
            >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado' : 'Copiar HTML Maestro'}
            </button>
        </div>
      </div>
    </div>
  )
}
