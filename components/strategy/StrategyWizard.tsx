'use client'

import { useState } from 'react'
import { EditorialStrategyInput, EditorialStrategyOutput, WriterOutput, ProjectContext } from '@/types/strategy'
import { Globe, ArrowRight, Loader2, ListTree, FileText, CheckCircle } from 'lucide-react'
import ContentEditor from '@/components/content/ContentEditor'
import PublishResult from '@/components/content/PublishResult'
import { GeneratedContent } from '@/types/content'
import { generateId } from '@/lib/utils'

type FlowStep = 'context' | 'brief' | 'draft' | 'published'

const NICHES = ['Salud y Bienestar', 'Tecnología', 'Finanzas', 'Marketing', 'Educación', 'Hogar y Decoración', 'Otro']

interface StrategyWizardProps {
  initialData?: {
    keyword?: string
    niche?: string
    country?: string
  }
  projectContext?: ProjectContext
}

export default function StrategyWizard({ initialData, projectContext }: StrategyWizardProps = {}) {
  const [step, setStep] = useState<FlowStep>('context')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form State — pre-fill from Viral Hunter if provided
  const [inputData, setInputData] = useState<EditorialStrategyInput>({
    keyword: initialData?.keyword ?? '',
    country: initialData?.country ?? projectContext?.country ?? 'Global',
    niche: initialData?.niche ?? NICHES[0],
    intent: 'Informativa / Educativa',
    suggestedCategory: '',
    editorialDecision: 'CREATE'
  })

  // Strategy Output
  const [strategy, setStrategy] = useState<EditorialStrategyOutput | null>(null)
  
  // Writer Output
  const [draft, setDraft] = useState<WriterOutput | null>(null)
  
  // Publish Output
  const [publishResult, setPublishResult] = useState<any>(null)

  // Handlers
  const handleGenerateStrategy = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/strategy/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inputData,
          projectId: projectContext?.projectId,
        })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      
      setStrategy(json.data)
      setStep('brief')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleWriteContent = async () => {
    if (!strategy) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/strategy/write-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, projectId: projectContext?.projectId })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      
      setDraft(json.data)
      setStep('draft')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (editedContent: any) => {
    setLoading(true)
    setError('')
    try {
      // Publicar como Página (Page) — no como entrada (post)
      const res = await fetch('/api/wordpress/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedContent.title,
          slug: editedContent.slug,
          content: editedContent.content,
          excerpt: editedContent.excerpt,
          metaDescription: editedContent.metaDescription,
          categoria: strategy?.suggestedCategory.name || 'Uncategorized',
          faqs: [],
        })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      setPublishResult(json.data)
      setStep('published')

      // Guardar en historial
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: generateId(),
            createdAt: new Date().toISOString(),
            type: 'creation',
            status: 'sent',
            wordpressPostUrl: json.data?.postUrl || '',
            categoryName: json.data?.categoryName || strategy?.suggestedCategory.name || '',
            formData: {
              keywordPrincipal: inputData.keyword,
              tipoPieza: inputData.intent,
              nicho: inputData.niche,
              paisMercado: inputData.country,
            },
            generatedContent: {
              titleSEO: editedContent.title,
              slugSugerido: editedContent.slug,
              metaDescription: editedContent.metaDescription,
              categoriaSugerida: strategy?.suggestedCategory.name || '',
            },
          })
        })
      } catch (histErr) {
        console.warn('Publicado en WP, error al guardar historial:', histErr)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Adapter to feed legacy ContentEditor
  const getLegacyGeneratedContent = (): GeneratedContent | null => {
    if (!draft || !strategy) return null
    return {
      titleSEO: draft.title,
      slugSugerido: draft.slug,
      metaDescription: draft.metaDescription,
      borrador: draft.htmlContent,
      categoriaSugerida: strategy.suggestedCategory.name,
      keywordsSecundarias: strategy.secondaryKeywords || [],
      intencionRefinada: strategy.refinedIntent || '',
      estructuraH1: strategy.outline.find(o => o.type === 'H1')?.label || draft.title,
      estructuraH2: strategy.outline.filter(o => o.type === 'H2').map(o => o.label),
      preguntasFrecuentes: strategy.faqs.map(f => ({ pregunta: f.question, respuesta: f.answerSnippet })) || [],
      fuentes: [],
      // campos requeridos por TS para este fallback legacy
      title: draft.title,
      suggestedSlug: draft.slug,
      htmlContent: draft.htmlContent,
      suggestedCategory: strategy.suggestedCategory.name,
      explanation: 'Generado desde el Wizard Estratégico',
      focusKeyword: strategy.primaryKeyword
    } as any
  }

  // Status visualizer
  const renderSteps = () => {
    const s1 = ['context', 'brief', 'draft', 'published'].indexOf(step) >= 0
    const s2 = ['brief', 'draft', 'published'].indexOf(step) >= 0
    const s3 = ['draft', 'published'].indexOf(step) >= 0
    
    return (
      <div className="flex flex-wrap items-center gap-4 text-sm font-medium mb-8">
        <div className={`flex items-center gap-2 ${s1 ? 'text-brand-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${s1 ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 bg-white'}`}>1</div>
          Contexto
        </div>
        <div className={`h-px w-8 ${s2 ? 'bg-brand-500/50' : 'bg-slate-50'}`} />
        <div className={`flex items-center gap-2 ${s2 ? 'text-brand-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${s2 ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 bg-white'}`}>2</div>
          Brief Editorial
        </div>
        <div className={`h-px w-8 ${s3 ? 'bg-brand-500/50' : 'bg-slate-50'}`} />
        <div className={`flex items-center gap-2 ${s3 ? 'text-brand-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${s3 ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 bg-white'}`}>3</div>
          Borrador Final
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in w-full max-w-5xl mx-auto space-y-6">
      
      {renderSteps()}

      {error && (
         <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
            <strong>Error:</strong> {error}
         </div>
      )}

      {projectContext && (
        <div className="card border-slate-200 bg-white/80 mb-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Workspace activo</p>
              <h2 className="font-display text-lg font-bold text-slate-900">{projectContext.name}</h2>
              <p className="text-sm text-slate-600">{projectContext.domain}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest font-bold">
              {projectContext.country && <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">{projectContext.country}</span>}
              {projectContext.cms && <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{projectContext.cms}</span>}
              {projectContext.primaryGoal && <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">{projectContext.primaryGoal}</span>}
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: CONTEXT */}
      {step === 'context' && (
        <form onSubmit={handleGenerateStrategy} className="card space-y-5 shadow-lg border-slate-200">
          <div className="border-b border-slate-200 pb-4 mb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-brand-500" /> Nueva Página Estratégica
                </h2>
                <p className="text-sm text-slate-600 mt-1">El sistema generará el contenido y lo publicará como <strong className="text-slate-900">Página</strong> en WordPress (no como entrada de blog).</p>
              </div>
              {initialData?.keyword && (
                <span className="shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400 flex items-center gap-1.5">
                  🔥 Pre-relleno desde Viral Hunter
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-group">
              <label>Keyword Principal (Objetivo)</label>
              <input required value={inputData.keyword} onChange={e => setInputData({...inputData, keyword: e.target.value})} placeholder="Ej: como curar una olla de hierro..." />
            </div>
            
            <div className="form-group">
              <label>Intención de Búsqueda (Google)</label>
              <input required value={inputData.intent} onChange={e => setInputData({...inputData, intent: e.target.value})} placeholder="Ej: Educativa / Resolver un problema" />
            </div>

            <div className="form-group">
              <label>Nicho de Mercado</label>
              <select value={inputData.niche} onChange={e => setInputData({...inputData, niche: e.target.value})}>
                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>País / Audiencia</label>
              <input value={inputData.country} onChange={e => setInputData({...inputData, country: e.target.value})} placeholder="Ej: España, Global, México" />
            </div>
            
            <div className="form-group md:col-span-2">
              <label>Categoría preferida (Opcional, la IA propondrá una si la dejas vacía)</label>
              <input value={inputData.suggestedCategory} onChange={e => setInputData({...inputData, suggestedCategory: e.target.value})} placeholder="Nombre de categoría ej: Recetas" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto px-8 py-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListTree className="w-4 h-4" />}
              {loading ? 'Analizando WordPress...' : 'Generar Plan de Página'}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: BRIEF */}
      {step === 'brief' && strategy && (
        <div className="space-y-6 animate-fade-in">
           <div className="card border-slate-200 space-y-6 relative overflow-hidden">
             
             {/* Decoración */}
             <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-brand-500 to-purple-500" />
             
             <div className="pl-4">
                <h2 className="font-display text-xl font-bold text-slate-900 mb-1">Brief editorial generado</h2>
                <p className="text-sm text-slate-600">Esta es la vista previa estratégica que define qué vamos a escribir, por qué y cómo se conectará con el sitio.</p>
             </div>

             <div className="pl-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <div className="bg-white/50 p-4 rounded-xl border border-slate-200">
                     <span className="text-xs text-brand-500 font-bold uppercase tracking-wider">SEO Title & Meta</span>
                     <h3 className="font-display text-lg font-bold text-slate-900 mt-1 leading-tight">{strategy.seoTitle}</h3>
                     <p className="text-sm text-slate-700 mt-2 leading-relaxed">{strategy.metaDescription}</p>
                     <div className="mt-3 flex gap-2">
                       <span className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-600">Slug: /{strategy.slug}</span>
                       <span className={`text-[10px] border px-2 py-1 rounded-full ${strategy.suggestedCategory.isNew ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>Cat: {strategy.suggestedCategory.name} {strategy.suggestedCategory.isNew && '(Nueva)'}</span>
                     </div>
                   </div>

                   <div className="bg-white/50 p-4 rounded-xl border border-slate-200 space-y-4">
                     <div>
                       <span className="text-xs text-brand-400 font-bold uppercase tracking-wider mb-2 block">Resumen del brief</span>
                       <p className="text-sm font-medium text-slate-800 mb-2">🔎 Intención refinada: <span className="font-normal text-slate-600">{strategy.refinedIntent}</span></p>
                       <p className="text-sm font-medium text-slate-800 mb-2">🎯 Keyword principal: <span className="font-normal text-slate-600">{strategy.primaryKeyword}</span></p>
                       <p className="text-sm font-medium text-slate-800">🧭 Rama temática: <span className="font-normal text-slate-600">{strategy.thematicBranch}</span></p>
                     </div>
                     <div>
                       <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Qué debe cubrir la pieza</p>
                       <div className="flex flex-wrap gap-1 mt-1">
                         {strategy.entitiesToCover.map((e,i) => <span key={i} className="text-[10px] bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">{e}</span>)}
                       </div>
                     </div>
                     {strategy.editorialNotes && (
                       <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                         <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Notas editoriales</p>
                         <p className="text-sm text-slate-700 leading-relaxed">{strategy.editorialNotes}</p>
                       </div>
                     )}
                   </div>
                </div>

                <div className="space-y-4 bg-white/50 p-4 rounded-xl border border-slate-200 max-h-[400px] overflow-y-auto">
                   <span className="text-xs text-brand-400 font-bold uppercase tracking-wider sticky top-0 bg-slate-50/90 backdrop-blur pb-2 block z-10">Estructura y FAQs</span>
                   <ul className="space-y-3 mt-2">
                     {strategy.outline.map((o, i) => (
                       <li key={i} className="text-sm">
                         <div className="flex items-center gap-2 font-semibold">
                           <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${o.type === 'H1' ? 'bg-brand-500 text-white' : o.type === 'H2' ? 'bg-slate-700 text-slate-800' : 'bg-slate-800 text-slate-600'}`}>{o.type}</span>
                           <span className={o.type === 'H1' ? 'text-slate-900 font-bold' : o.type === 'H2' ? 'text-slate-800' : 'text-slate-600 pl-4'}>{o.label}</span>
                         </div>
                         <p className={`text-xs text-slate-500 mt-1 ${o.type !== 'H1' ? 'pl-9' : 'pl-7'}`}>Enfoque: {o.focus}</p>
                       </li>
                     ))}
                   </ul>

                   {strategy.internalLinkSuggestions.length > 0 && (
                     <div className="mt-6 pt-4 border-t border-slate-200">
                       <span className="text-xs text-brand-400 font-bold uppercase tracking-wider block mb-2">Posibles enlaces internos</span>
                       <ul className="space-y-2">
                         {strategy.internalLinkSuggestions.slice(0, 4).map((link, i) => (
                           <li key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                             <p className="text-xs font-semibold text-slate-800">{link.anchor}</p>
                             <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{link.reason}</p>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}

                   {strategy.faqs.length > 0 && (
                     <div className="mt-6 pt-4 border-t border-slate-200">
                       <span className="text-xs text-brand-400 font-bold uppercase tracking-wider block mb-2">FAQs Propuestas</span>
                       <ul className="space-y-2">
                         {strategy.faqs.map((f, i) => (
                           <li key={i} className="text-xs">
                             <strong className="text-slate-700 block mb-0.5 pb-1 border-b border-slate-200/50">P: {f.question}</strong>
                             <span className="text-slate-500">R: {f.answerSnippet}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                </div>
             </div>
             
             <div className="pl-4 mt-6 pt-4 border-t border-slate-200 flex gap-4 bg-white/50 p-4 rounded-b-xl items-center justify-between flex-wrap">
                <p className="text-xs text-slate-500 italic flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Brief generado automáticamente antes de redactar la página final.</p>
                <div className="flex gap-3 w-full sm:w-auto mt-3 sm:mt-0">
                  <button disabled={loading} className="btn-secondary px-6 text-sm py-2.5 w-full sm:w-auto" onClick={() => setStep('context')}>Editar Análisis</button>
                  <button disabled={loading} className="btn-primary w-full sm:w-auto px-8 py-2.5 font-bold shadow-lg shadow-brand-900/50" onClick={handleWriteContent}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {loading ? 'Escribiendo página y optimizando HTML...' : 'Redactar borrador'}
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* STEP 3: DRAFT EDITOR */}
      {step === 'draft' && draft && strategy && (
        <div className="space-y-5">
          <div className="card border-slate-200 bg-white/80">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Borrador listo</p>
                <h2 className="font-display text-lg font-bold text-slate-900">Revisa, ajusta y publica cuando quieras</h2>
                <p className="text-sm text-slate-600">El borrador ya viene alineado con el brief del proyecto y listo para el editor.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest font-bold">
                <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">HTML listo</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Brief aplicado</span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Publicación disponible</span>
              </div>
            </div>
          </div>

          <ContentEditor
            generatedContent={getLegacyGeneratedContent()!}
            onPublish={handlePublish}
            onBack={() => setStep('brief')}
            loading={loading}
          />
        </div>
      )}

      {/* STEP 4: PUBLISHED */}
      {step === 'published' && publishResult && (
        <PublishResult result={publishResult} onCreateNew={() => {
          setStrategy(null)
          setDraft(null)
          setStep('context')
        }} />
      )}

    </div>
  )
}
