'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

export default function AILoader() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-white/40 border border-slate-200 backdrop-blur-sm animate-fade-in">
      <div className="relative mb-8">
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full animate-pulse-slow" />
        
        {/* Main Orbiting Circles */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-brand-500/20 rounded-full" />
          <div className="absolute inset-0 border-t-2 border-brand-400 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-4 border-2 border-brand-600/10 rounded-full" />
          <div className="absolute inset-4 border-b-2 border-brand-500 rounded-full animate-spin-reverse" style={{ animationDuration: '2s' }} />
          
          {/* Central Icon */}
          <div className="z-10 bg-white p-4 rounded-2xl border border-brand-500/30 shadow-[0_0_20px_rgba(var(--brand-500-rgb),0.3)]">
            <Sparkles className="w-8 h-8 text-brand-400 animate-pulse-soft" />
          </div>
          
          {/* Floating Dots */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-brand-400 rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: '0 0',
                animation: `orbit ${3 + i * 0.5}s linear infinite`,
                opacity: 0.4 + (i * 0.1),
                margin: '-3px 0 0 -3px'
              }}
            />
          ))}
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="font-display text-xl font-bold text-white tracking-tight">IA Procesando Contenido</h3>
        <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
          Estamos analizando tu solicitud, estructurando el SEO y redactando cada sección para que sea perfecta.
        </p>
      </div>

      {/* Progress indicators / Labels that change */}
      <div className="mt-10 flex gap-12 text-[10px] uppercase tracking-widest font-bold text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          ESTRUCTURA SEO
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
          REDACCIÓN IA
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" style={{ animationDelay: '1s' }} />
          FAQS & FUENTES
        </div>
      </div>

      <style jsx>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(60px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(60px) rotate(-360deg);
          }
        }
        .animate-spin-reverse {
          animation: spin-reverse linear infinite;
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
