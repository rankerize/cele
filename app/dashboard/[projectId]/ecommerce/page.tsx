'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBag, RefreshCw, Search, Loader2, ExternalLink, Sparkles,
  AlertCircle, X, CheckCircle2, Coins, ImageOff, ChevronLeft, ChevronRight,
  Settings2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WCProductImage { id: number; src: string; name: string; alt: string }
interface WCProduct {
  id: number
  name: string
  description: string
  short_description: string
  slug: string
  status: 'publish' | 'draft' | 'pending'
  link: string
  price: string
  images: WCProductImage[]
}
interface WCOptimizeResult {
  productId: number
  updatedFields: {
    name?: string
    description?: string
    short_description?: string
    imagesAlt?: { id: number; alt: string }[]
  }
  creditsRemaining: number
  pushedAt: string
}

type StatusFilter = 'publish' | 'draft' | 'pending' | 'any'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').trim()
}

function truncate(str: string, n: number) {
  if (!str) return ''
  const clean = stripHtml(str)
  return clean.length > n ? clean.slice(0, n) + '…' : clean
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WCProduct['status'] }) {
  const styles: Record<WCProduct['status'], string> = {
    publish: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    draft:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    pending: 'bg-brand-500/10 text-brand-400 border border-brand-500/20',
  }
  const labels = { publish: 'Publicado', draft: 'Borrador', pending: 'Pendiente' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function AltBadge({ alt }: { alt: string }) {
  if (!alt) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-500/10 text-red-400 border border-red-500/20">
      <ImageOff className="w-2.5 h-2.5" /> Sin ALT
    </span>
  )
  return <span className="text-xs text-slate-600 truncate max-w-[140px]" title={alt}>{alt}</span>
}

// ─── Optimize Modal ───────────────────────────────────────────────────────────

function OptimizeModal({
  product,
  result,
  loading,
  error,
  onClose,
}: {
  product: WCProduct | null
  result: WCOptimizeResult | null
  loading: boolean
  error: string
  onClose: () => void
}) {
  if (!product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Optimización con IA</p>
              <p className="text-[11px] text-slate-500 truncate max-w-[280px]">{product.name}</p>
            </div>
          </div>
          {!loading && (
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Loading state */}
          {loading && !result && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border-r-2 border-brand-500 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-slate-500 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-white animate-pulse">Optimizando con IA...</p>
                <p className="text-xs text-slate-500">Analizando nombre, descripción e imágenes</p>
              </div>
            </div>
          )}

          {/* Error 402 — no credits */}
          {error === '402' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                <Coins className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white mb-1">Sin créditos disponibles</p>
                <p className="text-sm text-slate-600">Agota tus créditos actuales o recarga para continuar optimizando.</p>
              </div>
              <button onClick={onClose} className="btn-secondary mt-2">Cerrar</button>
            </div>
          )}

          {/* Generic error */}
          {error && error !== '402' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white mb-1">Error al optimizar</p>
                <p className="text-sm text-slate-600">{error}</p>
              </div>
              <button onClick={onClose} className="btn-secondary mt-2">Cerrar</button>
            </div>
          )}

          {/* Success result */}
          {result && !error && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300 font-medium">¡Producto actualizado en tu tienda!</p>
                <span className="ml-auto flex items-center gap-1 text-xs text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  <Coins className="w-3 h-3 text-amber-400" />
                  {result.creditsRemaining} créditos restantes
                </span>
              </div>

              {result.updatedFields.name && (
                <div className="bg-white/60 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1.5">Nuevo Nombre SEO</p>
                  <p className="text-sm text-white font-medium leading-relaxed">{result.updatedFields.name}</p>
                </div>
              )}

              {result.updatedFields.short_description && (
                <div className="bg-white/60 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1.5">Nueva Descripción Corta</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{truncate(result.updatedFields.short_description, 200)}</p>
                </div>
              )}

              {result.updatedFields.imagesAlt && result.updatedFields.imagesAlt.length > 0 && (
                <div className="bg-white/60 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2">ALT de Imágenes Actualizados</p>
                  <div className="space-y-1.5">
                    {result.updatedFields.imagesAlt.map((img, i) => (
                      <div key={img.id} className="flex items-start gap-2 text-xs">
                        <span className="text-slate-600 shrink-0 mt-0.5">#{i + 1}</span>
                        <span className="text-slate-700">{img.alt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-600 text-right">
                Publicado: {new Date(result.pushedAt).toLocaleString('es-ES')}
              </p>

              <div className="flex gap-3 pt-1">
                <a
                  href={product.link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary flex-1 justify-center text-sm gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver en tienda
                </a>
                <button onClick={onClose} className="btn-primary flex-1 justify-center text-sm bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 shadow-none">
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EcommercePage() {
  const [products, setProducts] = useState<WCProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notConfigured, setNotConfigured] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('publish')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const PER_PAGE = 20

  // Optimize modal
  const [optimizingId, setOptimizingId] = useState<number | null>(null)
  const [optimizeProduct, setOptimizeProduct] = useState<WCProduct | null>(null)
  const [optimizeResult, setOptimizeResult] = useState<WCOptimizeResult | null>(null)
  const [optimizeLoading, setOptimizeLoading] = useState(false)
  const [optimizeError, setOptimizeError] = useState('')

  // ── Fetch products ────────────────────────────────────────────────

  const fetchProducts = useCallback(async (resetPage = false) => {
    const currentPage = resetPage ? 1 : page
    if (resetPage) setPage(1)
    setLoading(true)
    setError('')
    setNotConfigured(false)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: String(PER_PAGE),
        ...(search && { search }),
        ...(statusFilter !== 'any' && { status: statusFilter }),
      })
      const res = await fetch(`/api/ecommerce-engine/products?${params}`)
      const json = await res.json()

      if (!res.ok) {
        if (res.status === 503 || json.error?.toLowerCase().includes('configurar') || json.error?.toLowerCase().includes('connect')) {
          setNotConfigured(true)
          return
        }
        throw new Error(json.error || 'Error al cargar productos')
      }

      setProducts(json.data?.products ?? [])
      setTotal(json.data?.total ?? 0)
      setTotalPages(json.data?.totalPages ?? 1)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      if (msg.toLowerCase().includes('connect') || msg.toLowerCase().includes('woocommerce') || msg.toLowerCase().includes('tienda')) {
        setNotConfigured(true)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { fetchProducts() }, [page])

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => fetchProducts(true), 400)
    return () => clearTimeout(t)
  }, [search, statusFilter])

  // ── Optimize ───────────────────────────────────────────────────────

  const handleOptimize = async (product: WCProduct) => {
    setOptimizeProduct(product)
    setOptimizingId(product.id)
    setOptimizeLoading(true)
    setOptimizeResult(null)
    setOptimizeError('')

    try {
      const res = await fetch(`/api/ecommerce-engine/products/${product.id}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()

      if (res.status === 402) { setOptimizeError('402'); return }
      if (!res.ok) throw new Error(json.error || 'Error al optimizar')

      setOptimizeResult(json.data)
      // Refresh row in place
      setProducts(prev => prev.map(p => p.id === product.id
        ? { ...p, name: json.data.updatedFields.name ?? p.name, short_description: json.data.updatedFields.short_description ?? p.short_description }
        : p
      ))
    } catch (err) {
      setOptimizeError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setOptimizeLoading(false)
      setOptimizingId(null)
    }
  }

  const closeModal = () => {
    setOptimizeProduct(null)
    setOptimizeResult(null)
    setOptimizeError('')
  }

  // ── Not configured empty state ─────────────────────────────────────

  if (!loading && notConfigured) {
    return (
      <div className="card text-center p-12 max-w-lg mx-auto mt-10 space-y-6 border-slate-200 shadow-2xl">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
          <ShoppingBag className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-black text-white uppercase tracking-tight">Conecta tu Tienda Online</h2>
          <p className="text-sm text-slate-600 leading-relaxed px-4">
            Para usar el módulo de tienda necesitas configurar tu URL de WordPress y la App Password en la sección de integraciones.
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard/settings'}
          className="btn-primary bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 mx-auto mt-4 px-8 py-3.5 shadow-xl shadow-emerald-600/20 transition-all font-bold uppercase tracking-widest text-xs"
        >
          <Settings2 className="w-4 h-4" />
          Ir a Integraciones
        </button>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Ecommerce Engine</h1>
            <p className="text-sm text-slate-500">
              Optimiza los productos de tu tienda con IA
              {total > 0 && <span className="ml-2 text-slate-600">· {total} productos</span>}
            </p>
          </div>
        </div>

        <button
          onClick={() => { setRefreshing(true); fetchProducts() }}
          className="btn-secondary px-3 self-start md:self-auto"
          title="Refrescar"
          disabled={loading || refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Error banner ───────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="pl-9 pr-4 py-2.5 w-full bg-white border border-slate-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 rounded-lg text-sm text-slate-900 placeholder-slate-600 outline-none transition-all duration-200"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-white border border-slate-200 rounded-lg text-sm text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50 min-w-[140px]"
        >
          <option value="any">Todos los estados</option>
          <option value="publish">Publicados</option>
          <option value="draft">Borradores</option>
          <option value="pending">Pendientes</option>
        </select>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-slate-600 text-sm animate-pulse">Cargando productos de tu tienda...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] gap-3 text-center p-8">
            <ShoppingBag className="w-10 h-10 text-slate-700" />
            <p className="text-slate-600 font-medium">No se encontraron productos</p>
            <p className="text-slate-600 text-sm">Intenta cambiar los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-600 bg-white/50 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 w-[52px]">Img</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-right w-[90px]">Precio</th>
                  <th className="px-4 py-3 w-[170px]">ALT Imagen</th>
                  <th className="px-4 py-3 max-w-[220px]">Desc. Corta</th>
                  <th className="px-4 py-3 text-right w-[180px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map(product => {
                  const img = product.images?.[0]
                  const isOptimizing = optimizingId === product.id
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/30 transition-colors group">
                      {/* Thumbnail */}
                      <td className="px-4 py-3">
                        {img?.src ? (
                          <img
                            src={img.src}
                            alt={img.alt || product.name}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-200 bg-white"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-slate-700" />
                          </div>
                        )}
                      </td>

                      {/* Name + status */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className="font-medium text-slate-800 leading-tight line-clamp-2 max-w-[220px]"
                            title={product.name}
                            dangerouslySetInnerHTML={{ __html: product.name }}
                          />
                          <StatusBadge status={product.status} />
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-emerald-400">
                          {product.price ? `$${product.price}` : <span className="text-slate-600">—</span>}
                        </span>
                      </td>

                      {/* ALT */}
                      <td className="px-4 py-3">
                        <AltBadge alt={img?.alt ?? ''} />
                      </td>

                      {/* Short description */}
                      <td className="px-4 py-3 text-slate-600 text-xs leading-relaxed max-w-[220px]">
                        {truncate(product.short_description, 80) || (
                          <span className="text-slate-700 italic">Sin descripción</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={product.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 hover:text-slate-800 transition-all duration-150"
                            title="Ver en tienda"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Ver
                          </a>
                          <button
                            onClick={() => handleOptimize(product)}
                            disabled={isOptimizing}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                            style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 0 12px rgba(5,150,105,0.25)' }}
                          >
                            {isOptimizing
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Sparkles className="w-3 h-3" />
                            }
                            {isOptimizing ? 'Optimizando...' : 'Optimizar IA'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Página {page} de {totalPages} · {total} productos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-3 py-2 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600 font-medium px-2">{page}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary px-3 py-2 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Optimize modal ─────────────────────────────────────── */}
      {optimizeProduct && (
        <OptimizeModal
          product={optimizeProduct}
          result={optimizeResult}
          loading={optimizeLoading}
          error={optimizeError}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
