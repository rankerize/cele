'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Rocket, CheckCircle2, TrendingUp, Search, Network, Sparkles, BarChart3, Database, ShoppingCart, Share2, Layers } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/animations'
import { PricingSection } from '@/components/landing/PricingSection'

export default function SeoClient() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // Intro Sequence
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      
      tl.from('.badge-intro', { opacity: 0, y: 20, scale: 0.9, duration: 0.8 })
        .from('.hero-headline', { opacity: 0, y: 40, rotationX: -20, duration: 1, stagger: 0.2 }, '-=0.5')
        .from('.hero-sub', { opacity: 0, y: 20, duration: 0.8 }, '-=0.6')
        .from('.hero-actions', { opacity: 0, scale: 0.95, duration: 0.8 }, '-=0.6')
        .from('.hero-image', { opacity: 0, y: 50, scale: 0.95, duration: 1.2, ease: 'back.out(1.2)' }, '-=0.6')

      // Scroll reveals for sections
      gsap.utils.toArray<HTMLElement>('.reveal-section').forEach(el => {
        gsap.fromTo(el, 
          { opacity: 0, y: 60 },
          {
            scrollTrigger: {
              trigger: el,
              start: 'top 80%',
            },
            opacity: 1, 
            y: 0, 
            duration: 1, 
            ease: 'power3.out'
          }
        )
      })

      // Image Parallax Effect
      gsap.utils.toArray<HTMLElement>('.parallax-img').forEach(el => {
        gsap.to(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
          y: -50,
          ease: 'none'
        })
      })
    },
    { scope: containerRef }
  )

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white selection:bg-brand-500/30 font-sans overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 h-20 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-bold text-slate-700">Volver a Rankerize</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="px-5 py-2 text-sm font-bold text-slate-700 hover:text-white transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="#planes" className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              Adquirir Plan
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="badge-intro inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-bold tracking-wide mb-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Rocket className="w-4 h-4" /> Módulo Core: SEO & GEO
          </div>
          
          <h1 className="font-display hero-headline text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6 max-w-4xl" style={{ perspective: '1000px' }}>
            El <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">Piloto Automático</span> para Google e Inteligencias Artificiales
          </h1>
          
          <p className="hero-sub text-xl text-slate-600 font-light leading-relaxed mb-10 max-w-2xl mx-auto">
            Deja de escribir a ciegas. Conéctate a nuestras bases de datos de volumen de búsquedas, audita canibalizaciones y optimiza no solo para Google, sino para ChatGPT y Gemini.
          </p>
          
          <div className="hero-actions flex flex-col sm:flex-row items-center gap-4 mb-20">
            <Link href="#planes" className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:scale-105 flex items-center justify-center gap-2">
              Empezar ahora <ArrowLeft className="w-5 h-5 rotate-180" />
            </Link>
            <Link href="#dashboards" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 text-center">
              Ver Plataforma
            </Link>
          </div>

          <div id="dashboards" className="hero-image relative w-full max-w-5xl group perspective-[2000px]">
             <div className="absolute inset-0 bg-brand-500/20 blur-[100px] rounded-full transition-all duration-700 group-hover:bg-brand-500/30" />
             <div className="relative rounded-[32px] ring-1 ring-white/10 p-2 bg-white/5 backdrop-blur-3xl shadow-2xl transition-transform duration-700 hover:rotate-x-[2deg] hover:rotate-y-[-2deg]">
                <Image src="/modules/seo-dashboard.png" width={1200} height={800} alt="SEO Intelligence Dashboard" className="rounded-[24px] w-full h-auto object-cover" />
             </div>
          </div>
        </div>
      </section>

      {/* Analytics & Search Volume Feature */}
      <section className="py-24 px-6 relative reveal-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 mb-6">
                <Database className="w-6 h-6" />
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">Dashboard Inteligente y <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">Bases de Datos Live</span></h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Visualiza el crecimiento de tus keywords reales. Nos conectamos a bases de datos masivas para predecir volúmenes de búsqueda e indicarte con exactitud cuántas palabras has posicionado, graficando constantemente tu posición promedio ascendente.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-brand-400 shrink-0" />
                  <span className="text-slate-700">Reportes de Crecimiento del Tráfico Orgánico y Visibilidad.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-brand-400 shrink-0" />
                  <span className="text-slate-700">Bases de Datos de Keywords integradas para extraer de tendencias.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-brand-400 shrink-0" />
                  <span className="text-slate-700">Gráfico vital que comprueba el éxito (tus métricas reales).</span>
                </li>
              </ul>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative rounded-[32px] ring-1 ring-white/10 p-2 bg-white/5 backdrop-blur-3xl shadow-2xl parallax-img">
                <Image src="/modules/seo-dashboard.png" width={800} height={600} alt="SEO Engine Rankings" className="rounded-[24px] w-full h-auto object-cover" />
              </div>
            </div>
          </div>
          
          {/* API Integrations Strip */}
          <div className="mt-20 pt-10 border-t border-white/5 flex flex-col items-center">
            <span className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-8">Conectado a Datos Reales Oficiales (APIs)</span>
            <div className="flex flex-col sm:flex-row items-center gap-8 md:gap-16">
              
              <div className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-2xl p-6 backdrop-blur-xl group">
                <div className="bg-white rounded-xl p-3 h-20 flex flex-col justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  <Image src="/modules/google-search-console.jpg" width={180} height={60} alt="Google Search Console API" className="object-contain h-14 w-auto mix-blend-multiply" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-lg">Google Search Console</span>
                  <span className="text-slate-600 text-sm">Integración API Oficial</span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-2xl p-6 backdrop-blur-xl group">
                <div className="bg-white rounded-xl p-3 h-20 flex flex-col justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  <Image src="/modules/bing-webmaster.png" width={180} height={60} alt="Bing Webmaster API" className="object-contain h-14 w-auto" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-lg">Bing Webmaster Tools</span>
                  <span className="text-slate-600 text-sm">Integración API Oficial</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Cannibalization Matrix */}
      <section className="py-24 px-6 relative bg-gradient-to-b from-[#050505] to-[#0A0A0A] border-y border-white/5 reveal-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <div className="relative rounded-[32px] ring-1 ring-orange-500/20 p-2 bg-white/5 backdrop-blur-3xl shadow-[0_0_60px_rgba(249,115,22,0.1)] parallax-img">
                <Image src="/modules/seo-cannibalization.png" width={800} height={600} alt="Autoskill Cannibalization Analysis" className="rounded-[24px] w-full h-auto object-cover" />
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 mb-6">
                <Network className="w-6 h-6" />
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">Matriz de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Canibalización en Tiempo Real</span></h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Un clúster que repita las mismas intenciones se destruye a sí mismo. Nuestro sistema inteligente escanea los cruces temáticos, alerta sobre los choques y planifica la resolución en segundos con estructura piramidal.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-orange-400 shrink-0" />
                  <span className="text-slate-700">Auditorías profundas de competencia por la misma Keyword.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-orange-400 shrink-0" />
                  <span className="text-slate-700">Genera estrategias automatizadas de re-optimización o redirecciones.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* GEO / AIs Section */}
      <section className="py-24 px-6 relative reveal-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">Optimización GEO: <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500">Aparecer en ChatGPT / LLMs</span></h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Rankerize ya incluye directrices SGE (Search Generative Experience). Esto significa que tu contenido no solo posiciona en directorios web: está estructurado semánticamente para asegurar las <strong>citaciones directas</strong> por la inteligencia artificial.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-purple-400 shrink-0" />
                  <span className="text-slate-700">Aumenta tu Answer Rate en IA.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-purple-400 shrink-0" />
                  <span className="text-slate-700">Domina tu nicho como "fuente experta verificable".</span>
                </li>
              </ul>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative rounded-[32px] ring-1 ring-purple-500/20 p-2 bg-white/5 backdrop-blur-3xl shadow-[0_0_60px_rgba(168,85,247,0.15)] parallax-img">
                <Image src="/modules/seo-geo.png" width={800} height={600} alt="Generative Engine Optimization (GEO)" className="rounded-[24px] w-full h-auto object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Viral Trends Hunter Section */}
      <section className="py-24 px-6 relative bg-gradient-to-b from-[#050505] to-[#0A0A0A] border-t border-white/5 reveal-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <div className="relative rounded-[32px] ring-1 ring-pink-500/20 p-2 bg-white/5 backdrop-blur-3xl shadow-[0_0_60px_rgba(236,72,153,0.15)] parallax-img">
                <Image src="/modules/seo-viral.png" width={800} height={600} alt="Viral Trends Dashboard" className="rounded-[24px] w-full h-auto object-cover" />
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 mb-6">
                <Share2 className="w-6 h-6" />
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">Cazador Viral: <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-600">Redes Sociales y Tendencias</span></h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Nos conectamos directamente con Google, TikTok, Instagram y Pinterest. Detectamos picos de búsqueda e interacciones en tiempo real, permitiéndote generar de forma <strong>masiva</strong> artículos y clústeres interconectados basados exactamente en lo que la gente está buscando hoy.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-pink-400 shrink-0" />
                  <span className="text-slate-700">Creación masiva de artículos orientados a micro-tendencias.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-pink-400 shrink-0" />
                  <span className="text-slate-700">Generación de Interlinking automático (César SEO Engine).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Ecommerce E-commerce AI Optimization */}
      <section className="py-24 px-6 relative reveal-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-6">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">Optimización E-commerce: <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">Shopify & WooCommerce</span></h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Transforma tiendas online mediocres en monstruos de conversión. La IA re-escribe, expande y optimiza los productos de tu e-commerce sincronizándose nativamente con las plataformas más importantes del mercado.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <span className="text-slate-700">Sincronización API One-Click con stores reales.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <span className="text-slate-700">Mejora drástica de legibilidad, conversión SEO y SEO de productos.</span>
                </li>
              </ul>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative rounded-[32px] ring-1 ring-emerald-500/20 p-2 bg-white/5 backdrop-blur-3xl shadow-[0_0_60px_rgba(16,185,129,0.15)] parallax-img">
                <Image src="/modules/seo-ecommerce.png" width={800} height={600} alt="Ecommerce AI Optimization Shopify WooCommerce" className="rounded-[24px] w-full h-auto object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-24 px-6 relative reveal-section border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-black mb-6">¿Listo para dominar las búsquedas?</h2>
          <p className="text-xl text-slate-600 mb-10">Conéctate a nuestro SaaS inteligente y en unos clics tendrás la infraestructura web al completo.</p>
          <Link href="#planes" className="inline-flex rounded-xl px-10 py-5 bg-white text-black font-bold text-lg hover:bg-slate-200 transition-colors shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            Obtener mi plataforma
          </Link>
        </div>
      </section>

      <PricingSection />

    </div>
  )
}
