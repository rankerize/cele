'use client'

import { useState } from 'react'
import { EditorialMapItem } from '@/types/content'
import { ExternalLink, Loader2, AlertTriangle } from 'lucide-react'

interface Props {
  data: EditorialMapItem[]
  onStatusChange?: (id: number, newStatus: 'publish' | 'draft') => Promise<void>
}

// Confirmation modal for publishing live
function ConfirmPublishModal({
  item,
  onConfirm,
  onCancel,
}: {
  item: EditorialMapItem
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display text-white font-bold text-sm">¿Publicar en vivo?</h3>
            <p className="text-xs text-slate-600 mt-0.5">Esta acción es visible para tus lectores.</p>
          </div>
        </div>
        <p className="text-sm text-slate-700 mb-5 line-clamp-2 bg-white rounded-lg p-3 border border-slate-200">
          <span className="text-slate-500 text-xs block mb-1">Artículo:</span>
          {item.title}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 text-sm font-medium py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-white hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-sm font-bold py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-600/20"
          >
            Sí, publicar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EditorialTable({ data, onStatusChange }: Props) {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set())
  const [errorIds, setErrorIds] = useState<Map<number, string>>(new Map())
  const [confirmItem, setConfirmItem] = useState<{ item: EditorialMapItem; newStatus: 'publish' | 'draft' } | null>(null)

  const handleStatusChange = async (item: EditorialMapItem, newStatus: 'publish' | 'draft') => {
    if (!onStatusChange) return

    // Require confirmation when publishing
    if (newStatus === 'publish') {
      setConfirmItem({ item, newStatus })
      return
    }

    await applyStatusChange(item, newStatus)
  }

  const applyStatusChange = async (item: EditorialMapItem, newStatus: 'publish' | 'draft') => {
    setLoadingIds(prev => new Set(prev).add(item.id))
    setErrorIds(prev => { const m = new Map(prev); m.delete(item.id); return m })
    try {
      await onStatusChange!(item.id, newStatus)
    } catch (err) {
      setErrorIds(prev => new Map(prev).set(item.id, 'Error al actualizar'))
    } finally {
      setLoadingIds(prev => { const s = new Set(prev); s.delete(item.id); return s })
    }
  }

  return (
    <>
      {confirmItem && (
        <ConfirmPublishModal
          item={confirmItem.item}
          onConfirm={() => {
            const { item, newStatus } = confirmItem
            setConfirmItem(null)
            applyStatusChange(item, newStatus)
          }}
          onCancel={() => setConfirmItem(null)}
        />
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-600 bg-white/50 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Post / URL</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Keyword / Intención</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((item) => {
              const isLoading = loadingIds.has(item.id)
              const errorMsg = errorIds.get(item.id)
              return (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 line-clamp-1">{item.title}</p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      {item.slug} <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {item.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700 font-medium">{item.keywordPrincipal || '-'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.intencionBusqueda || 'Sin intención definida'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isLoading ? (
                        <span className={`badge flex items-center gap-1.5 ${
                          item.status === 'publish'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Actualizando...
                        </span>
                      ) : onStatusChange ? (
                        <select
                          value={item.status || 'draft'}
                          onChange={(e) => handleStatusChange(item, e.target.value as 'publish' | 'draft')}
                          className={`text-xs font-semibold rounded-lg px-2 py-1.5 border cursor-pointer outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
                            item.status === 'publish'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/50'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-500/50'
                          }`}
                        >
                          <option value="publish">✅ Publicado</option>
                          <option value="draft">📝 Borrador</option>
                        </select>
                      ) : (
                        <span className={`badge ${
                          item.status === 'publish'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.status === 'draft'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                        }`}>
                          {item.status}
                        </span>
                      )}
                      {errorMsg && (
                        <span className="text-xs text-red-400">{errorMsg}</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No hay posts para mostrar con los filtros seleccionados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
