'use client'

import {
  ActionStatus,
  ACTION_STATUS_LABELS,
} from '@/types/action'

interface Props {
  status: ActionStatus
  size?: 'sm' | 'md'
}

const STATUS_STYLES: Record<ActionStatus, string> = {
  pending:
    'bg-amber-500/15 text-amber-300 border border-amber-500/25 shadow-amber-500/10',
  reviewed:
    'bg-brand-500/15 text-brand-300 border border-brand-500/25 shadow-brand-500/10',
  approved:
    'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shadow-emerald-500/10',
  executing:
    'bg-purple-500/15 text-purple-300 border border-purple-500/25 shadow-purple-500/10 animate-pulse',
  executed:
    'bg-teal-500/15 text-teal-300 border border-teal-500/25 shadow-teal-500/10',
  discarded:
    'bg-slate-500/15 text-slate-600 border border-slate-500/25',
  failed:
    'bg-red-500/15 text-red-400 border border-red-500/25 shadow-red-500/10',
}

const STATUS_DOTS: Record<ActionStatus, string> = {
  pending: 'bg-amber-400',
  reviewed: 'bg-brand-400',
  approved: 'bg-emerald-400',
  executing: 'bg-purple-400 animate-pulse',
  executed: 'bg-teal-400',
  discarded: 'bg-slate-500',
  failed: 'bg-red-400',
}

export default function ActionStatusBadge({ status, size = 'sm' }: Props) {
  const sizeClass = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold shadow-sm ${sizeClass} ${STATUS_STYLES[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOTS[status]}`} />
      {ACTION_STATUS_LABELS[status]}
    </span>
  )
}
