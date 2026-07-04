'use client'

import { useState, FormEvent } from 'react'
import { ContentFormData } from '@/types/content'
import { Sparkles, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onGenerate: (data: ContentFormData) => Promise<void>
  loading: boolean
}

const intencionOptions = [
  { value: 'informativa', label: 'Informativa', desc: 'El usuario quiere aprender' },
  { value: 'comercial', label: 'Comercial', desc: 'El usuario compara opciones' },
  { value: 'comparativa', label: 'Comparativa', desc: 'El usuario evalúa alternativas' },
  { value: 'transaccional', label: 'Transaccional', desc: 'El usuario quiere comprar' },
]

const tipoPiezaOptions = [
  { value: 'blog', label: 'Artículo de blog' },
  { value: 'landing', label: 'Landing page' },
  { value: 'pagina-servicio', label: 'Página de servicio' },
  { value: 'categoria', label: 'Página de categoría' },
  { value: 'ficha-producto', label: 'Ficha de producto' },
]

const tonoOptions = [
  'Profesional y formal',
  'Cercano y conversacional',
  'Técnico y experto',
  'Persuasivo y comercial',
  'Educativo y didáctico',
  'Inspirador y motivador',
]

const longitudOptions = [
  { value: '800', label: 'Corto · ~800 palabras' },
  { value: '1200', label: 'Medio · ~1200 palabras' },
  { value: '2000', label: 'Largo · ~2000 palabras' },
  { value: '3000', label: 'Muy largo · ~3000 palabras' },
]

export default function ContentGenerator({ onGenerate, loading }: Props) {
  const [form, setForm] = useState<ContentFormData>({
    nicho: '',
    keywordPrincipal: '',
    paisMercado: '',
    intencionBusqueda: 'informativa',
    tipoPieza: 'blog',
    ctaFinal: '',
    tono: 'Profesional y formal',
    longitudAproximada: '1200',
    categoriaDeseada: '',
  })

  function update<K extends keyof ContentFormData>(key: K, value: ContentFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onGenerate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      {/* Sección 1: Información base */}
      <div className="card">
        <h2 className="font-display section-title mb-5 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-brand-600/20 flex items-center justify-center text-brand-400 text-xs font-bold">1</span>
          Información base
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="nicho">Nicho *</label>
            <input
              id="nicho"
              type="text"
              value={form.nicho}
              onChange={(e) => update('nicho', e.target.value)}
              placeholder="ej. Marketing digital, Fitness, Finanzas personales"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="keyword">Keyword principal *</label>
            <input
              id="keyword"
              type="text"
              value={form.keywordPrincipal}
              onChange={(e) => update('keywordPrincipal', e.target.value)}
              placeholder="ej. cómo hacer SEO en 2025"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="pais">País / mercado objetivo *</label>
            <input
              id="pais"
              type="text"
              value={form.paisMercado}
              onChange={(e) => update('paisMercado', e.target.value)}
              placeholder="ej. España, México, Latinoamérica"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="categoria">Categoría deseada (opcional)</label>
            <input
              id="categoria"
              type="text"
              value={form.categoriaDeseada}
              onChange={(e) => update('categoriaDeseada', e.target.value)}
              placeholder="ej. SEO, Marketing, Tutoriales"
            />
            <p className="text-xs text-slate-600 mt-1">Si no la defines, la IA la sugerirá</p>
          </div>
        </div>
      </div>

      {/* Sección 2: Intención de búsqueda */}
      <div className="card">
        <h2 className="font-display section-title mb-5 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-brand-600/20 flex items-center justify-center text-brand-400 text-xs font-bold">2</span>
          Intención de búsqueda
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {intencionOptions.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => update('intencionBusqueda', value as ContentFormData['intencionBusqueda'])}
              className={cn(
                'p-3 rounded-xl border text-left transition-all duration-200',
                form.intencionBusqueda === value
                  ? 'border-brand-500 bg-brand-600/15 text-white'
                  : 'border-slate-200 bg-white/50 text-slate-600 hover:border-slate-300'
              )}
            >
              <p className="text-sm font-medium leading-tight">{label}</p>
              <p className="text-xs text-slate-500 mt-1 leading-tight">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Sección 3: Tipo de pieza y configuración */}
      <div className="card">
        <h2 className="font-display section-title mb-5 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-brand-600/20 flex items-center justify-center text-brand-400 text-xs font-bold">3</span>
          Tipo y configuración
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="tipo">Tipo de pieza *</label>
            <div className="relative">
              <select
                id="tipo"
                value={form.tipoPieza}
                onChange={(e) => update('tipoPieza', e.target.value as ContentFormData['tipoPieza'])}
                className="appearance-none"
              >
                {tipoPiezaOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tono">Tono del contenido *</label>
            <div className="relative">
              <select
                id="tono"
                value={form.tono}
                onChange={(e) => update('tono', e.target.value)}
                className="appearance-none"
              >
                {tonoOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="longitud">Longitud aproximada *</label>
            <div className="relative">
              <select
                id="longitud"
                value={form.longitudAproximada}
                onChange={(e) => update('longitudAproximada', e.target.value)}
                className="appearance-none"
              >
                {longitudOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cta">CTA final *</label>
            <input
              id="cta"
              type="text"
              value={form.ctaFinal}
              onChange={(e) => update('ctaFinal', e.target.value)}
              placeholder="ej. Contáctanos hoy, Descarga gratis, Prueba 30 días"
              required
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between p-5 bg-white/60 border border-slate-200 rounded-xl">
        <div>
          <p className="text-sm font-medium text-white">Listo para generar</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Gemini procesará tu formulario y generará el contenido completo
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-6 py-3"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generar contenido
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="card text-center py-8 animate-pulse-soft">
          <div className="w-12 h-12 border-3 border-brand-600/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: '3px' }} />
          <p className="text-white font-medium mb-1">Generando tu contenido con IA...</p>
          <p className="text-slate-500 text-sm">Esto puede tomar 20–60 segundos</p>
        </div>
      )}
    </form>
  )
}
