'use client'

import { useState, useEffect, useMemo } from 'react'
import { WPPost } from '@/types/wordpress'
import { Search, Loader2, FileText, ArrowUpRight, AlertTriangle, CheckCircle2, Clock, Link as LinkIcon } from 'lucide-react'

interface Props {
  onSelect: (post: WPPost) => void
  selectedPostId?: number
  /** Post que acaba de ser actualizado — actualiza su score en tiempo real */
  updatedPost?: WPPost | null
}

// Calcula un score SEO básico a partir de los metadatos del post
function calcSeoScore(post: WPPost): number {
  let score = 0
  const title = post.title?.rendered || ''
  const content = post.content?.rendered || ''
  const excerpt = post.excerpt?.rendered || ''
  const slug = post.slug || ''

  // Título (25 pts)
  if (title.length > 0) score += 10
  if (title.length >= 30 && title.length <= 60) score += 15
  else if (title.length > 0) score += 5

  // Contenido (30 pts)
  const wordCount = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  if (wordCount >= 1000) score += 30
  else if (wordCount >= 600) score += 20
  else if (wordCount >= 300) score += 10
  else if (wordCount > 0) score += 5

  // Excerpt / meta descripción (15 pts)
  const excerptText = excerpt.replace(/<[^>]+>/g, '').trim()
  if (excerptText.length >= 120 && excerptText.length <= 160) score += 15
  else if (excerptText.length > 0) score += 7

  // Slug amigable (10 pts)
  if (slug && slug.length > 0 && slug.length <= 60 && !slug.includes('?') && !slug.includes('=')) score += 10

  // Keyword principal en meta (10 pts)
  const keyword = post.meta?.['_keyword_principal'] || ''
  if (keyword) score += 10

  // SEO title separado (10 pts)
  const seoTitle = post.meta?.['_yoast_wpseo_title'] || post.meta?.['_seo_title'] || ''
  if (seoTitle) score += 10

  return Math.min(score, 100)
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
    score >= 50 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
    'text-red-400 border-red-500/30 bg-red-500/10'

  const barColor =
    score >= 75 ? 'bg-emerald-500' :
    score >= 50 ? 'bg-yellow-500' :
    'bg-red-500'

  const label =
    score >= 75 ? 'Bueno' :
    score >= 50 ? 'Mejorable' :
    'Crítico'

  const Icon =
    score >= 75 ? CheckCircle2 :
    score >= 50 ? Clock :
    AlertTriangle

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
        <Icon className="w-3 h-3" />
        <span>{score}</span>
      </div>
      <div className="w-16 h-1 bg-slate-50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium ${color.split(' ')[0]}`}>{label}</span>
    </div>
  )
}

