'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'

interface Props {
  score: number
  factors?: { label: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }[]
}

export default function SiteHealthBar({ score, factors = [] }: Props) {
  const [showTooltip, setShowTooltip] = useState(false)

  const getColor = () => {
    if (score >= 75) return { bar: 'from-emerald-500 to-emerald-400', text: 'text-emerald-400', label: 'Muy Bueno', bg: 'bg-emerald-500/10 border-emerald-500/20' }
    if (score >= 50) return { bar: 'from-amber-500 to-yellow-400', text: 'text-amber-400', label: 'Mejorable', bg: 'bg-amber-500/10 border-amber-500/20' }
    return { bar: 'from-red-600 to-red-500', text: 'text-red-400', label: 'Necesita Atención', bg: 'bg-red-500/10 border-red-500/20' }
  }

  const { bar, text, label, bg } = getColor()

  // Build arc SVG path for the gauge
  const radius = 40
  const cx = 56
  const cy = 56
  const startAngle = -210
  const endAngle = 30
  const totalAngle = endAngle - startAngle

  const toRad = (deg: number) => (deg * Math.PI) / 180
  const scoreAngle = startAngle + (score / 100) * totalAngle

  const describeArc = (start: number, end: number) => {
    const s = { x: cx + radius * Math.cos(toRad(start)), y: cy + radius * Math.sin(toRad(start)) }
    const e = { x: cx + radius * Math.cos(toRad(end)), y: cy + radius * Math.sin(toRad(end)) }
    const large = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`
  }

  return (
    <div className={`relative p-5 rounded-2xl border bg-white/60 ${bg} flex flex-col sm:flex-row items-center gap-6`}>
      {/* Gauge */}
      <div className="relative shrink-0">
        <svg width="112" height="80" viewBox="0 0 112 80">
          {/* Background track */}
          <path
            d={describeArc(-210, 30)}
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Score arc */}
          {score > 0 && (
            <path
              d={describeArc(-210, scoreAngle)}
              fill="none"
              stroke="url(#healthGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          )}
          <defs>
            <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'} />
              <stop offset="100%" stopColor={score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171'} />
            </linearGradient>
          </defs>
          {/* Score text */}
          <text x="56" y="62" textAnchor="middle" fontSize="22" fontWeight="800" fill="white">
            {score}
          </text>
        </svg>
      </div>

      {/* Text info */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
          <h3 className="font-display text-base font-black text-slate-900 uppercase tracking-tight">
            Salud del Sitio
          </h3>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${bg} ${text}`}>
            {label}
          </span>
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-slate-600 hover:text-slate-600 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md">
          Puntuación calculada en base a tus integraciones activas, riesgos de canibalización, 
          oportunidades de posicionamiento y arquitectura del contenido.
        </p>

        {/* Factor pills */}
        {factors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {factors.map((f, i) => (
              <span
                key={i}
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  f.impact === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                  f.impact === 'negative' ? 'bg-red-500/10 text-red-400' :
                  'bg-white text-slate-500'
                }`}
                title={f.detail}
              >
                {f.impact === 'positive' ? '↑' : f.impact === 'negative' ? '↓' : '·'} {f.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Horizontal bar at bottom (secondary visual) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${bar} transition-all duration-1000`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
