'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import WPSettingsForm from '@/components/settings/WPSettingsForm'
import GoogleSettingsForm from '@/components/settings/GoogleSettingsForm'
import EcommerceSettings from '@/components/settings/EcommerceSettings'
import ShopifySettingsForm from '@/components/settings/ShopifySettingsForm'
import AISettingsForm from '@/components/settings/AISettingsForm'
import { Globe, Zap, ShieldCheck, Share2, ShoppingBag, Package, AlertCircle, ShoppingCart, Sparkles } from 'lucide-react'

export default function SettingsPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const [hasWooCommerce, setHasWooCommerce] = useState<boolean | null>(null)
  const [wpConnected, setWpConnected] = useState(false)

  function handleWooCommerceDetected(hasWC: boolean) {
    setHasWooCommerce(hasWC)
    setWpConnected(true)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-12">
      {/* Encabezado Principal */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-600/10 border border-brand-500/20 rounded-xl text-brand-400 shadow-lg shadow-brand-500/10">
            <Share2 className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 uppercase">
            Integraciones <span className="text-brand-500 italic text-2xl lowercase font-medium ml-1">v2.1 PRO</span>
          </h1>
        </div>
        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
          Gestiona las conexiones críticas de tu ecosistema de generación y análisis de contenido.
          Conecta Search Console, Analytics, WordPress e IA en un solo hub centralizado.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12">

        {/* Sección de IA — NUEVA SECCIÓN PARA PROYECTO */}
        <section className="relative group/section">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-brand-500/5 rounded-3xl blur opacity-25 group-hover/section:opacity-50 transition duration-1000" />
          <div className="relative bg-white/50 backdrop-blur-xl border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 bg-white/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">Motor de Inteligencia Artificial</h2>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                Google Gemini / OpenAI
              </span>
            </div>
            <div className="p-8">
              <AISettingsForm projectId={projectId} />
            </div>
          </div>
        </section>

        {/* Sección de Google Search Console & Analytics */}
        <section className="relative group/section">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/10 to-indigo-500/5 rounded-3xl blur opacity-25 group-hover/section:opacity-50 transition duration-1000" />
          <div className="relative bg-white/50 backdrop-blur-xl border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 bg-white/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-brand-400" />
                <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">Ecosistema Google</h2>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                Search Console + Analytics
              </span>
            </div>
            <div className="p-8">
              <GoogleSettingsForm projectId={projectId} />
            </div>
          </div>
        </section>

        {/* Sección de WordPress */}
        <section className="relative group/section">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/10 to-brand-600/5 rounded-3xl blur opacity-25 group-hover/section:opacity-50 transition duration-1000" />
          <div className="relative bg-white/50 backdrop-blur-xl border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 bg-white/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-brand-400" />
                <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">Conexión con WordPress</h2>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                <Zap className="w-3 h-3" /> API Activa
              </span>
            </div>
            <div className="p-8">
              <WPSettingsForm projectId={projectId} onWooCommerceDetected={handleWooCommerceDetected} />
            </div>
          </div>
        </section>

        {/* ── Sección WooCommerce — visible SOLO si WP detecta WC instalado ── */}
        {wpConnected && hasWooCommerce === true && (
          <section className="relative group/section animate-in slide-in-from-bottom-4 duration-500">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/10 to-amber-500/5 rounded-3xl blur opacity-25 group-hover/section:opacity-50 transition duration-1000" />
            <div className="relative bg-white/50 backdrop-blur-xl border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-200 bg-white/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-orange-400" />
                  <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">WooCommerce · Ecommerce Engine</h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/15 border border-orange-500/25 rounded-full text-[10px] font-black text-orange-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    Detectado ✓
                  </span>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                  <Zap className="w-3 h-3" /> Optimizador IA
                </span>
              </div>
              <div className="p-8">
                <EcommerceSettings projectId={projectId} />
              </div>
            </div>
          </section>
        )}

        {/* Mensaje cuando WP conectado pero sin WooCommerce */}
        {wpConnected && hasWooCommerce === false && (
          <div className="flex items-start gap-4 p-5 bg-white/40 border border-slate-200 rounded-2xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
              <Package className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">WooCommerce no detectado en tu sitio</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tu WordPress está conectado correctamente ✓, pero no se encontró WooCommerce activo.
                Si tienes una tienda online que optimizar, instala el plugin WooCommerce y vuelve a conectar.
              </p>
            </div>
            <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          </div>
        )}



        {/* ── Sección Shopify ──────────────────────────────────────────────── */}
        <section className="relative group/section">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-500/10 to-emerald-500/5 rounded-3xl blur opacity-25 group-hover/section:opacity-50 transition duration-1000" />
          <div className="relative bg-white/50 backdrop-blur-xl border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 bg-white/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-green-400" />
                <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">Shopify · Ecommerce Engine</h2>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-400 uppercase tracking-widest">
                <Zap className="w-3 h-3" /> Sync con IA
              </span>
            </div>
            <div className="p-8">
              <ShopifySettingsForm projectId={projectId} />
            </div>
          </div>
        </section>


      </div>

      {/* Footer de Seguridad */}
      <footer className="pt-8 border-t border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Tus credenciales están encriptadas y se almacenan de forma segura.
        </div>
        <div className="text-xs text-slate-500 italic">
          Versión del Hub: 1.1.0-integrations
        </div>
      </footer>
    </div>
  )
}
