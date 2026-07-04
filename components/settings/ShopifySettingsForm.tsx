'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ShoppingCart, Link, CheckCircle2, XCircle,
  Loader2, ExternalLink, Zap, RefreshCw, Store
} from 'lucide-react'

interface ShopInfo {
  shopName: string
  shopDomain: string
  shopDisplayDomain?: string
  shopCurrency?: string
  connected: boolean
  updatedAt?: string
}

export default function ShopifySettingsForm({ projectId }: { projectId?: string }) {
  const searchParams = useSearchParams()

  const [shopInput, setShopInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)

  // Leer mensajes de la URL tras el redirect OAuth
  useEffect(() => {
    const oauthSuccess = searchParams.get('shopify_success')
    const oauthError = searchParams.get('shopify_error')
    const shopName = searchParams.get('shop')

    if (oauthSuccess) {
      setSuccess(`¡Tienda "${decodeURIComponent(shopName ?? '')}" conectada exitosamente con Shopify ✓`)
    }
    if (oauthError) {
      setError(decodeURIComponent(oauthError))
    }
  }, [searchParams])

  // Cargar config guardada
  useEffect(() => {
    async function loadConfig() {
      try {
        let url = '/api/settings/shopify'
        if (projectId) url += `?projectId=${projectId}`
        const res = await fetch(url)
        const json = await res.json()
        if (json.success && json.data?.connected) {
          setShopInfo({
            shopName: json.data.shopName ?? '',
            shopDomain: json.data.shopDomain ?? '',
            shopDisplayDomain: json.data.shopDisplayDomain ?? json.data.shopDomain,
            shopCurrency: json.data.shopCurrency ?? '',
            connected: true,
            updatedAt: json.data.updatedAt,
          })
          setShopInput(json.data.shopDomain ?? '')
        } else {
          setShopInfo(null)
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [success, projectId]) // recarga si hay nuevo éxito o cambia proyecto

  // Iniciar OAuth con Shopify
  const handleConnect = () => {
    if (!shopInput.trim()) {
      setError('Ingresa el dominio de tu tienda primero.')
      return
    }
    setConnecting(true)
    setError('')
    // Redireccionamos al endpoint que inicia el OAuth
    let url = `/api/auth/shopify?shop=${encodeURIComponent(shopInput.trim())}`
    if (projectId) url += `&projectId=${projectId}`
    window.location.href = url
  }

  // Desconectar (elimina config de Firestore)
  const handleDisconnect = async () => {
    if (!confirm('¿Seguro que deseas desconectar tu tienda de Shopify?')) return
    try {
      let url = '/api/settings/shopify'
      if (projectId) url += `?projectId=${projectId}`
      const res = await fetch(url, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setShopInfo(null)
        setShopInput('')
        setSuccess('')
        setError('')
      }
    } catch {
      setError('No se pudo desconectar. Intenta de nuevo.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-500 py-6">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Cargando configuración de Shopify...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Estado: Conectado ─────────────────────────────────────────────── */}
      {shopInfo?.connected && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-50/50">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50" />
          <div className="relative p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-emerald-900 text-base truncate">{shopInfo.shopName}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado
                </span>
              </div>
              <p className="text-xs text-emerald-700 truncate mt-0.5">{shopInfo.shopDisplayDomain ?? shopInfo.shopDomain}</p>
              {shopInfo.shopCurrency && (
                <p className="text-xs text-slate-500 mt-1">Moneda: {shopInfo.shopCurrency}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handleConnect}
                className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Reconectar
              </button>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                <XCircle className="w-3 h-3" /> Desconectar
              </button>
            </div>
          </div>
          {/* Scopes activos */}
          <div className="px-5 pb-4 flex flex-wrap gap-2 relative">
            {['Productos', 'Contenido / Blog', 'Publicación IA'].map(scope => (
              <span key={scope} className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                <CheckCircle2 className="w-3 h-3" /> {scope}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Formulario de conexión ────────────────────────────────────────── */}
      {!shopInfo?.connected && (
        <>
          {/* Instrucciones simplificadas */}
          <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 text-sm shadow-sm">
            <Zap className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-600 text-xs leading-relaxed">
              <p className="font-semibold text-slate-900 text-sm">Conexión segura vía OAuth</p>
              <p>Ingresa el dominio <strong className="text-slate-900">.myshopify.com</strong> de tu tienda y haz clic en Conectar. Serás redirigido a Shopify para autorizar el acceso de forma segura. <strong className="text-slate-900">No necesitas copiar ningún token.</strong></p>
              <p className="text-slate-500">El dominio .myshopify.com lo encuentras en: Shopify Admin → Settings → Domains.</p>
            </div>
          </div>

          {/* Input dominio */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Link className="w-4 h-4 text-green-500" />
              Dominio de tu tienda
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={shopInput}
                onChange={e => { setShopInput(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                placeholder="el-ofertazo-colombia.myshopify.com"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-colors shadow-sm"
              />
            </div>
          </div>

          {/* Botón conectar */}
          <button
            onClick={handleConnect}
            disabled={connecting || !shopInput.trim()}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {connecting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Conectando...</>
            ) : (
              <><ShoppingCart className="w-4 h-4" /> Conectar con Shopify</>
            )}
          </button>

          {/* Link a documentación */}
          <div className="flex justify-center">
            <a
              href="https://admin.shopify.com/store/el-ofertazo-colombia/settings/domains"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              ¿Dónde encuentro mi dominio .myshopify.com? <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </>
      )}

      {/* ── Mensajes de error/éxito ──────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          {success}
        </div>
      )}
    </div>
  )
}
