'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles, Search, Globe, LayoutGrid, ShoppingBag, FileText } from 'lucide-react'

const cmsOptions = [
  { value: 'wordpress', label: 'WordPress', hint: 'Sitios editoriales y corporativos' },
  { value: 'woocommerce', label: 'WooCommerce', hint: 'Tiendas sobre WordPress' },
  { value: 'shopify', label: 'Shopify', hint: 'Ecommerce SaaS' },
  { value: 'other', label: 'Otro', hint: 'Prestashop, custom, etc.' },
]

const goals = [
  { id: 'diagnostic', label: 'Diagnosticar', description: 'Quiero saber qué mejorar primero.' },
  { id: 'content', label: 'Crear contenido', description: 'Quiero producir contenidos que posicionen.' },
  { id: 'interlinking', label: 'Ordenar enlaces', description: 'Quiero reforzar categorías y clusters.' },
]

export default function CreateProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [country, setCountry] = useState('Colombia')
  const [cms, setCms] = useState('wordpress')
  const [primaryGoal, setPrimaryGoal] = useState('diagnostic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain, country, cms, primaryGoal }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear proyecto')

      router.push(`/dashboard/${data.project.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Volver a proyectos
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[32px] border border-slate-900/8 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-700">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Nuevo proyecto</p>
              <h1 className="mt-1 text-2xl font-black text-slate-950">Crea tu workspace SEO</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Cuanto más contexto nos des al inicio, mejor podrá el copiloto sugerir arquitectura, contenido e interlinking.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nombre del proyecto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Tienda de colchones"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Dominio</label>
                <input
                  type="url"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="https://midominio.com"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">País objetivo</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Colombia"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">CMS principal</label>
                <select value={cms} onChange={(e) => setCms(e.target.value)}>
                  {cmsOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Objetivo inicial</label>
              <div className="grid gap-3 md:grid-cols-3">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setPrimaryGoal(goal.id)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      primaryGoal === goal.id
                        ? 'border-emerald-500/40 bg-emerald-500/10 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-black text-slate-950">{goal.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{goal.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Creando proyecto...' : 'Crear proyecto SEO'}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-900/8 bg-slate-950 p-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Qué obtiene el usuario</p>
            <h2 className="mt-3 text-2xl font-black">Una base operativa para SEO</h2>
            <div className="mt-6 space-y-4 text-sm leading-6 text-white/70">
              <p>1. Se crea el workspace con dominio y país.</p>
              <p>2. El dashboard muestra estado, oportunidades y acciones prioritarias.</p>
              <p>3. El copiloto puede guiar diagnóstico, contenido e interlinking desde el mismo lugar.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-slate-900/8 bg-white p-5 shadow-sm">
              <Search className="h-5 w-5 text-emerald-700" />
              <p className="mt-4 text-sm font-black text-slate-950">Diagnóstico</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Conecta GSC y detecta canibalizaciones, CTR bajo y quick wins.</p>
            </div>
            <div className="rounded-[24px] border border-slate-900/8 bg-white p-5 shadow-sm">
              <FileText className="h-5 w-5 text-emerald-700" />
              <p className="mt-4 text-sm font-black text-slate-950">Contenido</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Genera briefs y borradores listos para posicionar.</p>
            </div>
            <div className="rounded-[24px] border border-slate-900/8 bg-white p-5 shadow-sm">
              <LayoutGrid className="h-5 w-5 text-emerald-700" />
              <p className="mt-4 text-sm font-black text-slate-950">Arquitectura</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Define categorías, clusters y URLs.</p>
            </div>
            <div className="rounded-[24px] border border-slate-900/8 bg-white p-5 shadow-sm">
              <ShoppingBag className="h-5 w-5 text-emerald-700" />
              <p className="mt-4 text-sm font-black text-slate-950">Ecommerce</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Funciona también para tiendas y catálogos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
