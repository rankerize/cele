'use client'

import {
  FileText,
  TrendingUp,
  MousePointerClick,
  Link2,
  FolderInput,
  AlertTriangle,
  Ban,
  Eye,
} from 'lucide-react'
import { ActionType, ACTION_TYPE_LABELS } from '@/types/action'

interface Props {
  type: ActionType
  showLabel?: boolean
  size?: 'sm' | 'md'
}

const TYPE_CONFIG: Record<
  ActionType,
  { icon: React.ElementType; color: string }
> = {
  create_content: {
    icon: FileText,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  improve_content: {
    icon: TrendingUp,
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  },
  optimize_ctr: {
    icon: MousePointerClick,
    color: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  },
  strengthen_interlinking: {
    icon: Link2,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  reassign_category: {
    icon: FolderInput,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
  review_cannibalization: {
    icon: AlertTriangle,
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
  },
  stop_creation: {
    icon: Ban,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  manual_review: {
    icon: Eye,
    color: 'text-slate-600 bg-slate-500/10 border-slate-500/20',
  },
}

export default function ActionTypeBadge({ type, showLabel = true, size = 'sm' }: Props) {
  const { icon: Icon, color } = TYPE_CONFIG[type]
  const sizeClass = size === 'md' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[11px] gap-1'
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'

  return (
    <span
      className={`inline-flex items-center rounded-lg font-medium border ${sizeClass} ${color}`}
    >
      <Icon className={`shrink-0 ${iconSize}`} />
      {showLabel && ACTION_TYPE_LABELS[type]}
    </span>
  )
}
