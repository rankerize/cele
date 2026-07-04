'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Search, ArrowRight, Sparkles, Globe, ShoppingBag, Clock, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ─── Plataformas disponibles ────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Blog, sitio web o tienda WooCommerce sobre WordPress.',
    logo: '🔵',
    color: 'brand',
    available: true,
    ctaLabel: 'Seleccionar WordPress',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Tienda online en la plataforma líder de ecommerce.',
    logo: '🟢',
    color: 'emerald',
    available: false,
    ctaLabel: 'Próximamente',
  },
  {
    id: 'tiendanube',
    name: 'Tienda Nube',
    description: 'La plataforma de ecommerce más usada en Latam.',
    logo: '🟣',
    color: 'purple',
    available: false,
    ctaLabel: 'Próximamente',
  },
  {
    id: 'magento',
    name: 'Magento',
    description: 'Plataforma enterprise para tiendas de alto volumen.',
    logo: '🟠',
    color: 'orange',
    available: false,
    ctaLabel: 'Próximamente',
  },
  {
    id: 'otra',
    name: 'Otra plataforma',
    description: 'WooCommerce standalone, Prestashop, BigCommerce...',
    logo: '⚙️',
    color: 'slate',
    available: false,
    ctaLabel: 'Próximamente',
  },
]

// ─── Props ──────────────────────────────────────────────────────────────────
interface Props {
  projectId: string
  hasWordPress: boolean
  hasGSC: boolean
  hasAI: boolean
}

