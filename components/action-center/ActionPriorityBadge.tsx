'use client'

import { Flame, ChevronUp, Minus, ChevronDown } from 'lucide-react'
import { ActionPriority, ACTION_PRIORITY_LABELS } from '@/types/action'

interface Props {
  priority: ActionPriority
  showLabel?: boolean
  size?: 'sm' | 'md'
}

const PRIORITY_CONFIG: Record<
  ActionPriority,
  { icon: React.ElementType; style: string; dot: string }
> = {
  critical: {
    icon: Flame,
    style: 'text-red-300 bg-red-500/15 border-red-500/30',
    dot: 'bg-red-400',
  },
  high: {
    icon: ChevronUp,
    style: 'text-orange-300 bg-orange-500/15 border-orange-500/30',
    dot: 'bg-orange-400',
  },
  medium: {
    icon: Minus,
    style: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  low: {
    icon: ChevronDown,
    style: 'text-slate-600 bg-slate-500/10 border-slate-500/20',
    dot: 'bg-slate-500',
  },
}

export default function ActionPriorityBadge({ priority, showLabel = true, size = 'sm' }: Props) {
  const { icon: Icon, style, dot } = PRIORITY_CONFIG[priority]
  const sizeClass = size === 'md' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[11px] gap-1'
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold border ${sizeClass} ${style}`}
    >
      <Icon className={`shrink-0 ${iconSize}`} />
      {showLabel && ACTION_PRIORITY_LABELS[priority]}
    </span>
  )
}