export default function PostSelector({ onSelect, selectedPostId, updatedPost }: Props) {
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState<WPPost[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'score_asc' | 'score_desc' | 'title'>('score_asc')

  // Carga inicial de todos los posts
  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const res = await fetch('/api/wordpress/posts?per_page=100')
        const json = await res.json()
        if (json.success && json.data?.posts) {
          setPosts(json.data.posts)
        }
      } catch (e) {
        console.error('Error fetching posts:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // ✅ Cuando el padre avisa que un post fue actualizado, parcheamos la lista local
  // Esto re-calcula el score inmediatamente sin hacer un nuevo fetch
  useEffect(() => {
    if (!updatedPost) return
    setPosts(prev =>
      prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p)
    )
  }, [updatedPost])

  // Posts con score calculado, filtrados y ordenados
  const processedPosts = useMemo(() => {
    const withScore = posts.map(p => ({ post: p, score: calcSeoScore(p) }))

    const filtered = query.trim()
      ? withScore.filter(({ post }) =>
          post.title?.rendered?.toLowerCase().includes(query.toLowerCase()) ||
          post.slug?.toLowerCase().includes(query.toLowerCase())
        )
      : withScore

    return filtered.sort((a, b) => {
      if (sortBy === 'score_asc') return a.score - b.score
      if (sortBy === 'score_desc') return b.score - a.score
      return (a.post.title?.rendered || '').localeCompare(b.post.title?.rendered || '')
    })
  }, [posts, query, sortBy])

  const criticalCount = processedPosts.filter(({ score }) => score < 50).length
  const improvableCount = processedPosts.filter(({ score }) => score >= 50 && score < 75).length
  const goodCount = processedPosts.filter(({ score }) => score >= 75).length

  if (loading) {
    return (
      <div className="card p-10 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <p className="text-sm">Cargando artículos de WordPress...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con stats */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
            <AlertTriangle className="w-3 h-3" />
            {criticalCount} críticos
          </span>
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-medium">
            <Clock className="w-3 h-3" />
            {improvableCount} mejorables
          </span>
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            {goodCount} buenos
          </span>
        </div>
      </div>

      {/* Barra de búsqueda + ordenamiento */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 transition-colors focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
          <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
          <input
            type="text"
            className="bg-transparent border-none text-sm text-slate-900 placeholder-slate-500 w-full focus:outline-none p-0"
            placeholder="Filtrar artículos por título..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-slate-700 ml-2 text-xs"
            >✕</button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
        >
          <option value="score_asc">⬆ Score: menor primero</option>
          <option value="score_desc">⬇ Score: mayor primero</option>
          <option value="title">A-Z Título</option>
        </select>
      </div>

      {/* Grid de artículos */}
      {processedPosts.length === 0 ? (
        <div className="card p-10 text-center border-dashed border-2 bg-white/50 flex flex-col items-center text-slate-500">
          <FileText className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm">No se encontraron artículos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
          {processedPosts.map(({ post, score }) => {
            const isSelected = selectedPostId === post.id
            const wordCount = (post.content?.rendered || '')
              .replace(/<[^>]+>/g, '')
              .split(/\s+/)
              .filter(Boolean).length

            let internalLinks = 0
            const htmlContent = post.content?.rendered || ''
            try {
              const url = new URL(post.link || '')
              const hostname = url.hostname
              const regex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["']/gi
              let match
              while ((match = regex.exec(htmlContent)) !== null) {
                const href = match[1]
                if (href.startsWith('/') || href.includes(hostname) || href.startsWith('#')) {
                  internalLinks++
                }
              }
            } catch(e) {}


            return (
              <button
                key={post.id}
                onClick={() => onSelect(post)}
                className={`group w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-3 ${
                  isSelected
                    ? 'border-purple-500/60 bg-purple-500/10 shadow-lg shadow-purple-900/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {/* Fila superior: título + badge score */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug"
                      dangerouslySetInnerHTML={{ __html: post.title?.rendered || 'Sin título' }}
                    />
                  </div>
                  <ScoreBadge score={score} />
                </div>

                {/* Barra de score */}
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      score >= 75 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                      score >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                      'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                {/* Meta info */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      post.status === 'publish' ? 'bg-emerald-500' : 'bg-yellow-500'
                    }`} />
                    <span className="capitalize">{post.status === 'publish' ? 'Publicado' : post.status}</span>
                    <span>·</span>
                    <span>{wordCount.toLocaleString()} palabras</span>
                    <span>·</span>
                    <span className="flex items-center gap-1" title="Enlaces internos">
                      <LinkIcon className="w-3 h-3 text-slate-600" />
                      {internalLinks}
                    </span>
                  </div>
                  <ArrowUpRight className={`w-3.5 h-3.5 transition-opacity ${isSelected ? 'opacity-100 text-purple-400' : 'opacity-0 group-hover:opacity-60'}`} />
                </div>
              </button>
            )
          })}
        </div>
      )}

      <p className="text-xs text-slate-600 text-center">
        {processedPosts.length} de {posts.length} artículos · Selecciona uno para editar y mejorar su SEO
      </p>
    </div>
  )
}
