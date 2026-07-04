'use client'

import Link from 'next/link'
import { Network, Link2, ArrowRight, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Props {
  editorialStats: {
    total: number
    published: number
    draft: number
    pending: number
  } | null
  interlinkingOpportunities: number | null
  loading?: boolean
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${color}`}>
      <span className="text-lg font-black text-slate-900 leading-none">{value}</span>
      <span className="text-[10px] text-slate-600 mt-0.5">{label}</span>
    </div>
  )
}

export default function ContentPipelineWidget({ editorialStats, interlinkingOpportunities, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-20 rounded-xl bg-white/30 border border-slate-200/50 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Editorial Map Widget */}
      <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 group hover:border-purple-500/40 transition-all duration-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
              <Network className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">Mapa Editorial</h3>
              <p className="text-[11px] text-slate-500">
                {editorialStats
                  ? `${editorialStats.total} artículos en total`
                  : 'Sin datos del mapa'}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/editorial"
            className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors shrink-0"
          >
            Ver mapa <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {editorialStats && editorialStats.total > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" />
              {editorialStats.published} publicados
            </div>
            {editorialStats.draft > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                <FileText className="w-3 h-3" />
                {editorialStats.draft} borradores
              </div>
            )}
            {editorialStats.pending > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                {editorialStats.pending} pendientes
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-600 italic">Conecta WordPress para ver el mapa editorial</p>
        )}
      </div>

      {/* Interlinking Widget */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 group hover:border-cyan-500/40 transition-all duration-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">Enlazado Interno</h3>
              {interlinkingOpportunities !== null ? (
                interlinkingOpportunities > 0 ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <p className="text-[11px] text-amber-400 font-semibold">
                      {interlinkingOpportunities} oportunidades sin aplicar
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-400">Sin oportunidades pendientes</p>
                )
              ) : (
                <p className="text-[11px] text-slate-500">Analiza tu sitio para detectar oportunidades</p>
              )}
            </div>
          </div>
          <Link
            href="/dashboard/interlinking"
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors shrink-0"
          >
            Ver análisis <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
