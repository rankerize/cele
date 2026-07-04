import { ConflictLevel } from '@/types/content'
import { AlertTriangle, Info, AlertOctagon } from 'lucide-react'

export default function ConflictBadge({ level }: { level: ConflictLevel }) {
  if (level === 'alto') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">
        <AlertOctagon className="w-3.5 h-3.5" />
        Conflicto Alto
      </span>
    )
  }
  
  if (level === 'medio') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
        <AlertTriangle className="w-3.5 h-3.5" />
        Conflicto Medio
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
      <Info className="w-3.5 h-3.5" />
      Conflicto Bajo
    </span>
  )
}
