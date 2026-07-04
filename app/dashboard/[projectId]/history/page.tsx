'use client'

import { useEffect, useState } from 'react'
import { ContentItem } from '@/types/content'
import { getHistory, formatDate } from '@/lib/utils'
import { History, Search, CheckCircle2, Clock, XCircle, ExternalLink, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import ImpactAnalysis from '@/components/history/ImpactAnalysis'

export default function HistoryPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [impactItem, setImpactItem] = useState<{ id: string; url: string } | null>(null)

  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await getHistory()
        setItems(history)
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [])

  const filtered = items.filter((item) => {
    const s = search.toLowerCase()
    if (item.type === 'improvement') {
      return (
        (item.improvementData?.improvedTitle || '').toLowerCase().includes(s) ||
        (item.wordpressPostUrl || '').toLowerCase().includes(s)
      )
    }
    // 'creation' y 'batch' comparten misma estructura de búsqueda
    return (
      (item.generatedContent?.titleSEO || '').toLowerCase().includes(s) ||
      (item.formData?.keywordPrincipal || '').toLowerCase().includes(s) ||
      (item.categoryName || '').toLowerCase().includes(s)
    )
  })

  const statusConfig = {
    generated: { label: 'Generado', icon: Clock, className: 'badge-yellow' },
    sent: { label: 'Publicado', icon: CheckCircle2, className: 'badge-green' },
    improved: { label: 'Mejorado', icon: CheckCircle2, className: 'badge-purple' },
    error: { label: 'Error', icon: XCircle, className: 'badge-red' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <History className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Historial</h1>
            <p className="text-sm text-slate-500">{items.length} contenidos generados</p>
          </div>
        </div>
        <Link href="/dashboard/create" className="btn-primary">
          Crear nuevo
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, keyword o categoría..."
          className="pl-9"
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Clock className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <History className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-white font-medium mb-1">
            {items.length === 0 ? 'Sin historial todavía' : 'Sin resultados'}
          </p>
          <p className="text-slate-500 text-sm mb-6">
            {items.length === 0
              ? 'Crea tu primer contenido para verlo aquí'
              : 'Prueba con otra búsqueda'}
          </p>
          {items.length === 0 && (
            <Link href="/dashboard/create" className="btn-primary inline-flex">
              Crear contenido
            </Link>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                {['Fecha', 'Tipo', 'Keyword / Info', 'Título / Resultado', 'Categoría / GSC', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const status = statusConfig[item.status]
                const StatusIcon = status.icon
                const canSeeImpact = item.type === 'improvement' && !!item.wordpressPostUrl
                return (
                  <tr key={item.id} className="border-b border-slate-200/50 hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        item.type === 'improvement'
                          ? 'bg-purple-500/10 text-purple-400'
                          : item.type === 'batch'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-brand-500/10 text-brand-400'
                      }`}>
                        {item.type === 'improvement' ? 'Mejora' : item.type === 'batch' ? 'Lote' : 'Nuevo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-gray text-xs">
                        {item.type === 'improvement' ? 'Post Existente' : item.formData?.keywordPrincipal}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm text-slate-800 truncate">
                        {item.type === 'improvement'
                          ? item.improvementData?.improvedTitle
                          : item.generatedContent?.titleSEO}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {item.type === 'improvement' && item.gscMetrics ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-slate-500">GSC al cambio:</span>
                          <span className="text-xs text-emerald-400 font-medium">
                            Pos: {Math.round(item.gscMetrics.position)} | Imp: {item.gscMetrics.impressions}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">
                          {item.categoryName || item.generatedContent?.categoriaSugerida || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${status.className} flex items-center gap-1.5 w-fit`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.wordpressPostUrl && (
                          <a
                            href={item.wordpressPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Ver post
                          </a>
                        )}
                        {canSeeImpact && (
                          <button
                            onClick={() => setImpactItem({ id: item.id, url: item.wordpressPostUrl! })}
                            className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 rounded-lg border border-purple-500/20"
                          >
                            <BarChart3 className="w-3 h-3" />
                            Impacto
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Impact Modal */}
      {impactItem && (
        <ImpactAnalysis
          historyItemId={impactItem.id}
          postUrl={impactItem.url}
          onClose={() => setImpactItem(null)}
        />
      )}
    </div>
  )
}
