'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Rocket, CheckCircle2, TrendingUp, Target, Network, Sparkles, BarChart3, Zap, DollarSign, Timer } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/animations'
import { AdsPricingSection } from '@/components/landing/AdsPricingSection'

export default function AdsClient() {
  const container = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // Basic entrance animation
    gsap.fromTo('.reveal-hero', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power3.out' }
    )

    gsap.utils.toArray('.reveal-section').forEach((section: any) => {
      gsap.fromTo(section,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      )
    })

    // Parallax effect on images
    gsap.utils.toArray('.parallax-img').forEach((img: any) => {
      gsap.to(img, {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: img.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      })
    })
  }, { scope: container })

  return (
    <div ref={container} className="min-h-screen bg-[#020202] text-white selection:bg-brand-500/30 font-sans overflow-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020202]/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 reveal-hero">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm tracking-wide uppercase">Volver al Home</span>
          </Link>
          <div className="font-bold text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-cyan-400">
            Rankerize Ads
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center reveal-hero">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Optimizador de Pauta IA</span>
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
            Lanza Campañas Rentables en <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400 drop-shadow-[0_0_30px_rgba(56,189,248,0.3)]">
              Apenas 1 Minuto.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Selecciona tu objetivo de negocio, aprueba la estrategia generada por IA, y lanza pauta profesional en Google y Meta. Planes accesibles increíbles <strong className="text-white">desde $20 dólares.</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="#planes" 
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_rgba(56,189,248,0.3)] hover:shadow-[0_0_60px_rgba(56,189,248,0.5)] hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <Rocket className="w-5 h-5" />
              Comenzar Ahora - $20
            </Link>
            <Link 
              href="#caracteristicas" 
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-lg transition-all border border-white/10 flex items-center justify-center"
            >
              Ver Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Launch Feature */}
      <section id="caracteristicas" className="py-24 px-6 relative reveal-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 mb-6 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                <Timer className="w-6 h-6" />
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">Del Cero al Lanzamiento en <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-brand-500">60 Segundos</span></h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Olvídate de las configuraciones complejas del Business Manager. Nuestra IA toma tu <strong>objetivo principal</strong> (Ventas, Leads, Tráfico) y estructura la campaña completa, distribuyendo el presupuesto como un Trafficker Senior.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-cyan-400 shrink-0" />
                  <span className="text-slate-700">Selección intuitiva de objetivos (Conversión, Prospectos o Alcance).</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-cyan-400 shrink-0" />
                  <span className="text-slate-700">Creación automática de copys y segmentación mediante IA.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <span className="text-white font-bold">Planes de fondeo accesibles que inician en solo $20 dólares.</span>
                </li>
              </ul>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative rounded-[32px] ring-1 ring-cyan-500/20 p-2 bg-white/5 backdrop-blur-3xl shadow-[0_0_80px_rgba(34,211,238,0.15)] parallax-img">
                <Image src="/modules/ads-launch.png" width={800} height={600} alt="1-Minute Ads Campaign Launch Console" className="rounded-[24px] w-full h-auto object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strategy Planner Feature */}
      <section className="py-24 px-6 relative bg-gradient-to-b from-[#050505] to-[#0A0A0A] border-t border-white/5 reveal-section">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" style={{ opacity: 0.05 }} />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <div className="relative rounded-[32px] ring-1 ring-emerald-500/20 p-2 bg-white/5 backdrop-blur-3xl shadow-[0_0_80px_rgba(16,185,129,0.15)] parallax-img">
                <Image src="/modules/ads-dashboard.png" width={800} height={600} alt="AI Ads Strategy Planner" className="rounded-[24px] w-full h-auto object-cover" />
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">Panel Estratégico <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Multicanal</span></h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Visualiza el rendimiento de tus campañas de Google Ads y Meta Ads en un solo Dashboard inteligente. Monitorea tu ROAS y CPA en tiempo real con recomendaciones accionables dictadas por Machine Learning.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <span className="text-slate-700">Distribución dinámica de presupuesto para maximizar CPA.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <span className="text-slate-700">Conexión directa con ecosistemas Meta y Google (Performance Max).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 px-6 relative reveal-section border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-black mb-6">Pauta Inversiones Inteligentes</h2>
          <p className="text-xl text-slate-600 mb-12 font-light">Democratizamos el acceso al tráfico pago de élite gracias a automatizaciones que antes solo estaban al alcance de corporaciones Fortune 500.</p>
          
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            <div className="bg-white/5 border border-white/10 rounded-[24px] p-8 hover:bg-white/10 transition-colors">
              <DollarSign className="w-8 h-8 text-brand-400 mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">Barrer Barreras</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Comienza tu estrategia de tráfico pago invirtiendo únicamente desde $20 USD. Escalabilidad garantizada.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[24px] p-8 hover:bg-white/10 transition-colors">
              <Zap className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">0 Fricción Técnica</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Ni configuraciones ocultas, ni errores de píxel. Solo defines tu objetivo comercial y la IA estructura tu campaña.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[24px] p-8 hover:bg-white/10 transition-colors">
              <BarChart3 className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">ROAS Asistido</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Protegemos tu inversión reasignando el presupuesto automáticamente a los canales y anuncios comprobados.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 px-6 relative reveal-section border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-black mb-6">Convierte $20 en Tráfico Cautivo</h2>
          <p className="text-xl text-slate-600 mb-10 font-light">Arranca tu campaña en menos de 60 segundos.</p>
          <Link 
            href="/" 
            className="inline-flex px-10 py-5 bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white rounded-2xl font-bold text-xl transition-all shadow-[0_0_40px_rgba(56,189,248,0.3)] hover:shadow-[0_0_60px_rgba(56,189,248,0.5)] hover:-translate-y-1 items-center gap-3"
          >
            <Rocket className="w-6 h-6" />
            Lanzar Mi Primera Campaña IA
          </Link>
        </div>
      </section>

      <AdsPricingSection />

    </div>
  )
}
