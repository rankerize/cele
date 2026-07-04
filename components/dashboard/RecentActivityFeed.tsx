'use client'

import Link from 'next/link'
import { ExternalLink, FileText, RefreshCw, Sparkles } from 'lucide-react'

interface HistoryItem {
  id: string
  title: string
  status: string
  type: 'creation' | 'improvement'
  createdAt: string
  wordpressUrl?: string
  keyword?: string
}

interface Props {
  items: HistoryItem[]
  loading?: boolean
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `hace ${days}d`
  if (hours > 0) return `hace ${hours}h`
  if (mins > 0) return `hace ${mins}m`
  return 'ahora'
}

export default function RecentActivityFeed({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 rounded-lg bg-white/30 border border-slate-200/40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center gap-3 py-6 rounded-xl border border-dashed border-slate-200 text-slate-500">
        <FileText className="w-4 h-4" />
        <p className="text-sm">Aún no hay artículos publicados</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200/50 bg-white/40 hover:border-slate-300/70 hover:bg-slate-50/40 transition-all duration-150 group"
        >
          {/* Type icon */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            item.type === 'improvement'
              ? 'bg-amber-500/10 border border-amber-500/20'
              : 'bg-brand-500/10 border border-brand-500/20'
          }`}>
            {item.type === 'improvement'
              ? <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              : <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            }
          </div>

          {/* Title + keyword */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 font-medium truncate leading-tight">{item.title}</p>
            {item.keyword && (
              <p className="text-[10px] text-slate-600 truncate">{item.keyword}</p>
            )}
          </div>

          {/* Time + Link */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-600">{timeAgo(item.createdAt)}</span>
            {item.wordpressUrl && (
              <a
                href={item.wordpressUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-700 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100"
                title="Ver en WordPress"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      ))}

      {/* Link to full history */}
      <div className="pt-1">
        <Link
          href="/dashboard/history"
          className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 py-2 rounded-lg hover:bg-slate-50/50 transition-all duration-150"
        >
          <FileText className="w-3.5 h-3.5" />
          Ver historial completo
        </Link>
      </div>
    </div>
  )
}
