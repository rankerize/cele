'use client'

import { Suspense } from 'react'
import { LayoutTemplate } from 'lucide-react'
import StrategyWizardWithParams from '@/components/strategy/StrategyWizardWithParams'

export default function CreatePage() {
  return (
    <div className="space-y-6 animate-fade-in w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
          <LayoutTemplate className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Crear Contenido (Páginas)</h1>
          <p className="text-sm text-slate-500">Genera y publica una <strong className="text-slate-700">Página</strong> en WordPress — ideal para servicios, landings y contenido evergreen.</p>
        </div>
      </div>

      {/* Flujo Principal — wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <StrategyWizardWithParams />
      </Suspense>
    </div>
  )
}
