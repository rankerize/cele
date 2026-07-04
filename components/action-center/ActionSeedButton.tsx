'use client'

import { useState } from 'react'
import { Download, CheckCircle2 } from 'lucide-react'

export default function ActionSeedButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)

  async function handleSeed() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/action-center/seed', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setResult(data.data)
        // Refrescar la página para mostrar nuevas acciones
        setTimeout(() => window.location.reload(), 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" />
        {result.created} nuevas · {result.skipped} omitidas
      </div>
    )
  }

  return (
    <button
      onClick={handleSeed}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium transition-all disabled:opacity-50 active:scale-95 shadow-sm"
    >
      {loading ? (
        <div className="w-4 h-4 border border-brand-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {loading ? 'Analizando módulos...' : 'Importar desde módulos'}
    </button>
  )
}
