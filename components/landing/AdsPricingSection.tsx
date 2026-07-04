'use client'

import React from 'react'
import { CheckCircle2, Star, Zap } from 'lucide-react'

export function AdsPricingSection() {
  return (
    <section id="planes" className="py-24 px-6 relative border-t border-white/5 scroll-mt-20">
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-[600px] h-[300px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">Planes Rentables y <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-500">Transparentes</span></h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Lanza campañas publicitarias guiadas por IA sin costos ocultos y multiplica tu ROAS.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 max-w-5xl mx-auto">
          
          {/* Plan Pro (Single Account) */}
          <div className="flex-1 bg-white/5 border border-white/10 rounded-[32px] p-8 md:p-10 backdrop-blur-xl relative group transition-all hover:border-brand-500/30 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] pointer-events-none" />
            
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 text-slate-700 mb-6">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-2">Plan Creador</h3>
              <p className="text-slate-600">Perfecto para un emprendedor o negocio único.</p>
            </div>
            
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">$20</span>
              <span className="text-slate-600 font-medium">/pago único</span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
                <span className="text-slate-700">Conexión para <strong>1 cuenta publicitaria</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
                <span className="text-slate-700">Lanzador de campañas impulsado por IA.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
                <span className="text-slate-700">Estructuras probadas para <strong>ventas, leads o tráfico</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
                <span className="text-slate-700">Recomendaciones estratégicas en tiempo real.</span>
              </li>
            </ul>
            
            <button className="w-full py-4 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5">
              Elegir Plan Creador
            </button>
          </div>

          {/* Plan Agencia (Multiple Accounts) */}
          <div className="flex-1 bg-gradient-to-b from-[#0f172a] to-[#020617] border border-brand-500/50 rounded-[32px] p-8 md:p-10 backdrop-blur-xl relative group transition-all shadow-[0_0_40px_rgba(56,189,248,0.15)] flex flex-col scale-100 md:scale-105 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-brand-600 to-cyan-500 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-lg">
              Más Popular
            </div>
            
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 fill-brand-400/20" />
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-2">Plan Agencia</h3>
              <p className="text-slate-600">Escala presupuestos y ROAS ilimitadamente.</p>
            </div>
            
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">A Medida</span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
                <span className="text-white">Conexión para <strong>cuentas publicitarias ilimitadas</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
                <span className="text-slate-700">Gestión combinada de Google Ads + Meta Ads.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
                <span className="text-slate-700">Campañas avanzadas de <strong>Remarketing</strong> y Performance Max.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
                <span className="text-slate-700">Soporte prioritario 1:1 con Traffickers Expertos.</span>
              </li>
            </ul>
            
            <a 
              href="https://wa.me/573124714236?text=Hola,%20me%20interesa%20el%20Plan%20Agencia%20de%20Rankerize%20Ads"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 text-center rounded-xl font-bold bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white transition-colors shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:shadow-[0_0_50px_rgba(56,189,248,0.6)] block"
            >
              Contactar por WhatsApp
            </a>
          </div>
          
        </div>
      </div>
    </section>
  )
}
