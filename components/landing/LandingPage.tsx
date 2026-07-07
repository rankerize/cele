'use client'

import { useRef, type ComponentType } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileText,
  Globe,
  ImageIcon,
  Layers3,
  Link2,
  MessageSquare,
  Network,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react'
import { gsap, useGSAP } from '@/lib/animations'

type Mode = {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  accent: string
}

type WorkflowStep = {
  title: string
  description: string
}

const modes: Mode[] = [
  {
    title: 'SEO Ecommerce',
    description: 'Categorías, fichas de producto, schema y publicación masiva con intención comercial.',
    icon: ShoppingCart,
    accent: 'from-emerald-500/20 to-lime-500/10',
  },
  {
    title: 'SEO Editorial',
    description: 'Clusters, mapas editoriales, refresh de contenido y mantenimiento continuo.',
    icon: FileText,
    accent: 'from-sky-500/20 to-cyan-500/10',
  },
  {
    title: 'SEO Local',
    description: 'Páginas por ciudad, entidades geográficas, landings y señales de confianza.',
    icon: Globe,
    accent: 'from-amber-500/20 to-orange-500/10',
  },
  {
    title: 'Programmatic SEO',
    description: 'Escala de páginas útiles a partir de datos, plantillas y reglas de intención.',
    icon: Layers3,
    accent: 'from-fuchsia-500/20 to-pink-500/10',
  },
  {
    title: 'Interlinking AI',
    description: 'Detecta oportunidades, evita canibalización y enlaza por contexto semántico.',
    icon: Link2,
    accent: 'from-violet-500/20 to-indigo-500/10',
  },
  {
    title: 'Search Console AI',
    description: 'Convierte impresiones, CTR y queries en decisiones accionables sin hojas de cálculo.',
    icon: Database,
    accent: 'from-neutral-500/20 to-slate-500/10',
  },
  {
    title: 'Crawl Analyzer',
    description: 'Audita indexabilidad, arquitectura, errores técnicos y señales de rastreo.',
    icon: Search,
    accent: 'from-rose-500/20 to-red-500/10',
  },
  {
    title: 'Content Refresh',
    description: 'Reescribe piezas antiguas con datos, contexto y una estrategia nueva de ranking.',
    icon: Zap,
    accent: 'from-teal-500/20 to-emerald-500/10',
  },
  {
    title: 'WooCommerce AI',
    description: 'Optimiza productos, colecciones y metadatos con foco en conversión y catálogo.',
    icon: BrainCircuit,
    accent: 'from-slate-500/20 to-zinc-500/10',
  },
  {
    title: 'Category Builder',
    description: 'Crea taxonomías, jerarquías y URLs que entienden la intención de búsqueda.',
    icon: Workflow,
    accent: 'from-blue-500/20 to-cyan-500/10',
  },
  {
    title: 'Image SEO',
    description: 'Alt text, nombres, compresión y contexto visual para Google y AI search.',
    icon: ImageIcon,
    accent: 'from-yellow-500/20 to-amber-500/10',
  },
  {
    title: 'Fast Indexing',
    description: 'Publica, solicita indexación y sigue el impacto en un mismo ciclo operativo.',
    icon: Rocket,
    accent: 'from-emerald-500/20 to-cyan-500/10',
  },
]

const workflow: WorkflowStep[] = [
  {
    title: 'Entrada',
    description: 'Dominio, Search Console, Analytics, CMS, país, competidores y tipo de negocio.',
  },
  {
    title: 'Orquestador',
    description: 'La IA decide si debe intervenir arquitectura, contenido, interlinking, auditoría o publicación.',
  },
  {
    title: 'Ejecución',
    description: 'Se crean planes, activos, borradores, enlaces y tareas listas para publicar.',
  },
  {
    title: 'Medición',
    description: 'El sistema observa CTR, posiciones, canibalización, indexación y oportunidades nuevas.',
  },
]

const signalCards = [
  { label: 'Diagnóstico', value: '42 señales' },
  { label: 'Oportunidades', value: '12 listas' },
  { label: 'Contenido', value: '7 borradores' },
  { label: 'Indexación', value: 'Automática' },
]

