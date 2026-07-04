import React from 'react'
import { Radar, Clock, Sparkles, BellRing } from 'lucide-react'

interface ComingSoonTrendsProps {
  title: string
  description: string
  BadgeText?: string
}

export default function ComingSoonTrends({ 
  title, 
  description, 
  BadgeText = "Próximamente" 
}: ComingSoonTrendsProps) {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-6 lg:p-12 min-h-[calc(100vh-100px)] relative overflow-hidden">
      
      {/* Luces y brillos de fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-[10px] font-black uppercase tracking-widest mb-8 animate-fade-in">
          <Clock className="w-3.5 h-3.5" />
          {BadgeText}
        </div>

        {/* Icon Central */}
        <div className="relative mb-8 group cursor-default">
           <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-xl group-hover:bg-brand-500/30 transition-colors" />
           <div className="relative w-24 h-24 rounded-3xl bg-white border border-slate-200 shadow-2xl flex items-center justify-center overflow-hidden">
             <Radar className="w-10 h-10 text-brand-500 animate-pulse" />
             {/* Animación de escáner estilo radar */}
             <div className="absolute top-0 left-1/2 w-[1px] h-1/2 bg-gradient-to-b from-brand-500/0 to-brand-500/80 origin-bottom animate-[spin_3s_linear_infinite]" />
           </div>
           
           <div className="absolute -top-3 -right-3">
             <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
               <Sparkles className="w-4 h-4 text-white" />
             </div>
           </div>
        </div>

        {/* Textos */}
        <h1 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight mb-4 animate-slide-up">
          {title}
        </h1>
        <p className="text-base text-slate-600 mb-10 max-w-lg leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {description}
        </p>

        {/* Card simulada */}
        <div className="w-full bg-white/50 border border-slate-200 rounded-3xl p-6 md:p-8 relative backdrop-blur-sm animate-slide-up" style={{ animationDelay: '0.2s' }}>
           <h3 className="font-display text-white font-bold mb-4 flex items-center justify-center gap-2">
              <BellRing className="w-4 h-4 text-brand-400" />
              Notificación Disponible
           </h3>
           <p className="text-sm text-slate-600 mb-6">
             Nuestra IA está calibrando los modelos predictivos para encontrar las tendencias antes que la competencia. ¡Mantente atento!
           </p>
           
           <button className="px-6 py-3 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-all shadow-sm">
             Volver al Inicio
           </button>
        </div>

      </div>
    </div>
  )
}
