'use client'

import React, { useState } from 'react'
import { Target, Users, Image as ImageIcon, GitMerge, ChevronRight, ChevronLeft, CheckCircle2, Rocket, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'config' | 'audience' | 'creatives' | 'review'
const steps: { id: Step; label: string; icon: any }[] = [
  { id: 'config', label: 'Objetivo', icon: Target },
  { id: 'audience', label: 'Segmentación', icon: Users },
  { id: 'creatives', label: 'Creativos', icon: ImageIcon },
  { id: 'review', label: 'Estructura SEM', icon: GitMerge },
]

export default function StrategyWizard() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Draft Form State
  const [campaignObj, setCampaignObj] = useState('Conversiones')
  const [budget, setBudget] = useState('20')
  const [audienceDesc, setAudienceDesc] = useState('')
  const [creatives, setCreatives] = useState([1, 2, 3]) // Mocking 3 creatives

  const currentStep = steps[currentStepIndex]

  const next = () => setCurrentStepIndex((i) => Math.min(i + 1, steps.length - 1))
  const prev = () => setCurrentStepIndex((i) => Math.max(i - 1, 0))

  return (
    <div className="max-w-4xl mx-auto py-6">
      
      {/* Header & Steps */}
      <div className="mb-10">
        <h1 className="font-display text-3xl font-black text-white mb-2">Asistente de Estrategia Advantage+</h1>
        <p className="text-slate-600">Configura un Test A/B cruzando tu conocimiento y la Inteligencia Artificial de Meta.</p>
        
        <div className="mt-8 flex items-center justify-between relative before:absolute before:inset-0 before:top-1/2 before:-translate-y-1/2 before:h-px before:bg-white before:-z-10">
          {steps.map((step, idx) => {
            const isActive = idx === currentStepIndex
            const isCompleted = idx < currentStepIndex
            const Icon = step.icon

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(idx)}
                disabled={!isCompleted && !isActive}
                className="flex flex-col items-center gap-2 group outline-none focus:outline-none"
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isActive ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110" : 
                  isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : 
                  "bg-white border-slate-200 text-slate-500"
                )}>
                  {isCompleted && !isActive ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={cn(
                  "text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors",
                  isActive ? "text-emerald-400" : isCompleted ? "text-slate-700" : "text-slate-600"
                )}>
                  {step.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 min-h-[400px] shadow-2xl relative overflow-hidden">
        
        {/* Step 1: Config */}
        {currentStep.id === 'config' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <h2 className="font-display text-xl font-bold text-white mb-1">¿Qué deseas lograr?</h2>
              <p className="text-sm text-slate-600 mb-6">El algoritmo de Meta optimizará la entrega hacia este objetivo principal.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'Conversiones', desc: 'Maximiza ventas y leads en tu sitio web.' },
                { id: 'Trafico', desc: 'Envía máximo volumen de personas a tu web.' },
                { id: 'Reconocimiento', desc: 'Impacta a la mayor cantidad posible de personas.' },
                { id: 'Interacción', desc: 'Mensajes a Whatsapp, likes y comentarios.' }
              ].map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => setCampaignObj(opt.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 cursor-pointer transition-all",
                    campaignObj === opt.id 
                      ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 scale-[1.02]" 
                      : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  )}
                >
                  <h3 className="font-display text-white font-bold mb-1">{opt.id}</h3>
                  <p className="text-xs text-slate-600 font-medium">{opt.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-2">Presupuesto Diario Total (USD)</label>
              <div className="flex items-center gap-2 max-w-xs relative text-slate-700">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-500">$</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-8 pr-4 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Audience (Retador) */}
        {currentStep.id === 'audience' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <h2 className="font-display text-xl font-bold text-white mb-1">El Grupo Retador (Tu Segmentación)</h2>
              <p className="text-sm text-slate-600 mb-6">Describe cómo es tu cliente ideal. Más adelante esto se convertirá en los intereses exactos para este grupo de anuncios, que competirá contra la segmentación pura de Meta.</p>
            </div>
            
            <div>
              <textarea
                value={audienceDesc}
                onChange={(e) => setAudienceDesc(e.target.value)}
                placeholder="Ejemplo: Quiero llegar a mujeres de 25 a 45 años, en México y España, que estén interesadas en cuidado de la piel, rutinas de belleza, que compren online frecuentemente."
                className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 outline-none focus:border-emerald-500 resize-none font-medium text-sm"
              />
            </div>
            <div className="flex items-start gap-3 bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 text-brand-400 relative overflow-hidden">
               <div className="absolute inset-0 bg-brand-500/5 blur-3xl pointer-events-none" />
               <Target className="w-5 h-5 shrink-0 mt-0.5 relative z-10" />
               <p className="text-xs leading-relaxed relative z-10">
                 <strong className="text-brand-300 block mb-1">¿Por qué un Grupo Retador?</strong> Meta Advantage+ es increíble encontrando público que no tenías en mente, pero al inicio necesita "comida" (contexto). Tu Grupo Retador alimentará el píxel rápidamente, permitiendo a la IA de Meta aprender a quién buscar en su propio grupo automático.
               </p>
            </div>
          </div>
        )}

        {/* Step 3: Creatives */}
        {currentStep.id === 'creatives' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 mb-2">
              <div>
                <h2 className="font-display text-xl font-bold text-white mb-1">Fábrica de Creativos</h2>
                <p className="text-sm text-slate-600">Arma tus anuncios (Imágenes y Textos). Se inyectarán en ambos Grupos.</p>
              </div>
              <button 
                onClick={() => setCreatives(s => [...s, s.length + 1])}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-50 text-white text-[11px] uppercase tracking-wider font-bold rounded-lg transition-colors border border-slate-200 flex items-center gap-2"
              >
                + Añadir Cesta Anuncio
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
              {creatives.map((val, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 group relative">
                  {/* Delete btn mock */}
                  {creatives.length > 1 && (
                    <button 
                      onClick={() => setCreatives(s => s.filter((_, idx) => idx !== i))}
                      className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       ×
                    </button>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-brand-500 tracking-widest flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      Anuncio 0{i + 1}
                    </span>
                  </div>
                  <div className="aspect-video bg-white border border-slate-200 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-600 hover:text-emerald-500 hover:border-emerald-500/50 cursor-pointer transition-colors relative overflow-hidden group/img">
                    <ImageIcon className="w-6 h-6 mb-2 group-hover/img:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold">Subir Imagen / Video</span>
                  </div>
                  <textarea 
                    placeholder="Texto Principal del anuncio (Copy)..."
                    className="w-full h-16 bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 outline-none focus:border-brand-500 resize-none"
                  />
                  <input 
                    type="text"
                    placeholder="Llamado a la acción (Título)..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 outline-none focus:border-brand-500"
                  />
                </div>
              ))}
            </div>
            {creatives.length === 10 && (
              <p className="text-[10px] text-emerald-500 font-bold text-center">Has alcanzado el límite táctico de 10 anuncios por grupo.</p>
            )}
          </div>
        )}

        {/* Step 4: Plan Review */}
        {currentStep.id === 'review' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 pb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 scale-110">
                <Rocket className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="font-display text-2xl font-black text-white mb-2">Diagrama de Inyección A/B</h2>
              <p className="text-slate-600 text-sm">Así es como tu bot estructurará la estrategia en el Business Manager.</p>
            </div>
            
            {/* The Strategy Tree */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 relative mx-auto max-w-lg">
               <div className="flex items-center gap-3 mb-6">
                 <Target className="w-5 h-5 text-brand-400" />
                 <div>
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Campaña (CBO Nivel 1)</p>
                   <p className="text-white font-bold text-base leading-tight">Master Campaign • <span className="text-brand-400">{campaignObj}</span></p>
                   <p className="text-[11px] text-slate-600 mt-0.5">Automático: ${budget} USD Presupuesto Diario</p>
                 </div>
               </div>

               {/* Branching */}
               <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-0 before:bottom-6 before:w-px before:bg-white">
                  
                  {/* AdSet 1 */}
                  <div className="relative before:absolute before:-left-6 before:top-5 before:w-6 before:h-px before:bg-white">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-2 hover:border-brand-500/50 transition-colors">
                      <div className="flex items-center gap-2 text-brand-400">
                        <Users className="w-4 h-4" />
                        <h4 className="text-sm font-bold">1. Público Retador (Intereses)</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 italic leading-relaxed">
                        "{audienceDesc || 'Sin descripción ingresada. (Se dejará abiero)'}"
                      </p>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/50">
                        <ArrowRight className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{creatives.length} Anuncios Atados</span>
                      </div>
                    </div>
                  </div>

                  {/* AdSet 2 */}
                  <div className="relative before:absolute before:-left-6 before:top-5 before:w-6 before:h-px before:bg-white">
                    <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 flex flex-col gap-2 hover:border-emerald-500/50 transition-colors">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <GitMerge className="w-4 h-4" />
                        <h4 className="text-sm font-bold">2. Público Advantage+ (Meta IA)</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Público abierto. El algoritmo buscará clientes basándose en aprendizaje de píxel.
                      </p>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-500/10">
                        <ArrowRight className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Mismos {creatives.length} Anuncios Atados</span>
                      </div>
                    </div>
                  </div>

               </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Nav */}
      <div className="mt-6 flex items-center justify-between">
        {currentStepIndex > 0 ? (
          <button 
            onClick={prev}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 transition-colors text-sm outline-none focus:outline-none"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
        ) : <div />}
        
        {currentStepIndex < steps.length - 1 ? (
          <button 
            onClick={next}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-slate-900 font-black hover:bg-slate-200 transition-colors shadow-xl shadow-white/5 outline-none focus:outline-none text-sm"
          >
            Siguiente Paso
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={() => alert('¡Estructura guardada! Cuando finalicemos el Módulo API de Meta, estó creará la campaña en segundos.')}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-500 text-white font-black uppercase tracking-wider hover:bg-emerald-600 transition-colors shadow-xl shadow-emerald-500/20 text-sm outline-none focus:outline-none"
          >
            Sincronizar a Facebook
            <Rocket className="w-4 h-4" />
          </button>
        )}
      </div>
    
    </div>
  )
}