export default function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from('.hero-chip', { opacity: 0, y: 14, duration: 0.7 })
        .from('.hero-title', { opacity: 0, y: 28, duration: 0.9, stagger: 0.08 }, '-=0.35')
        .from('.hero-copy', { opacity: 0, y: 18, duration: 0.7 }, '-=0.45')
        .from('.hero-cta', { opacity: 0, y: 18, duration: 0.7, stagger: 0.12 }, '-=0.35')
        .from('.hero-panel', { opacity: 0, y: 28, scale: 0.98, duration: 0.9 }, '-=0.35')

      gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            scrollTrigger: { trigger: el, start: 'top 82%' },
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
          }
        )
      })

      gsap.utils.toArray<HTMLElement>('.mode-card').forEach((el, index) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 18 },
          {
            scrollTrigger: { trigger: el, start: 'top 86%' },
            opacity: 1,
            y: 0,
            duration: 0.55,
            delay: index * 0.03,
            ease: 'power2.out',
          }
        )
      })
    },
    { scope: containerRef }
  )

  const ctaHref = '/'
  const ctaLabel = 'Empezar demo'

  return (
    <div
      ref={containerRef}
      className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_30%),linear-gradient(180deg,_#f6f1e7_0%,_#f9fafb_45%,_#eef3ef_100%)] text-slate-900 selection:bg-emerald-500/20"
    >
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_at_center,black_15%,transparent_72%)]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f7f2e8]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-emerald-600/20">
              <Sparkles className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">Cele</p>
              <p className="text-xs text-slate-500">Software con IA especializado</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#modos"
              className="hidden rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900/20 hover:bg-white md:inline-flex"
            >
              Ver modos
            </a>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="relative z-10">
            <div className="hero-chip mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-emerald-600/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-900">
              <Bot className="h-3.5 w-3.5" />
              Lovable, pero para SEO
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              <span className="hero-title block">Crea una plataforma que</span>
              <span className="hero-title block text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-slate-900 to-emerald-700">
                piense como un SEO
              </span>
            </h1>

            <p className="hero-copy mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Conecta dominio, Search Console, Analytics y CMS. Luego deja que el orquestador elija el agente correcto para
              arquitectura, contenidos, interlinking, auditoría técnica, publicación e indexación.
            </p>

            <div className="hero-cta mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Empezar demo
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href="#mecanica"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-900/10 bg-white/75 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900/20 hover:bg-white"
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {signalCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-slate-900/8 bg-white/75 p-4 shadow-sm backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{card.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel relative">
            <div className="absolute -left-8 top-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -right-6 bottom-0 h-44 w-44 rounded-full bg-slate-900/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-slate-900/10 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
              <div className="border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
              </div>

              <div className="grid gap-4 p-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300">Prompt</p>
                  <p className="mt-3 text-lg leading-8 text-white/90">
                    Quiero posicionar una tienda de colchones en Colombia. Conecta mis datos y dime qué debo crear primero.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Agente activo</p>
                    <p className="mt-2 text-2xl font-black">Arquitectura SEO</p>
                    <p className="mt-3 text-sm leading-6 text-white/65">
                      Detecta categorías, clusters, URLs y vacíos de intención antes de escribir una sola línea.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Respuesta</p>
                    <p className="mt-2 text-2xl font-black text-emerald-300">12 oportunidades</p>
                    <p className="mt-3 text-sm leading-6 text-white/65">
                      4 categorías, 3 landings, 2 refresh y 3 enlaces internos con mayor impacto.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  {['Diagnóstico', 'Keywords', 'Contenido', 'Indexación'].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="relative overflow-hidden rounded-[28px] border border-white/10">
                  <Image
                    src="/modules/seo-dashboard.png"
                    alt="Dashboard SEO y agentes"
                    width={1200}
                    height={800}
                    priority
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="reveal-section mx-auto max-w-7xl px-6 pb-12">
          <div className="rounded-[32px] border border-slate-900/8 bg-white/75 px-6 py-6 shadow-sm backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              <Database className="h-4 w-4 text-emerald-700" />
              Conecta las señales que importan
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {['WordPress', 'WooCommerce', 'Shopify', 'Search Console', 'Analytics', 'MCP'].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-900/8 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="modos" className="reveal-section mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-600">
              <Layers3 className="h-3.5 w-3.5 text-emerald-700" />
              Modos especializados
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              No es un chat bonito. Es un sistema operativo SEO.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Cada modo resuelve una parte distinta del trabajo. El valor real está en que el orquestador decide qué agente usar,
              qué dato leer y qué acción ejecutar después.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modes.map((mode) => {
              const Icon = mode.icon
              return (
                <article
                  key={mode.title}
                  className={`mode-card rounded-[28px] border border-slate-900/8 bg-gradient-to-br ${mode.accent} p-6 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-slate-950 shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>
                    <ShieldCheck className="h-5 w-5 text-slate-500" />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-slate-950">{mode.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{mode.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section id="mecanica" className="reveal-section mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[32px] border border-slate-900/8 bg-slate-950 p-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                <Workflow className="h-3.5 w-3.5" />
                Cómo piensa la IA
              </div>

              <div className="mt-7 space-y-4">
                {workflow.map((step, index) => (
                  <div key={step.title} className="flex gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-black text-emerald-300">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-black">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/65">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[32px] border border-slate-900/8 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  <Network className="h-4 w-4 text-emerald-700" />
                  Lo que automatiza
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    'Arquitectura y clusters',
                    'Categorías y URLs',
                    'FAQs y schema',
                    'Interlinking contextual',
                    'Publicación en CMS',
                    'Indexación y seguimiento',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-900/8 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      <CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-700" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { title: 'Diagnóstico', image: '/modules/seo-cannibalization.png' },
                  { title: 'GEO / AI Search', image: '/modules/seo-geo.png' },
                  { title: 'Contenido', image: '/modules/seo-viral.png' },
                ].map((card) => (
                  <div key={card.title} className="overflow-hidden rounded-[28px] border border-slate-900/8 bg-white/80 shadow-sm">
                    <div className="relative h-40">
                      <Image src={card.image} alt={card.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-black text-slate-950">{card.title}</p>
                      <p className="mt-1 text-sm text-slate-500">Listo para operar dentro de la plataforma.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="reveal-section mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-[36px] border border-slate-900/8 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-8 py-10 text-white shadow-[0_24px_100px_rgba(15,23,42,0.25)] sm:px-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                <MessageSquare className="h-3.5 w-3.5" />
                El chat como centro de mando
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
                Un prompt puede activar toda la cadena SEO.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/70">
                Conecta tus datos, escribe una intención y deja que el sistema te responda con oportunidades, activos y acciones.
                El usuario no “usa herramientas”. La plataforma hace el trabajo.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:hello@rankerize.com"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Hablar del producto
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
