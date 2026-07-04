import { PenSquare } from 'lucide-react'

export default function AdsCreativesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
          <PenSquare className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black text-white tracking-tight">Generador de Copies Ads</h1>
          <p className="text-sm text-slate-600">Crea textos persuasivos para Meta Ads, Google Ads y TikTok con fórmulas de copy probadas.</p>
        </div>
      </div>

      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
        <h2 className="font-display text-xl font-bold text-white mb-2">Módulo en Construcción</h2>
        <p className="text-slate-600">Esta herramienta estará disponible muy pronto como parte de la expansión a pauta digital.</p>
      </div>
    </div>
  )
}
