'use client'

import Link from 'next/link'
import { PenSquare, RefreshCw, Layers, BarChart3 } from 'lucide-react'

interface Props {
  aiName: string
}

export default function QuickActionBar({ aiName }: Props) {
  const actions = [
    {
      href: '/dashboard/create',
      icon: PenSquare,
      label: 'Nuevo Artículo',
      desc: `Generar con ${aiName}`,
      color: 'text-brand-400',
      bg: 'bg-brand-600/10 border-brand-500/20 hover:border-brand-500/40 hover:bg-brand-600/15',
    },
    {
      href: '/dashboard/improve',
      icon: RefreshCw,
      label: 'Optimizar',
      desc: 'Mejorar contenido existente',
      color: 'text-amber-400',
      bg: 'bg-amber-600/10 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-600/15',
    },
    {
      href: '/dashboard/batch',
      icon: Layers,
      label: 'Plan de Batch',
      desc: 'Cluster de artículos en serie',
      color: 'text-emerald-400',
      bg: 'bg-emerald-600/10 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-600/15',
    },
    {
      href: '/dashboard/seo',
      icon: BarChart3,
      label: 'Análisis SEO',
      desc: 'Ver keywords y canibalizaciones',
      color: 'text-purple-400',
      bg: 'bg-purple-600/10 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-600/15',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {actions.map(({ href, icon: Icon, label, desc, color, bg }) => (
        <Link
          key={href}
          href={href}
          className={`flex flex-col gap-1.5 p-3.5 rounded-xl border transition-all duration-200 group ${bg}`}
        >
          <Icon className={`w-4 h-4 ${color}`} />
          <div>
            <p className="text-xs font-bold text-slate-900">{label}</p>
            <p className="text-[10px] text-slate-500 leading-snug">{desc}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
