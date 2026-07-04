'use client'

import { Globe, Zap, BarChart3, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Props {
  wordpress: boolean
  gsc: boolean
  ai: boolean
  aiProvider: string
  gscSiteUrl: string | null
  lastSynced?: string | null
}

export default function SiteStatusBanner({ wordpress, gsc, ai, aiProvider, gscSiteUrl, lastSynced }: Props) {
  const aiName = 'IA'

  const integrations = [
    { label: 'WordPress', ok: wordpress, icon: Globe },
    { label: 'Search Console', ok: gsc, icon: BarChart3 },
    { label: aiName, ok: ai, icon: Zap },
  ]

  const allOk = wordpress && gsc && ai

  return (
    <div className={`
      flex flex-col sm:flex-row sm:items-center justify-between gap-3
      px-4 py-3 rounded-2xl border text-xs
      ${allOk
        ? 'bg-emerald-500/5 border-emerald-500/20'
        : 'bg-amber-500/5 border-amber-500/20'
      }
    `}>
      {/* Site URL + status */}
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${allOk ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        {gscSiteUrl ? (
          <span className="font-semibold text-slate-700 truncate">{gscSiteUrl}</span>
        ) : (
          <span className="text-slate-500 italic">Sin sitio conectado</span>
        )}
      </div>

      {/* Integration pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {integrations.map(({ label, ok, icon: Icon }) => (
          <span
            key={label}
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium
              ${ok
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
              }
            `}
          >
            <Icon className="w-3 h-3" />
            {label}
            {ok
              ? <CheckCircle className="w-3 h-3" />
              : <XCircle className="w-3 h-3" />
            }
          </span>
        ))}

        {lastSynced && (
          <span className="flex items-center gap-1 text-slate-600 pl-1">
            <Clock className="w-3 h-3" />
            Sync hace {lastSynced}
          </span>
        )}
      </div>
    </div>
  )
}
