'use client'

import Link from 'next/link'
import { CheckCircle2, ExternalLink, PenSquare, Tag, Plus } from 'lucide-react'

interface Props {
  result: {
    postId: number
    postUrl: string
    adminUrl: string
    categoryName: string
    categoryCreated: boolean
  }
  onCreateNew: () => void
}

export default function PublishResult({ result, onCreateNew }: Props) {
  return (
    <div className="animate-slide-up max-w-2xl mx-auto">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white mb-2">¡Publicado correctamente!</h2>
        <p className="text-slate-600 text-sm">
          La entrada se guardó como borrador en WordPress y está lista para revisión.
        </p>
      </div>

      {/* Details card */}
      <div className="card space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-lg">
            <p className="text-xs text-slate-500 mb-1">ID del post</p>
            <p className="text-sm font-mono text-white">#{result.postId}</p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Estado</p>
            <span className="badge-yellow">Borrador (draft)</span>
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            <p className="text-xs text-slate-500">Categoría asignada</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-white font-medium">{result.categoryName}</p>
            {result.categoryCreated && (
              <span className="badge-green text-xs">
                <Plus className="w-2.5 h-2.5 mr-0.5" />
                Creada nueva
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <a
          href={result.adminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full justify-center py-3 text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          Ver en el panel de WordPress
        </a>

        <button
          onClick={onCreateNew}
          className="btn-secondary w-full justify-center py-3 text-sm"
        >
          <PenSquare className="w-4 h-4" />
          Crear nuevo contenido
        </button>

        <Link
          href="/dashboard/history"
          className="btn-secondary w-full justify-center py-2.5 text-sm"
        >
          Ver historial de contenidos
        </Link>
      </div>
    </div>
  )
}
