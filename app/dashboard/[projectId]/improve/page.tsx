'use client'

import { useState, useEffect } from 'react'
import PostSelector from '@/components/improve/PostSelector'
import ImprovementPanel from '@/components/improve/ImprovementPanel'
import BulkOptimizer from '@/components/improve/BulkOptimizer'
import { ImprovementSuggestion, ContentItem } from '@/types/content'
import { WPPost } from '@/types/wordpress'
import { WCProduct } from '@/types/woocommerce'
import {
  RefreshCw, Play, Loader2, Save, ExternalLink, Lightbulb, Zap,
  ShoppingBag, FileText, Package, Image, Search, ChevronRight, X
} from 'lucide-react'
import { saveToHistory, generateId } from '@/lib/utils'
import { useAppCache } from '@/lib/AppCacheContext'
import CacheStatusBadge from '@/components/ui/CacheStatusBadge'

type Tab = 'manual' | 'bulk'
type ContentType = 'post' | 'product'

// ── WC Product List component ─────────────────────────────────────────────
function WCProductSelector({
  onSelect,
  selectedProductId,
}: {
  onSelect: (p: WCProduct) => void
  selectedProductId?: number
}) {
  const [products, setProducts] = useState<WCProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [page])

  async function fetchProducts() {
    setLoading(true)
    setError('')
    try {
      const url = `/api/ecommerce-engine/products?page=${page}&per_page=15&status=publish${search ? `&search=${encodeURIComponent(search)}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Error al cargar productos')
      setProducts(json.data.products)
      setTotalPages(json.data.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-slate-700 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          Seleccionar producto WooCommerce
        </h2>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="pl-9 pr-3 py-2 w-full text-sm bg-white border border-slate-200 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <button type="submit" className="btn-secondary text-sm px-3 py-2">Buscar</button>
      </form>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
          {error}
          {error.includes('incompleta') && (
            <a href="/dashboard/settings" className="ml-2 underline">Configurar WooCommerce</a>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
          {products.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              No se encontraron productos. Verifica la configuración de WooCommerce.
            </p>
          ) : products.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                selectedProductId === p.id
                  ? 'bg-emerald-600/20 border border-emerald-500/40'
                  : 'bg-white border border-transparent hover:border-slate-300'
              }`}
            >
              {p.images?.[0]?.src ? (
                <img
                  src={p.images[0].src}
                  alt={p.images[0].alt || p.name}
                  className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-300 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-slate-500" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Image className="w-3 h-3" /> {p.images?.length || 0} imgs
                  </span>
                  <span>{p.price ? `$${p.price}` : 'Sin precio'}</span>
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs text-slate-600 disabled:opacity-30 hover:text-white transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-xs text-slate-500">Página {page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs text-slate-600 disabled:opacity-30 hover:text-white transition-colors"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ImprovePage() {
  const [activeTab, setActiveTab] = useState<Tab>('manual')
  const [contentType, setContentType] = useState<ContentType>('post')

  // WP Post state
  const [selectedPost, setSelectedPost] = useState<WPPost | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editedSeoTitle, setEditedSeoTitle] = useState('')
  const [editedMetaDescription, setEditedMetaDescription] = useState('')
  const [editedSlug, setEditedSlug] = useState('')
  const [keyword, setKeyword] = useState('')
  const [gscMetrics, setGscMetrics] = useState<any[]>([])
  const [loadingGsc, setLoadingGsc] = useState(false)

  // WC Product state
  const [selectedProduct, setSelectedProduct] = useState<WCProduct | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeResult, setOptimizeResult] = useState<any>(null)

  // Cache global — persiste entre navegación
  const cache = useAppCache()

  // Shared state
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [loadingUpdate, setLoadingUpdate] = useState(false)
  const [publishingStep, setPublishingStep] = useState(0)  // 0=idle 1=preparando 2=subiendo 3=guardando
  const [suggestion, setSuggestion] = useState<ImprovementSuggestion | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastPostTitle, setToastPostTitle] = useState('')
  const [interlinkingDone, setInterlinkingDone] = useState(false)
  const [interlinkingCount, setInterlinkingCount] = useState(0)
  /** Post recien actualizado — se pasa a PostSelector para refrescar su score en vivo */
  const [lastUpdatedPost, setLastUpdatedPost] = useState<WPPost | null>(null)

  // Bulk mode — usa cache global para no re-fetchear
  const [loadingBulkPosts, setLoadingBulkPosts] = useState(false)

  const steps = [
    { label: 'Analizando contenido actual...', icon: '🔍' },
    { label: 'Encontrando oportunidades de mejora...', icon: '💡' },
    { label: 'Realizando Keyword Research...', icon: '📈' },
    { label: 'Analizando SEO Técnico y semántica...', icon: '⚙️' },
    { label: 'Generando Meta-datos y Schema...', icon: '📰' },
    { label: 'Redactando versión maestra optimizada...', icon: '✍️' }
  ]

  // Cargar config IA solo si no está en cache
  useEffect(() => {
    if (cache.aiProviderLoaded) return
    async function loadAIConfig() {
      try {
        const res = await fetch('/api/settings/ai')
        const json = await res.json()
        if (json.success && json.data?.provider) {
          cache.setAiProvider(json.data.provider)
        }
      } catch (e) {
        console.error('Error loading AI config:', e)
      }
    }
    loadAIConfig()
  }, [cache.aiProviderLoaded])

  // Bulk posts — solo fetchear si no están en cache
  useEffect(() => {
    if (activeTab !== 'bulk' || cache.postsLoaded) return
    async function fetchBulkPosts() {
      setLoadingBulkPosts(true)
      try {
        const res = await fetch('/api/wordpress/posts?per_page=100')
        const json = await res.json()
        if (json.success && json.data?.posts) cache.setPosts(json.data.posts, json.data.total, json.data.totalPages)
      } catch (e) {
        console.error('Error fetching bulk posts:', e)
      } finally {
        setLoadingBulkPosts(false)
      }
    }
    fetchBulkPosts()
  }, [activeTab])

  // Reset state when changing content type
  useEffect(() => {
    setSelectedPost(null)
    setSelectedProduct(null)
    setSuggestion(null)
    setOptimizeResult(null)
    setError('')
    setSuccess('')
    setGscMetrics([])
  }, [contentType])

  // ── WP Post handlers ──
  const handleSelectPost = async (post: WPPost) => {
    setSelectedPost(post)
    setEditedTitle(post.title.rendered)
    setEditedContent(post.content.rendered)
    setEditedSlug(post.slug)
    setEditedSeoTitle(post.meta?.['_yoast_wpseo_title'] || post.meta?.['_seo_title'] || '')
    setEditedMetaDescription(post.meta?.['_yoast_wpseo_metadesc'] || post.meta?.['_meta_description'] || '')
    const currentKeyword = post.meta?.['_keyword_principal'] || ''
    setKeyword(currentKeyword)
    setSuggestion(null)
    setError('')
    setSuccess('')

    setLoadingGsc(true)
    setGscMetrics([])
    try {
      const gscRes = await fetch('/api/gsc/url-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: post.link })
      })
      const gscJson = await gscRes.json()
      if (gscJson.success && gscJson.data?.length > 0) {
        const sorted = gscJson.data.sort((a: any, b: any) => b.impressions - a.impressions)
        setGscMetrics(sorted)
        if (!currentKeyword) setKeyword(sorted[0].keys[0])
      }
    } catch (e) {
      console.error('GSC Error', e)
    } finally {
      setLoadingGsc(false)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedPost) return
    if (cache.credits < 7) {
      setError('Créditos insuficientes. Necesitas al menos 7 créditos para auditar con IA.')
      return
    }
    
    setLoadingAnalysis(true)
    setAnalysisStep(0)
    setError('')
    setSuccess('')
    
    cache.deductCredits(7)

    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 3000)
    try {
      const res = await fetch(`/api/wordpress/posts/${selectedPost.id}/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editedTitle, content: editedContent, keyword })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Error al analizar contenido')
      clearInterval(stepInterval)
      setAnalysisStep(steps.length - 1)
      setTimeout(() => { setSuggestion(json.data); setLoadingAnalysis(false) }, 800)
    } catch (err) {
      clearInterval(stepInterval)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoadingAnalysis(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedPost) return
    setLoadingUpdate(true)
    setPublishingStep(1)   // Preparando cambios
    setError('')
    setSuccess('')
    try {
      const metaToUpdate: Record<string, string> = {}
      if (keyword) metaToUpdate['_keyword_principal'] = keyword
      if (editedSeoTitle) {
        metaToUpdate['_yoast_wpseo_title'] = editedSeoTitle
        metaToUpdate['_seo_title'] = editedSeoTitle
      }
      if (editedMetaDescription) {
        metaToUpdate['_yoast_wpseo_metadesc'] = editedMetaDescription
        metaToUpdate['_meta_description'] = editedMetaDescription
      }

      // Paso 2: subiendo
      setTimeout(() => setPublishingStep(2), 600)

      const res = await fetch(`/api/wordpress/posts/${selectedPost.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editedTitle, content: editedContent, slug: editedSlug, meta: metaToUpdate })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Error al actualizar post')

      // Paso 3: guardando historial
      setPublishingStep(3)
      const historyItem: ContentItem = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        type: 'improvement',
        status: 'improved',
        wordpressPostId: selectedPost.id,
        wordpressPostUrl: selectedPost.link,
        improvementData: suggestion || undefined,
        gscMetrics: gscMetrics.length > 0 ? {
          impressions: gscMetrics.reduce((acc, m) => acc + m.impressions, 0),
          clicks: gscMetrics.reduce((acc, m) => acc + m.clicks, 0),
          position: gscMetrics.reduce((acc, m) => acc + m.position, 0) / gscMetrics.length
        } : undefined
      }
      const saved = await saveToHistory(historyItem)
      setSuccess(saved
        ? 'Post actualizado con mejoras SEO en WordPress y guardado en el historial.'
        : 'Post actualizado en WordPress, pero hubo un problema al guardar en el historial.'
      )

      // ✅ Actualizar PostSelector en tiempo real — construir versión parcheada del post
      // con los datos que el usuario acaba de guardar para que el score se recalcule
      setLastUpdatedPost({
        ...selectedPost,
        title: { rendered: editedTitle },
        content: { rendered: editedContent },
        slug: editedSlug,
        meta: {
          ...selectedPost.meta,
          '_keyword_principal': keyword,
          '_yoast_wpseo_title': editedSeoTitle,
          '_seo_title': editedSeoTitle,
          '_yoast_wpseo_metadesc': editedMetaDescription,
          '_meta_description': editedMetaDescription,
        }
      })

      // Mostrar toast de éxito
      setToastPostTitle(selectedPost.title?.rendered?.replace(/<[^>]+>/g, '') || 'el artículo')
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 4500)

      // ── Fase de Enlazado Interno Automático ──────────────────────────────────
      // Construir lista de anchor texts desde keyword + LSI del suggestion
      const anchorTexts = [
        ...(keyword ? [keyword] : []),
        ...(suggestion?.nuevasKeywords || []),
      ].filter(Boolean).slice(0, 3)

      if (anchorTexts.length > 0 && selectedPost.link) {
        try {
          // Obtener posts del sitio para buscar candidatos a enlazar
          const postsRes = await fetch('/api/wordpress/posts?per_page=20')
          const postsJson = await postsRes.json()
          const otherPosts: Array<{ id: number; link: string; title: { rendered: string } }> =
            (postsJson.posts || postsJson || []).filter((p: any) => p.id !== selectedPost.id)

          if (otherPosts.length > 0) {
            // Tomar los primeros 2 posts candidatos (evitar saturar)
            const candidates = otherPosts.slice(0, 2)
            let linked = 0

            await Promise.allSettled(
              candidates.map(async (sourcePost, idx) => {
                const anchorText = anchorTexts[idx % anchorTexts.length]
                try {
                  const r = await fetch('/api/interlinking/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sourcePostId: sourcePost.id,
                      targetUrl: selectedPost.link,
                      anchorText,
                    }),
                  })
                  if (r.ok) linked++
                } catch { /* silencioso */ }
              })
            )

            if (linked > 0) {
              setInterlinkingDone(true)
              setInterlinkingCount(linked)
            }
          }
        } catch { /* el post ya se actualizó, el enlazado es bonus */ }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al actualizar')
    } finally {
      setLoadingUpdate(false)
      setPublishingStep(0)
    }
  }

  // ── WC Product handler ──
  const handleOptimizeProduct = async () => {
    if (!selectedProduct) return
    if (cache.credits < 7) {
      setError('Créditos insuficientes. Necesitas al menos 7 créditos para optimizar un producto.')
      return
    }
    
    setOptimizing(true)
    setError('')
    setSuccess('')
    setOptimizeResult(null)
    
    cache.deductCredits(7)

    try {
      const res = await fetch(`/api/ecommerce-engine/products/${selectedProduct.id}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Error al optimizar producto')
      setOptimizeResult(json.data)
      setSuccess(`¡Producto optimizado! Créditos restantes: ${json.data.creditsRemaining}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al optimizar')
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── SUCCESS TOAST (fixed, centrado) ─────────────────────────── */}
      {showSuccessToast && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            style={{ animation: 'toast-bg-in 0.3s ease-out' }}
            onClick={() => setShowSuccessToast(false)}
          />
          <div className="relative max-w-sm w-full mx-4 z-10"
            style={{ animation: 'toast-in 0.4s cubic-bezier(0.16,1,0.3,1)' }}
          >
            {/* Glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/40 to-green-400/10 blur-sm" />
            <div className="relative rounded-2xl bg-[#0c1f16] border border-emerald-500/40 p-7 shadow-2xl shadow-emerald-900/60 overflow-hidden text-center">

              {/* Barra que se consume = timer visual */}
              <div className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 rounded-t-2xl"
                style={{ width:'100%', animation:'progress-consume 4.5s linear forwards' }} />

              {/* Check animado */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/50 flex items-center justify-center"
                  style={{ animation:'check-pop 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{ strokeDasharray:32, strokeDashoffset:32,
                        animation:'check-draw 0.6s ease-out 0.3s forwards' }} />
                  </svg>
                </div>
              </div>

              <p className="text-lg font-bold text-white mb-1">¡Optimizado y publicado!</p>
              <p className="text-xs text-slate-600 line-clamp-2 mb-5 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: toastPostTitle }} />

              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  WordPress actualizado
                </span>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  Historial guardado
                </span>
              </div>

              <button onClick={() => setShowSuccessToast(false)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/10 transition-colors text-sm">
                ✕
              </button>
            </div>
          </div>
          <style>{`
            @keyframes toast-bg-in  { from{opacity:0} to{opacity:1} }
            @keyframes toast-in     { from{opacity:0;transform:scale(.85) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
            @keyframes check-pop    { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
            @keyframes check-draw   { to{stroke-dashoffset:0} }
            @keyframes progress-consume { from{width:100%} to{width:0%} }
          `}</style>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Mejorar contenido</h1>
            <p className="text-sm text-slate-500">Evalúa e inyecta mejoras SEO a Posts o Productos</p>
          </div>
        </div>
        <CacheStatusBadge
          lastFetch={cache.lastFetch['posts']}
          loading={loadingBulkPosts}
          onRefresh={() => { cache.invalidate('posts'); cache.invalidate('products') }}
        />
      </div>

      {/* Content type selector */}
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <button
          onClick={() => setContentType('post')}
          className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-xl transition-all duration-300 ${
            contentType === 'post'
              ? 'bg-purple-600/20 border-purple-500/40 text-white shadow-[0_0_20px_rgba(139,92,246,0.15)]'
              : 'bg-white/5 border-white/10 text-slate-600 hover:border-white/20 hover:bg-white/10'
          }`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            contentType === 'post' ? 'bg-purple-600/30' : 'bg-white'
          }`}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Post / Artículo</p>
            <p className="text-xs text-slate-500">WordPress</p>
          </div>
        </button>

        <button
          onClick={() => setContentType('product')}
          className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-xl transition-all duration-300 ${
            contentType === 'product'
              ? 'bg-emerald-600/20 border-emerald-500/40 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)]'
              : 'bg-white/5 border-white/10 text-slate-600 hover:border-white/20 hover:bg-white/10'
          }`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            contentType === 'product' ? 'bg-emerald-600/30' : 'bg-white'
          }`}>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Producto</p>
            <p className="text-xs text-slate-500">WooCommerce</p>
          </div>
        </button>
      </div>

      {/* ── PRODUCT MODE ─────────────────────────────────────────────────── */}
      {contentType === 'product' && (
        <div className="max-w-7xl space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Product list */}
            <WCProductSelector
              onSelect={p => { setSelectedProduct(p); setOptimizeResult(null); setError(''); setSuccess('') }}
              selectedProductId={selectedProduct?.id}
            />

            {/* Right: Product editor / result */}
            {selectedProduct ? (
              <div className="space-y-4">
                {/* Product summary card */}
                <div className="card p-5 space-y-4 bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl">
                  <div className="flex items-start gap-4">
                    {selectedProduct.images?.[0]?.src ? (
                      <img
                        src={selectedProduct.images[0].src}
                        alt={selectedProduct.name}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-slate-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold text-white">{selectedProduct.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: selectedProduct.short_description || '<em>Sin descripción corta</em>' }}
                      />
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Image className="w-3 h-3"/> {selectedProduct.images?.length || 0} imágenes
                        </span>
                        {selectedProduct.price && <span className="text-emerald-400 font-medium">${selectedProduct.price}</span>}
                        {selectedProduct.sku && <span>SKU: {selectedProduct.sku}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Images ALTs preview */}
                  {selectedProduct.images?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">ALT de imágenes actuales</p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {selectedProduct.images.map((img, i) => (
                          <div key={img.id} className="flex items-center gap-2 text-xs">
                            <img src={img.src} alt="" className="w-8 h-8 rounded object-cover border border-slate-200 flex-shrink-0" />
                            <span className={`flex-1 truncate ${img.alt ? 'text-slate-700' : 'text-slate-600 italic'}`}>
                              {img.alt || '(vacío)'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Optimize button */}
                  <button
                    onClick={handleOptimizeProduct}
                    disabled={optimizing}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {optimizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Optimizando con {cache.aiProvider}...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Optimizar producto con IA (7 🪙)
                      </>
                    )}
                  </button>
                </div>

                {/* Error/success */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                    {error.includes('Créditos') && (
                      <span className="block mt-1 text-xs">Recarga tu saldo en Configuración.</span>
                    )}
                  </div>
                )}
                {success && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex justify-between items-center">
                    <span>{success}</span>
                    <a href={`${selectedProduct.link}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline text-xs">
                      Ver producto <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Optimization result */}
                {optimizeResult && (
                  <div className="card p-5 space-y-4 border-emerald-500/20">
                    <h3 className="font-display text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Campos actualizados en WooCommerce
                    </h3>
                    <div className="space-y-3">
                      {optimizeResult.updatedFields?.name && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nombre</p>
                          <p className="text-sm text-white font-medium">{optimizeResult.updatedFields.name}</p>
                        </div>
                      )}
                      {optimizeResult.updatedFields?.short_description && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Descripción corta</p>
                          <p className="text-sm text-slate-700">{optimizeResult.updatedFields.short_description}</p>
                        </div>
                      )}
                      {optimizeResult.updatedFields?.imagesAlt?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">ALTs de imágenes</p>
                          <div className="space-y-1">
                            {optimizeResult.updatedFields.imagesAlt.map((img: any) => (
                              <div key={img.id} className="flex items-center gap-2 text-xs text-slate-700">
                                <span className="w-4 h-4 rounded-full bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">✓</span>
                                <span>{img.alt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                      Actualizado: {new Date(optimizeResult.pushedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {!optimizeResult && !optimizing && (
                  <div className="card p-6 text-center border-dashed border-2 bg-white/50 flex flex-col items-center justify-center text-slate-500">
                    <ShoppingBag className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">Haz clic en <strong>"Optimizar producto con IA"</strong> para que {cache.aiProvider} genere títulos, descripciones y ALTs SEO optimizados y los publique directamente en tu tienda.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-10 border-dashed border-2 bg-white/50 flex flex-col items-center justify-center text-slate-500 text-center">
                <ShoppingBag className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">Selecciona un producto de tu tienda WooCommerce para optimizarlo</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── POST MODE ────────────────────────────────────────────────────── */}
      {contentType === 'post' && (
        <>
          {/* Mode tabs (manual / bulk) */}
          <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'manual'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Mejora manual
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'bulk'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/40'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              Optimización masiva
            </button>
          </div>

          {/* Bulk Mode */}
          {activeTab === 'bulk' && (
            <div className="max-w-4xl">
              {loadingBulkPosts ? (
                <div className="card overflow-hidden">
                  {/* Animated top bar */}
                  <div className="h-0.5 bg-slate-50 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500"
                      style={{ width: '50%', animation: 'shimmer-slide 1.4s ease-in-out infinite alternate' }} />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-xl" style={{ animation: 'bounce-icon 1.4s ease-in-out infinite' }}>📡</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Obteniendo artículos del sitio...</p>
                        <p className="text-xs text-slate-500 mt-0.5">Leyendo contenido publicado y borradores</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/50"
                          style={{ animationDelay: `${i * 100}ms` }}>
                          <div className="w-8 h-8 rounded-lg bg-slate-50 shrink-0" style={{ animation: 'shimmer-pulse 1.8s ease-in-out infinite', animationDelay: `${i * 120}ms` }} />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 rounded-full bg-slate-50" style={{ width: `${55 + (i % 3) * 14}%`, animation: 'shimmer-pulse 1.8s ease-in-out infinite', animationDelay: `${i * 100}ms` }} />
                            <div className="h-2 rounded-full bg-white" style={{ width: `${30 + (i % 4) * 10}%`, animation: 'shimmer-pulse 1.8s ease-in-out infinite', animationDelay: `${i * 100 + 200}ms` }} />
                          </div>
                          <div className="w-16 h-5 rounded-md bg-slate-50 shrink-0" style={{ animation: 'shimmer-pulse 1.8s ease-in-out infinite', animationDelay: `${i * 100 + 100}ms` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <style>{`
                    @keyframes shimmer-slide { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
                    @keyframes shimmer-pulse { 0%,100% { opacity:0.4 } 50% { opacity:0.9 } }
                    @keyframes bounce-icon { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-4px) } }
                  `}</style>
                </div>
              ) : (
                <BulkOptimizer posts={cache.posts} />
              )}
            </div>
          )}

          {/* Manual Mode */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              {/* Grid de artículos ocupa todo el ancho */}
              <PostSelector
                onSelect={handleSelectPost}
                selectedPostId={selectedPost?.id}
                updatedPost={lastUpdatedPost}
              />

              {/* ── DRAWER LATERAL ───────────────────────────────────────────── */}
              {selectedPost && (
                <>
                  {/* Overlay */}
                  <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    style={{ animation: 'drawer-fade-in 0.25s ease-out' }}
                    onClick={() => { setSelectedPost(null); setSuggestion(null); setError(''); setSuccess('') }}
                  />

                  {/* Drawer panel */}
                  <div
                    className="fixed top-0 right-0 z-50 h-full w-full max-w-[720px] bg-[#0a0a0f]/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl flex flex-col overflow-hidden"
                    style={{ animation: 'drawer-slide-in 0.3s cubic-bezier(0.16,1,0.3,1)' }}
                  >
                    {/* Drawer header */}
                    <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200 shrink-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            selectedPost.status === 'publish' ? 'bg-emerald-500' : 'bg-yellow-500'
                          }`} />
                          <span className="text-xs text-slate-500 uppercase tracking-wider">
                            {selectedPost.status === 'publish' ? 'Publicado' : 'Borrador'}
                          </span>
                        </div>
                        <h2
                          className="font-display text-base font-bold text-white line-clamp-2 leading-snug"
                          dangerouslySetInnerHTML={{ __html: selectedPost.title?.rendered || 'Sin título' }}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={selectedPost.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Ver post
                        </a>
                        <button
                          onClick={() => { setSelectedPost(null); setSuggestion(null); setError(''); setSuccess('') }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-slate-50 border border-slate-200 transition-colors"
                          title="Cerrar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Drawer body — scrollable */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-5 space-y-5">

                        {/* Alerts */}
                        {error && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
                        )}
                        {success && (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex justify-between items-center">
                            <span>{success}</span>
                            <a href={selectedPost?.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline text-xs shrink-0 ml-3">
                              Ver Post <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {/* Fields grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label>Título H1</label>
                            <input type="text" value={editedTitle} onChange={e => setEditedTitle(e.target.value)} />
                          </div>
                          <div>
                            <label>Slug URL</label>
                            <input type="text" value={editedSlug} onChange={e => setEditedSlug(e.target.value)} />
                          </div>
                          <div>
                            <label>SEO Title (Tag)</label>
                            <input type="text" value={editedSeoTitle} onChange={e => setEditedSeoTitle(e.target.value)} placeholder="Título para buscadores" />
                          </div>
                          <div>
                            <label>Keyword Principal</label>
                            <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Ej: software de contabilidad" />
                          </div>
                        </div>

                        <div>
                          <label>Meta Descripción SEO</label>
                          <textarea rows={2} value={editedMetaDescription} onChange={e => setEditedMetaDescription(e.target.value)} placeholder="Descripción para los resultados de búsqueda..." />
                        </div>

                        {/* AI Analysis loading panel */}
                        {loadingAnalysis && (
                          <div className="card p-5 bg-white border-purple-500/40 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-violet-900/10 pointer-events-none" />
                            <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-purple-500 via-violet-400 to-purple-500"
                                style={{ width: '55%', animation: 'ai-bar 2s ease-in-out infinite alternate' }} />
                            </div>
                            <div className="relative z-10">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-purple-600/25 border border-purple-500/30 flex items-center justify-center shrink-0"
                                  style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}>
                                  <span style={{ animation: 'spin-slow 3s linear infinite', display: 'inline-block' }}>✦</span>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-purple-300">Análisis IA en curso</p>
                                  <p className="text-xs text-slate-500" style={{ animation: 'blink-text 2s ease-in-out infinite' }}>Procesando tu contenido...</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {steps.map((step, idx) => (
                                  <div key={idx} className={`flex items-center gap-2 transition-all duration-700 ${idx <= analysisStep ? 'opacity-100' : 'opacity-20'}`}>
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 ${
                                      idx < analysisStep ? 'bg-emerald-600/25 border border-emerald-500/40'
                                      : idx === analysisStep ? 'bg-purple-600/30 border border-purple-500/50'
                                      : 'bg-white border border-slate-200'
                                    }`}>
                                      {idx < analysisStep ? '✅' : idx === analysisStep ? (
                                        <span style={{ animation: 'spin-slow 1.5s linear infinite', display: 'inline-block' }}>⚙️</span>
                                      ) : step.icon}
                                    </div>
                                    <p className={`text-xs font-medium ${
                                      idx === analysisStep ? 'text-white' : idx < analysisStep ? 'text-emerald-400/80' : 'text-slate-600'
                                    }`}>{step.label}</p>
                                    {idx === analysisStep && (
                                      <div className="flex gap-0.5 ml-auto shrink-0">
                                        {[0,1,2].map(d => (
                                          <div key={d} className="w-1 h-1 rounded-full bg-purple-400"
                                            style={{ animation: 'dot-blink 1.2s ease-in-out infinite', animationDelay: `${d * 200}ms` }} />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 space-y-1">
                                <div className="flex justify-between text-xs text-slate-600">
                                  <span>Progreso</span>
                                  <span className="text-purple-400 font-medium">{Math.round(((analysisStep + 1) / steps.length) * 100)}%</span>
                                </div>
                                <div className="h-1 bg-white rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-purple-600 to-violet-400 rounded-full transition-all duration-700"
                                    style={{ width: `${((analysisStep + 1) / steps.length) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                            <style>{`
                              @keyframes ai-bar { 0% { transform:translateX(-120%); } 100% { transform:translateX(250%); } }
                              @keyframes pulse-ring { 0%,100% { box-shadow:0 0 0 0 rgba(139,92,246,.3); } 50% { box-shadow:0 0 0 6px rgba(139,92,246,0); } }
                              @keyframes spin-slow { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
                              @keyframes blink-text { 0%,100% { opacity:.5; } 50% { opacity:1; } }
                              @keyframes dot-blink { 0%,80%,100% { transform:scale(.8); opacity:.4; } 40% { transform:scale(1.2); opacity:1; } }
                              @keyframes drawer-fade-in { from { opacity:0; } to { opacity:1; } }
                              @keyframes drawer-slide-in { from { transform:translateX(100%); } to { transform:translateX(0); } }
                            `}</style>
                          </div>
                        )}

                        {/* GSC Metrics */}
                        {!loadingAnalysis && (
                          <div className="card p-4 space-y-3 bg-white border-slate-200">
                            <h3 className="font-display text-sm font-bold text-slate-700 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-brand-500" />
                              Métricas de Búsqueda (Últ. 30 días)
                            </h3>
                            {loadingGsc ? (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Loader2 className="w-3 h-3 animate-spin" /> Conectando a GSC...
                              </div>
                            ) : gscMetrics.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                  <thead className="text-slate-500 uppercase">
                                    <tr>
                                      <th className="py-1">Query</th>
                                      <th className="py-1 text-right">Imp</th>
                                      <th className="py-1 text-right">Clics</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {gscMetrics.slice(0, 5).map((m, i) => (
                                      <tr key={i}>
                                        <td className="py-1.5 font-medium text-slate-700 truncate max-w-[200px]" title={m.keys[0]}>{m.keys[0]}</td>
                                        <td className="py-1.5 text-right">{m.impressions}</td>
                                        <td className="py-1.5 text-right text-brand-400 font-medium">{m.clicks}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">No hay datos en GSC o la cuenta no está conectada.</p>
                            )}
                          </div>
                        )}

                        {/* Content editor */}
                        <div className="content-editor flex flex-col">
                          <label>Contenido del Artículo (HTML)</label>
                          <textarea
                            className="w-full p-4 font-mono text-xs leading-relaxed"
                            value={editedContent}
                            onChange={e => setEditedContent(e.target.value)}
                            rows={14}
                          />
                        </div>

                        {/* Improvement suggestions */}
                        {suggestion && !loadingAnalysis && (
                          <ImprovementPanel
                            suggestion={suggestion}
                            keyword={keyword}
                            interlinkingDone={interlinkingDone}
                            interlinkingCount={interlinkingCount}
                            onApplyAll={() => {
                              setEditedTitle(suggestion.improvedTitle)
                              setEditedContent(suggestion.improvedContent)
                              setEditedSeoTitle(suggestion.improvedSeoTitle)
                              setEditedMetaDescription(suggestion.improvedMetaDescription)
                              setEditedSlug(suggestion.improvedSlug)
                            }}
                            onApplyTitle={setEditedTitle}
                            onApplyContent={c => { setEditedContent(c) }}
                            onApplyKeywords={kws => { setKeyword(prev => prev ? prev + ', ' + kws.join(', ') : kws.join(', ')) }}
                          />
                        )}

                        {!loadingAnalysis && !suggestion && (
                          <div className="card p-6 text-center border-dashed border-2 bg-white/50 flex flex-col items-center justify-center text-slate-500">
                            <Lightbulb className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">Haz clic en <strong>"Auditar con IA"</strong> para analizar el texto y proponer mejoras SEO.</p>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Drawer footer — sticky action bar */}
                    <div className="shrink-0 p-4 border-t border-slate-200 bg-[#0f1117] flex gap-3">
                      <button
                        onClick={handleAnalyze}
                        disabled={loadingAnalysis || loadingUpdate}
                        className="flex-1 btn-secondary bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600/30 justify-center shadow-[0_0_15px_rgba(139,92,246,0.15)] backdrop-blur-md"
                      >
                        {loadingAnalysis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {loadingAnalysis ? 'Analizando...' : 'Auditar con IA (7 🪙)'}
                      </button>

                      {/* Botón de publicar con fases animadas */}
                      <button
                        onClick={handleUpdate}
                        disabled={loadingUpdate || loadingAnalysis}
                        className={`flex-1 justify-center transition-all duration-300 ${
                          loadingUpdate
                            ? 'btn-primary opacity-90 cursor-not-allowed'
                            : 'btn-primary'
                        }`}
                      >
                        {loadingUpdate ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            <span key={publishingStep} style={{ animation: 'phase-in 0.3s ease-out' }}>
                              {publishingStep === 1 && 'Aplicando cambios...'}
                              {publishingStep === 2 && 'Subiendo a WordPress...'}
                              {publishingStep === 3 && 'Guardando historial...'}
                            </span>
                            <style>{`@keyframes phase-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 shrink-0" />
                            Actualizar WordPress
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
