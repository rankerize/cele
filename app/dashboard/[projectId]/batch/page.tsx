'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Layers,
  Sparkles,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ListRestart,
  Trash2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Play,
  Link2,
} from 'lucide-react'
import { BatchPlanItem } from '@/types/content'

// Form state interface
interface BatchConfigForm {
  nicho: string
  numArticles: number
  paisMercado: string
  tipoPieza: string
  tono: string
  longitudAproximada: string
  ctaFinal: string
  useGscData: boolean
}

const DEFAULT_FORM: BatchConfigForm = {
  nicho: '',
  numArticles: 5,
  paisMercado: 'España',
  tipoPieza: 'blog',
  tono: 'profesional',
  longitudAproximada: '1000',
  ctaFinal: 'Contacta con nosotros',
  useGscData: true,
}

export default function BatchGeneratorPage() {
  return (
    <Suspense fallback={null}>
      <BatchGeneratorInner />
    </Suspense>
  )
}

function BatchGeneratorInner() {
  const params = useSearchParams()
  const preNicho     = params.get('nicho')       ?? ''
  const prePais      = params.get('paisMercado') ?? ''

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState<BatchConfigForm>({
    ...DEFAULT_FORM,
    nicho:       preNicho  || DEFAULT_FORM.nicho,
    paisMercado: prePais   || DEFAULT_FORM.paisMercado,
  })
  const fromViralHunter = !!(preNicho)
  const [plan, setPlan] = useState<BatchPlanItem[]>([])
  const [isPlanning, setIsPlanning] = useState(false)
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [globalError, setGlobalError] = useState('')
  const [interlinkingStatus, setInterlinkingStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [interlinkingCount, setInterlinkingCount] = useState(0)

  const handlePlanGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPlanning(true)
    setGlobalError('')

    try {
      const res = await fetch('/api/batch/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      
      setPlan(data.data)
      setStep(2)
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Error desconocido al generar plan')
    } finally {
      setIsPlanning(false)
    }
  }

  const toggleItemApproval = (id: string) => {
    setPlan(prev => prev.map(p => p.id === id ? { ...p, approved: !p.approved } : p))
  }

  const deleteItem = (id: string) => {
    setPlan(prev => prev.filter(p => p.id !== id))
  }

  // ─── Auto-interlinking entre artículos del lote ──────────────────────────────
  const autoInterlink = async (publishedItems: Array<{ postId: number; postUrl: string; keyword: string; title: string }>) => {
    if (publishedItems.length < 2) return // necesita al menos 2 para enlazar

    setInterlinkingStatus('running')
    setInterlinkingCount(0)
    let linked = 0

    // Cada artículo enlaza al siguiente del lote (cadena de enlaces)
    // Esto asegura que ninguno quede huérfano
    for (let i = 0; i < publishedItems.length; i++) {
      const source = publishedItems[i]
      // Enlaza al siguiente (circular: el último al primero)
      const target = publishedItems[(i + 1) % publishedItems.length]

      try {
        await fetch('/api/interlinking/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourcePostId: source.postId,
            targetUrl: target.postUrl,
            anchorText: target.keyword || target.title,
          }),
        })
        linked++
        setInterlinkingCount(linked)
      } catch {
        // silencioso — el contenido ya fue publicado, el enlace es bonus
      }
    }

    setInterlinkingStatus('done')
  }

  // ─── Ejecutar un artículo con reintento automático ────────────────────────
  const executeWithRetry = async (
    item: typeof plan[0],
    MAX_RETRIES = 2
  ): Promise<{ success: boolean; postId?: number; postUrl?: string; error?: string }> => {
    let lastError = ''
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        if (attempt > 1) {
          // Pausa antes de reintentar (3s entre intentos)
          await new Promise(r => setTimeout(r, 3000))
          // Indicar visualmente que está reintentando
          setPlan(prev => prev.map(p =>
            p.id === item.id ? { ...p, status: 'generating' } : p
          ))
        }
        const res = await fetch('/api/batch/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, item }),
        })
        const json = await res.json()
        if (json.success) return json
        lastError = json.error || 'Error desconocido'
      } catch {
        lastError = 'Error de conexión'
      }
    }
    // Todos los intentos fallaron — devolver error neutro para el usuario
    return { success: false, error: 'No se pudo generar este artículo. Intenta de nuevo más tarde.' }
  }

  const startExecution = async () => {
    const itemsToExecute = plan.filter(p => p.approved)
    if (itemsToExecute.length === 0) return

    setStep(3)
    setIsExecuting(true)
    setCompletedCount(0)
    setErrorCount(0)
    setInterlinkingStatus('idle')

    // Marcar items aprobados como pendientes
    setPlan(prev => prev.map(p => p.approved ? { ...p, status: 'pending' } : p))

    // Colectar artículos publicados para el interlinking final
    const publishedArticles: Array<{ postId: number; postUrl: string; keyword: string; title: string }> = []

    // ⚡ Procesar en chunks de 3 en paralelo (3x más rápido sin saturar la API)
    const CHUNK_SIZE = 3
    for (let i = 0; i < itemsToExecute.length; i += CHUNK_SIZE) {
      const chunk = itemsToExecute.slice(i, i + CHUNK_SIZE)

      // Marcar el chunk como 'generating'
      setPlan(prev => prev.map(p =>
        chunk.some(c => c.id === p.id) ? { ...p, status: 'generating' } : p
      ))

      // Ejecutar el chunk en paralelo — con reintento automático por artículo
      const chunkResults = await Promise.allSettled(
        chunk.map(item => executeWithRetry(item))
      )

      // Procesar resultados del chunk
      chunkResults.forEach((result, idx) => {
        const item = chunk[idx]
        const value = result.status === 'fulfilled' ? result.value : null
        if (value?.success) {
          setPlan(prev => prev.map(p =>
            p.id === item.id ? { ...p, status: 'published', resultUrl: value.postUrl } : p
          ))
          setCompletedCount(c => c + 1)
          // Guardar para el interlinking
          if (value.postId && value.postUrl) {
            publishedArticles.push({
              postId: value.postId,
              postUrl: value.postUrl,
              keyword: item.keyword || item.title,
              title: item.title,
            })
          }
        } else {
          // Error neutro — sin mencionar IA ni detalles técnicos
          const errMsg = value?.error ?? 'No se pudo generar este artículo. Intenta de nuevo más tarde.'
          setPlan(prev => prev.map(p =>
            p.id === item.id ? { ...p, status: 'error', error: errMsg } : p
          ))
          setErrorCount(c => c + 1)
        }
      })
    }

    setIsExecuting(false)

    // ── Fase 2: Enlazado interno automático entre artículos del lote ────────────
    if (publishedArticles.length >= 2) {
      await autoInterlink(publishedArticles)
    }
  }

  // --- RENDERS ---

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
            <Layers className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Lote de Artículos (Entradas)</h1>
            <p className="text-sm text-slate-500">Crea múltiples <strong className="text-slate-700">Entradas (Posts)</strong> de blog alineadas y sin canibalización SEO</p>
          </div>
        </div>
        {fromViralHunter && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-violet-500/15 border border-violet-500/25 text-violet-400">
            🔥 Pre-relleno desde Viral Hunter
          </span>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between relative bg-white border border-slate-200 rounded-2xl p-4 px-8">
        <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-white -z-0 -translate-y-1/2" />
        <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-brand-500 -z-0 -translate-y-1/2 origin-left transition-transform duration-500" 
             style={{ transform: `scaleX(${step === 1 ? 0 : step === 2 ? 0.5 : 1})` }} />
             
        {[
          { num: 1, label: 'Configuración', icon: Settings2 },
          { num: 2, label: 'Plan Cluster', icon: ListRestart },
          { num: 3, label: 'Ejecución', icon: Play },
        ].map((s) => {
          const active = step >= s.num
          const current = step === s.num
          const Icon = s.icon
          return (
            <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                current ? 'bg-slate-50 border-brand-500 text-brand-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                active ? 'bg-brand-500 border-brand-500 text-white' : 
                'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {active && !current ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-slate-500'}`}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {globalError && (
         <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
           <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
           <p className="text-sm text-red-200">{globalError}</p>
         </div>
      )}

      {/* STEP 1: CONFIGURATION */}
      {step === 1 && (
        <form onSubmit={handlePlanGenerate} className="card p-6 space-y-8 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nicho / Tema General *</label>
                <input 
                  type="text" required
                  placeholder="Ej: Nutrición deportiva, Marketing Digital"
                  value={form.nicho} onChange={e => setForm({...form, nicho: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Cantidad de Artículos</label>
                   <input 
                     type="number" min="1" max="20" required
                     value={form.numArticles} onChange={e => setForm({...form, numArticles: parseInt(e.target.value) || 5})}
                     className="mt-1"
                   />
                </div>
                <div>
                   <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tono</label>
                   <input 
                     type="text" required
                     value={form.tono} onChange={e => setForm({...form, tono: e.target.value})}
                     className="mt-1"
                   />
                </div>
              </div>
              
              <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl mt-4">
                 <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mt-1 bg-white border-slate-300 rounded text-brand-500 focus:ring-brand-500 focus:ring-offset-white"
                      checked={form.useGscData}
                      onChange={e => setForm({...form, useGscData: e.target.checked})}
                    />
                    <div>
                        <div className="flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4 text-brand-400" />
                           <span className="text-sm font-semibold text-white">Protección Anti-Canibalización GSC</span>
                        </div>
                        <p className="text-xs text-brand-200/70 mt-1">Conecta con Search Console y WordPress para evitar generar artículos sobre temáticas que ya posicionan.</p>
                    </div>
                 </label>
              </div>

              {/* Enlazado interno automático — informativo */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                 <div className="flex items-start gap-3">
                    <Link2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-white">Enlazado Interno Automático ✓</span>
                      <p className="text-xs text-emerald-200/70 mt-1">
                        Al finalizar la generación, los artículos del lote se enlazarán entre sí automáticamente.
                        Esto <strong className="text-emerald-300">evita URLs huérfanas</strong> y refuerza la autoridad
                        del cluster para un SEO óptimo.
                      </p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">País/Mercado</label>
                  <input type="text" value={form.paisMercado} onChange={e => setForm({...form, paisMercado: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tipo</label>
                  <select value={form.tipoPieza} onChange={e => setForm({...form, tipoPieza: e.target.value})} className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800">
                    <option value="blog">Blog Post</option>
                    <option value="landing">Landing Page</option>
                    <option value="categoria">Categoría</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Longitud Aprox. (palabras)</label>
                <input type="text" value={form.longitudAproximada} onChange={e => setForm({...form, longitudAproximada: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Llamado a la acción (CTA)</label>
                <input type="text" value={form.ctaFinal} onChange={e => setForm({...form, ctaFinal: e.target.value})} className="mt-1" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button type="submit" disabled={isPlanning} className="btn-primary">
              {isPlanning ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Generando Plan Inteligente...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generar Cluster Plan</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: PLAN REVIEW */}
      {step === 2 && (
        <div className="space-y-4 animate-in slide-in-from-right-8">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
             <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white/20">
                <h3 className="font-display text-sm font-bold text-white">Plan de Artículos ({plan.filter(p => p.approved).length} seleccionados)</h3>
                <button onClick={() => setStep(1)} className="text-xs text-slate-600 hover:text-white transition-colors">← Volver a Configurar</button>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-slate-200">
                     <th className="p-3 w-10"></th>
                     <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Keyword / Intención</th>
                     <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Título / Ángulo</th>
                     <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Canibalización (GSC)</th>
                     <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Acción</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200">
                    {plan.map(item => (
                       <tr key={item.id} className={`transition-colors ${!item.approved ? 'opacity-40 grayscale' : 'hover:bg-slate-50/30'}`}>
                          <td className="p-3">
                             <input 
                               type="checkbox" 
                               checked={item.approved} 
                               onChange={() => toggleItemApproval(item.id)}
                               className="bg-white border-slate-300 rounded text-brand-500 focus:ring-offset-white focus:ring-brand-500"
                             />
                          </td>
                          <td className="p-3 py-4">
                             <div className="font-semibold text-sm text-white">{item.keyword}</div>
                             <div className="text-[10px] text-brand-400 mt-1 uppercase tracking-wider">{item.intencionBusqueda}</div>
                          </td>
                          <td className="p-3 py-4 max-w-xs">
                             <div className="font-medium text-sm text-slate-800">{item.title}</div>
                             <div className="text-xs text-slate-500 mt-1 line-clamp-2">{item.angle}</div>
                          </td>
                          <td className="p-3 py-4">
                             {item.gscConflict ? (
                                <div className="flex flex-col gap-1">
                                   <span className="badge-red text-[10px] w-fit flex items-center gap-1">
                                     <AlertCircle className="w-3 h-3" /> Riesgo
                                   </span>
                                   {item.gscConflictReason && <span className="text-[10px] text-red-300 line-clamp-2" title={item.gscConflictReason}>{item.gscConflictReason}</span>}
                                </div>
                             ) : (
                                <div className="flex flex-col gap-1">
                                   <span className="badge-green text-[10px] w-fit flex items-center gap-1">
                                     <ShieldCheck className="w-3 h-3" /> Seguro
                                   </span>
                                   {item.gscConflictReason && <span className="text-[10px] text-emerald-300/70 line-clamp-2" title={item.gscConflictReason}>{item.gscConflictReason}</span>}
                                </div>
                             )}
                          </td>
                          <td className="p-3 py-4 text-right">
                             <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Eliminar del lote">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>

          <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl">
             <div className="text-sm text-slate-600">
                Se generarán <strong>{plan.filter(p => p.approved).length}</strong> artículos. Esto puede tardar varios minutos.
             </div>
             <button 
                onClick={startExecution} 
                disabled={plan.filter(p => p.approved).length === 0}
                className="btn-primary"
             >
                <Play className="w-4 h-4" /> Empezar a Generar y Publicar
             </button>
          </div>
        </div>
      )}

      {/* STEP 3: EXECUTION */}
      {step === 3 && (
        <div className="card p-6 space-y-6 animate-in slide-in-from-right-8">
           
           <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                 <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    {isExecuting ? <RefreshCw className="w-5 h-5 text-brand-400 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    {isExecuting ? 'Generando Lote...' : interlinkingStatus === 'running' ? 'Enlazando artículos...' : 'Lote Finalizado'}
                 </h2>
                 <p className="text-sm text-slate-500 mt-1">
                    Completados: {completedCount} | Errores: {errorCount} | Total: {plan.filter(p => p.approved || p.status !== 'pending').length}
                 </p>
              </div>
              {!isExecuting && interlinkingStatus !== 'running' && (
                 <button onClick={() => { setStep(1); setPlan([]); setForm(DEFAULT_FORM); setInterlinkingStatus('idle') }} className="btn-secondary text-sm">
                    Crear Nuevo Lote
                 </button>
              )}
           </div>

           {/* Enlazado interno automático — estado */}
           {interlinkingStatus !== 'idle' && (
             <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
               interlinkingStatus === 'running'
                 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                 : interlinkingStatus === 'done'
                 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                 : 'bg-red-500/10 border-red-500/20 text-red-300'
             }`}>
               {interlinkingStatus === 'running' && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
               {interlinkingStatus === 'done' && <Link2 className="w-4 h-4 shrink-0" />}
               <span>
                 {interlinkingStatus === 'running' && `Enlazando artículos entre sí... (${interlinkingCount} completados)`}
                 {interlinkingStatus === 'done' && `✓ Enlazado interno completado — ${interlinkingCount} enlaces insertados. Ninguna URL huérfana.`}
               </span>
             </div>
           )}

           <div className="space-y-3">
              {plan.filter(p => p.approved || p.status !== 'pending').map((item, idx) => (
                 <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-black text-slate-600 w-5">{(idx + 1).toString().padStart(2, '0')}</span>
                       <div>
                          <p className="text-sm font-bold text-white mb-0.5">{item.title}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.keyword}</p>
                       </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                       {item.status === 'pending' && <span className="badge-gray text-xs">Pendiente</span>}
                       {item.status === 'generating' && (
                          <span className="badge-blue text-xs flex items-center gap-1.5 animate-pulse">
                             <Loader2 className="w-3 h-3 animate-spin"/> Generando
                          </span>
                       )}
                       {item.status === 'published' && (
                          <span className="badge-green text-xs flex items-center gap-1.5">
                             <CheckCircle2 className="w-3 h-3" /> Publicado
                          </span>
                       )}
                       {item.status === 'error' && (
                          <div className="flex flex-col items-end gap-1">
                            <span className="badge-red text-xs flex items-center gap-1.5">
                               <AlertTriangle className="w-3 h-3" /> Error
                            </span>
                            {item.error && (
                              <p className="text-[10px] text-red-400/80 max-w-[260px] text-right leading-tight">
                                {item.error}
                              </p>
                            )}
                          </div>
                       )}
                       
                       {item.resultUrl && (
                          <a href={item.resultUrl} target="_blank" rel="noreferrer" className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1">
                             Ver Post <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                       )}
                    </div>
                 </div>
              ))}
           </div>

        </div>
      )}
    </div>
  )
}
