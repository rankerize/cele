import { ConflictAnalysis } from '@/types/content'
import ConflictBadge from './ConflictBadge'
import { ExternalLink } from 'lucide-react'

interface ConflictPanelProps {
  analysis: ConflictAnalysis
  onProceed: () => void
  onUpdateExisting: () => void
}

export default function ConflictPanel({ analysis, onProceed, onUpdateExisting }: ConflictPanelProps) {
  const isHighRisk = analysis.level === 'alto'

  return (
    <div className={`p-5 rounded-xl border ${isHighRisk ? 'bg-red-950/20 border-red-900/50' : analysis.level === 'medio' ? 'bg-amber-950/20 border-amber-900/50' : 'bg-white border-slate-200'} animate-fade-in`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-white mb-1">Análisis de Canibalización</h3>
          <p className="text-sm text-slate-600">
            {isHighRisk 
              ? 'Hemos detectado contenido muy similar. Publicar esto podría causar canibalización SEO.' 
              : analysis.level === 'medio' 
                ? 'Hay contenido relacionado. Revisa si vale la pena publicar una pieza separada.' 
                : 'No se detectaron conflictos graves. Es seguro publicar.'}
          </p>
        </div>
        <ConflictBadge level={analysis.level} />
      </div>

      {analysis.matches.length > 0 && (
        <div className="mb-6 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Posts similares encontrados</p>
          <div className="space-y-2">
            {analysis.matches.map((match, i) => (
              <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-white/50 border border-slate-200/50">
                <div className="flex justify-between items-start">
                  <a href={match.post.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1.5">
                    {match.post.title || 'Sin Título'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-xs font-medium bg-white px-2 py-0.5 rounded text-slate-700">
                    Match: {match.score}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {match.reasons.map((reason, j) => (
                    <span key={j} className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-slate-200/50">
        {analysis.recommendedAction === 'actualizar-existente' && (
          <button onClick={onUpdateExisting} className="btn-primary flex-1">
            Mejorar post existente
          </button>
        )}
        
        <button 
          onClick={onProceed} 
          className={analysis.recommendedAction === 'crear-nuevo' ? 'btn-primary flex-1' : 'btn-secondary flex-1 border-red-500/30 text-red-300 hover:bg-red-500/10'}
        >
          {isHighRisk ? 'Publicar de todos modos (Riesgo)' : 'Continuar y publicar'}
        </button>
      </div>
    </div>
  )
}
