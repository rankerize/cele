'use client'

import React, { useState } from 'react'
import { Rocket, Facebook, CheckCircle2, ChevronRight, Briefcase, Link2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function AdsOnboardingWizard() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [metaConnected, setMetaConnected] = useState(false)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    businessName: '',
    websiteUrl: '',
    mainProduct: '',
    targetAudience: '',
    mainObjection: ''
  })

  const handleNext = () => setStep(2)

  const handleSubmit = async () => {
    if (!formData.businessName || !formData.mainProduct) return alert('Por favor, completa al menos el nombre y tu producto estrella.')
    
    setLoading(true)
    try {
      const res = await fetch('/api/ads/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        window.location.href = '/dashboard/ads/campaigns' // Full realod to refresh layout gatekeeper
      } else {
        alert('Hubo un error al guardar tu brief.')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full mt-8">
      
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-white">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Step 1: Meta Connect */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Facebook className="w-8 h-8 text-brand-500" />
            </div>
            <h2 className="font-display text-3xl font-black text-white mb-2">Conecta con Meta</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Para poder crear, gestionar y extraer reportes ROAS de tus campañas, necesitamos que vincules tu cuenta de Facebook. Esto nos dará acceso a tu Business Manager.
            </p>

            <button 
              onClick={() => {
                setMetaConnected(true)
                setTimeout(() => handleNext(), 1000)
              }}
              className={cn(
                "w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-white transition-all",
                metaConnected 
                  ? "bg-emerald-500 hover:bg-emerald-600" 
                  : "bg-[#1877F2] hover:bg-[#1864D9]"
              )}
            >
              {metaConnected ? (
                 <><CheckCircle2 className="w-5 h-5" /> Vinculación Exitosa</>
              ) : (
                 <><Facebook className="w-5 h-5" /> Continuar con Facebook</>
              )}
            </button>

            <div className="mt-6 flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
               <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
               <p className="text-xs text-slate-600">
                 No realizaremos ningún cargo ni publicaremos sin tu consentimiento previo en el Asistente de Estrategia.
               </p>
            </div>
          </div>
        )}

        {/* Step 2: Business Brief */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Briefcase className="w-8 h-8 text-brand-500" />
            </div>
            <h2 className="font-display text-3xl font-black text-white mb-2">Conozcamos tu Negocio</h2>
            <p className="text-slate-600 mb-8 leading-relaxed text-sm">
              La Inteligencia Artificial redactará textos publicitarios y planeará segmentaciones basándose estrictamente en esta información de tu e-commerce.
            </p>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nombre de la Tienda</label>
                  <input 
                    type="text" 
                    value={formData.businessName}
                    onChange={e => setFormData({...formData, businessName: e.target.value})}
                    placeholder="Ej. TiendaFlow"
                    className="w-full bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">URL del Sitio Web</label>
                  <input 
                    type="text" 
                    value={formData.websiteUrl}
                    onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                    placeholder="Ej. tiendaflow.com"
                    className="w-full bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Producto Estrella o Oferta Irresistible</label>
                <textarea 
                  value={formData.mainProduct}
                  onChange={e => setFormData({...formData, mainProduct: e.target.value})}
                  placeholder="Ej. Un depilador láser IPL con enfriamiento, lo vendo a $50 con envío gratis."
                  className="w-full bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-brand-500 transition-colors h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">¿Cuál es la objeción típica del cliente?</label>
                <textarea 
                  value={formData.mainObjection}
                  onChange={e => setFormData({...formData, mainObjection: e.target.value})}
                  placeholder="Ej. Piensan que dolerá, o que es una estafa de dropshipping, y que tardará 1 mes en llegar."
                  className="w-full bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-brand-500 transition-colors h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Público y Tono de la Marca</label>
                <input 
                  type="text" 
                  value={formData.targetAudience}
                  onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                  placeholder="Ej. Mujeres de 20 a 45 años, tono empático y moderno."
                  className="w-full bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-brand-500 transition-colors"
                />
              </div>

            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="mt-8 w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-brand-500 hover:bg-brand-600 font-black tracking-wider uppercase text-white transition-all shadow-xl shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? 'Preparando IA...' : 'Completar y Entrar al Módulo'}
              <ChevronRight className="w-5 h-5" />
            </button>

          </div>
        )}

      </div>
    </div>
  )
}