// ─── Color map ───────────────────────────────────────────────────────────────
const colorMap: Record<string, { ring: string; badge: string; btn: string; glow: string }> = {
  brand:   { ring: 'ring-brand-500/40 border-brand-500/30',   badge: 'bg-brand-500/10 text-brand-400 border-brand-500/20',    btn: 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-900 shadow-brand-600/25',   glow: 'from-brand-500/15 to-brand-600/5' },
  emerald: { ring: 'ring-emerald-500/30 border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', btn: 'bg-white text-slate-500 cursor-not-allowed border border-slate-200', glow: 'from-emerald-500/10 to-emerald-600/5' },
  purple:  { ring: 'ring-purple-500/30 border-purple-500/20',  badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',   btn: 'bg-white text-slate-500 cursor-not-allowed border border-slate-200', glow: 'from-purple-500/10 to-purple-600/5' },
  orange:  { ring: 'ring-orange-500/30 border-orange-500/20',  badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',   btn: 'bg-white text-slate-500 cursor-not-allowed border border-slate-200', glow: 'from-orange-500/10 to-orange-600/5' },
  slate:   { ring: 'ring-slate-500/20 border-slate-700/40',    badge: 'bg-slate-800 text-slate-500 border-slate-700',            btn: 'bg-white text-slate-500 cursor-not-allowed border border-slate-200', glow: 'from-slate-700/10 to-slate-800/5' },
}

// ─── Pasos de configuración después de elegir plataforma ───────────────────
function SetupSteps({ projectId, hasWordPress, hasGSC }: { projectId: string; hasWordPress: boolean; hasGSC: boolean }) {
  const steps = [
    {
      id: 1,
      title: 'Cuenta de Google',
      description: 'Sesión activa y cuenta verificada en el sistema.',
      done: true,
      color: 'emerald',
      ctaHref: '#',
      ctaLabel: 'Completado',
    },
    {
      id: 2,
      title: 'Conecta WordPress',
      description: 'URL de tu sitio, usuario y Contraseña de Aplicación para leer y publicar contenido con IA.',
      done: hasWordPress,
      color: 'brand',
      ctaHref: `/dashboard/${projectId}/settings`,
      ctaLabel: hasWordPress ? 'Conectado ✓' : 'Conectar ahora',
    },
    {
      id: 3,
      title: 'Google Search Console',
      description: 'Vincula tus datos de rendimiento orgánico: keywords, posiciones, CTR e impresiones.',
      done: hasGSC,
      color: 'blue',
      ctaHref: `/dashboard/${projectId}/settings`,
      ctaLabel: hasGSC ? 'Conectado ✓' : 'Conectar GSC',
    },
  ]

  const completedCount = steps.filter(s => s.done).length
  const pct = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">
          <Zap className="w-3 h-3" /> WordPress seleccionado
        </div>
        <h2 className="font-display text-2xl font-black text-slate-900 tracking-tight">
          Conecta tus fuentes de datos
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
          3 pasos simples para desbloquear todos los módulos de análisis y generación de contenido.
        </p>
      </div>

      {/* Progress */}
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-500 font-semibold uppercase tracking-wider">Progreso</span>
          <span className={`font-bold ${pct === 100 ? 'text-emerald-400' : 'text-brand-400'}`}>{completedCount}/{steps.length}</span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-brand-600 to-purple-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {steps.map(step => (
          <div
            key={step.id}
            className={`relative p-6 rounded-2xl border bg-white/60 backdrop-blur transition-all ${
              step.done ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-200 hover:border-brand-500/30 hover:bg-slate-50/60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border ${
                step.done ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.id}
              </div>
              {step.done && (
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                  Listo
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-slate-900 text-sm mb-1.5">{step.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-5 min-h-[52px]">{step.description}</p>

            {step.done ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> {step.ctaLabel}
              </div>
            ) : (
              <Link
                href={step.ctaHref}
                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-brand-600/20 border border-brand-500/30 text-brand-400 hover:bg-brand-600/30 transition-all"
              >
                {step.ctaLabel} <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {pct === 100 && (
        <div className="text-center">
          <Link
            href={`/dashboard/${projectId}`}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-900 font-bold rounded-xl shadow-xl shadow-emerald-600/20 transition-all text-sm"
          >
            <Sparkles className="w-4 h-4" /> Ir al Dashboard
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function OnboardingWizard({ projectId, hasWordPress, hasGSC, hasAI }: Props) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(
    hasWordPress ? 'wordpress' : null
  )
  const router = useRouter()

  function handleSelect(platform: typeof PLATFORMS[number]) {
    if (!platform.available) return
    setSelectedPlatform(platform.id)
  }

  // Si ya eligió plataforma → mostrar pasos de configuración
  if (selectedPlatform === 'wordpress') {
    return <SetupSteps projectId={projectId} hasWordPress={hasWordPress} hasGSC={hasGSC} />
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600/30 to-purple-600/20 border border-brand-500/30 shadow-xl shadow-brand-500/10 mb-2">
          <Sparkles className="w-8 h-8 text-brand-400" />
        </div>
        <h1 className="font-display text-3xl font-black text-slate-900 tracking-tight">
          ¿Qué plataforma usas?
        </h1>
        <p className="text-slate-600 max-w-lg mx-auto leading-relaxed text-sm">
          Selecciona tu CMS o plataforma de ecommerce. Conectaremos las herramientas de IA y SEO 
          específicas para tu ecosistema.
        </p>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {PLATFORMS.map(platform => {
          const c = colorMap[platform.color]
          const isSelected = selectedPlatform === platform.id

          return (
            <button
              key={platform.id}
              onClick={() => handleSelect(platform)}
              disabled={!platform.available}
              className={`relative text-left p-6 rounded-2xl border bg-white/60 backdrop-blur transition-all duration-200 group
                ${platform.available
                  ? `cursor-pointer hover:ring-2 ${c.ring} hover:bg-slate-50/60`
                  : 'cursor-not-allowed opacity-60'
                }
                ${isSelected ? `ring-2 ${c.ring}` : 'border-slate-200'}
              `}
            >
              {/* Glow background */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${c.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Coming soon badge */}
              {!platform.available && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <Clock className="w-2.5 h-2.5" /> Próximamente
                </div>
              )}

              {/* Selected check */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-400" />
                </div>
              )}

              <div className="relative">
                {/* Logo */}
                <div className="text-3xl mb-3">{platform.logo}</div>

                {/* Name + badge */}
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-display font-black text-slate-900 text-base">{platform.name}</h3>
                  {platform.available && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${c.badge}`}>
                      Activo
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-5">
                  {platform.description}
                </p>

                {/* CTA */}
                <div className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all ${c.btn} ${platform.available ? 'shadow-lg' : ''}`}>
                  {platform.available
                    ? <><Globe className="w-3.5 h-3.5" /> {platform.ctaLabel}</>
                    : <><Clock className="w-3.5 h-3.5" /> {platform.ctaLabel}</>
                  }
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-600 max-w-md mx-auto">
        Estamos trabajando para soportar más plataformas. <br />
        Si usas una distinta, danos unos minutos — pronto llegará.
      </p>
    </div>
  )
}
