'use client'

import { useEffect, useState } from 'react'

const MESSAGES = [
  { icon: '🔍', text: 'Escaneando artículos del sitio...', sub: 'Leyendo WordPress REST API' },
  { icon: '📊', text: 'Calculando puntuaciones SEO...', sub: 'Analizando títulos, slugs y densidad' },
  { icon: '🔗', text: 'Mapeando enlaces internos...', sub: 'Detectando oportunidades de interlinking' },
  { icon: '📈', text: 'Conectando Google Search Console...', sub: 'Obteniendo clics e impresiones' },
  { icon: '🧠', text: 'Preparando motor de sugerencias...', sub: 'Cargando modelos de optimización' },
  { icon: '✨', text: 'Listo — abriendo Rankerize Flow...', sub: 'Todo configurado para ti' },
]

export default function DashboardLoader() {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(4)

  useEffect(() => {
    // Progress bar: sube rápido al inicio, luego ralentiza (jamás llega a 100)
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 92) return prev
        const increment = prev < 40 ? 4 : prev < 70 ? 2 : 0.8
        return Math.min(92, prev + increment)
      })
    }, 120)

    // Mensajes rotativos cada ~1.4s
    const msgTimer = setInterval(() => {
      setStep(prev => Math.min(prev + 1, MESSAGES.length - 1))
    }, 1400)

    return () => {
      clearInterval(progressTimer)
      clearInterval(msgTimer)
    }
  }, [])

  const msg = MESSAGES[step]

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] select-none">

      {/* ── Logo animado ── */}
      <div className="relative mb-10">
        {/* Anillo de pulso exterior */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-violet-500/30"
          style={{ animation: 'rk-ring 2s ease-out infinite', transform: 'scale(1.3)' }}
        />
        {/* Anillo de pulso interior */}
        <div
          className="absolute inset-0 rounded-2xl border border-violet-500/20"
          style={{ animation: 'rk-ring 2s ease-out infinite 0.5s', transform: 'scale(1.15)' }}
        />
        {/* Logo box */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/60">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-slate-900">
            <path d="M3 20L8 12L13 16L18 8L21 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="21" cy="11" r="1.5" fill="currentColor"/>
          </svg>
          {/* Partícula giratoria */}
          <div
            className="absolute inset-0 rounded-2xl border-t-2 border-r-2 border-violet-300/40"
            style={{ animation: 'rk-spin 1.6s linear infinite' }}
          />
        </div>
      </div>

      {/* ── Marca ── */}
      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Rankerize Flow</p>

      {/* ── Mensaje animado ── */}
      <div className="h-16 flex flex-col items-center justify-center text-center overflow-hidden">
        <div
          key={step}
          style={{ animation: 'rk-msg-in 0.45s cubic-bezier(0.16,1,0.3,1)' }}
          className="space-y-1"
        >
          <p className="text-lg font-bold text-slate-900 flex items-center gap-2 justify-center">
            <span>{msg.icon}</span>
            <span>{msg.text}</span>
          </p>
          <p className="text-xs text-slate-500">{msg.sub}</p>
        </div>
      </div>

      {/* ── Barra de progreso ── */}
      <div className="mt-6 w-64 space-y-1.5">
        <div className="h-1 bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 via-purple-500 to-violet-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>Iniciando plataforma</span>
          <span className="text-violet-400 font-semibold">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* ── Mini cards de "módulos activándose" ── */}
      <div className="mt-10 grid grid-cols-2 gap-2 w-72">
        {[
          { label: 'WordPress API', delay: '0ms' },
          { label: 'Motor SEO', delay: '150ms' },
          { label: 'Search Console', delay: '300ms' },
          { label: 'Mapa Editorial', delay: '450ms' },
        ].map(({ label, delay }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200"
            style={{ animation: `rk-card-in 0.5s cubic-bezier(0.16,1,0.3,1) ${delay} both` }}
          >
            {/* Dot pulsante */}
            <span
              className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"
              style={{ animation: 'rk-dot 1.4s ease-in-out infinite', animationDelay: delay }}
            />
            <span className="text-[11px] text-slate-500 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes rk-ring {
          0%   { opacity: 0.8; transform: scale(1.2); }
          100% { opacity: 0;   transform: scale(1.9); }
        }
        @keyframes rk-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rk-msg-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rk-card-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rk-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
