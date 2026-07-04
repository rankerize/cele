import { Suspense } from 'react'
import { getActions, getActionCenterStats } from '@/lib/action-center'
import ActionCenterTable from '@/components/action-center/ActionCenterTable'
import ActionSeedButton from '@/components/action-center/ActionSeedButton'
import {
  Target,
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  TrendingUp,
  AlertOctagon,
} from 'lucide-react'

export const metadata = {
  title: 'Action Center — SEO Builder',
  description: 'Centro operativo de acciones SEO. Gestiona, prioriza y ejecuta todas las recomendaciones del sistema.',
}

export const dynamic = 'force-dynamic'

async function ActionCenterContent() {
  const [actions, stats] = await Promise.all([
    getActions({ status: 'all', type: 'all' }),
    getActionCenterStats(),
  ])

  const statCards = [
    {
      label: 'Total',
      value: stats.total,
      icon: Target,
      color: 'text-slate-600',
      bg: 'bg-white border-slate-200',
    },
    {
      label: 'Pendientes',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Críticas',
      value: stats.critical,
      icon: Flame,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
    },
    {
      label: 'Ejecutando',
      value: stats.executing,
      icon: Zap,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      label: 'Ejecutadas',
      value: stats.executed,
      icon: CheckCircle2,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20',
    },
    {
      label: 'Descartadas',
      value: stats.discarded,
      icon: XCircle,
      color: 'text-slate-500',
      bg: 'bg-white border-slate-200',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 flex flex-col gap-2 ${bg}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Alertas críticas */}
      {stats.critical > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-red-500/5 border border-red-500/20 px-4 py-3">
          <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">
              {stats.critical} acción{stats.critical > 1 ? 'es' : ''} crítica{stats.critical > 1 ? 's' : ''} pendiente{stats.critical > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Revisa y gestiona las acciones con prioridad crítica lo antes posible para evitar impactos negativos en el SEO.
            </p>
          </div>
        </div>
      )}

      {/* Tabla de acciones */}
      <ActionCenterTable initialActions={actions} />
    </div>
  )
}

export default async function ActionCenterPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h1 className="font-display text-xl font-black text-white">Action Center</h1>
              <p className="text-xs text-slate-500">Centro operativo SEO/editorial</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl">
            Todas las recomendaciones detectadas por el sistema en un solo lugar.
            Prioriza, aprueba y ejecuta acciones SEO desde aquí.
          </p>
        </div>

        {/* Botones de cabecera */}
        <div className="flex items-center gap-2 shrink-0">
          <ActionSeedButton />
        </div>
      </div>

      {/* Contenido dinámico */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24 text-slate-500">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Cargando acciones...</span>
            </div>
          </div>
        }
      >
        <ActionCenterContent />
      </Suspense>
    </div>
  )
}
