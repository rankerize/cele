import KeywordResearchPanel from '@/components/keywords/KeywordResearchPanel'

export const metadata = {
  title: 'Keyword Research — Rankerize Flow',
  description: 'Investiga keywords con datos reales de volumen, dificultad y CPC de Google.',
}

export default function KeywordResearchPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Keyword Research</h1>
        <p className="text-slate-600 text-sm mt-1">
          Datos reales de Google: volumen de búsqueda, dificultad, CPC e intención de búsqueda.
        </p>
      </div>

      <KeywordResearchPanel />
    </div>
  )
}
