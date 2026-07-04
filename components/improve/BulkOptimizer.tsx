'use client'

import { useState, useCallback, useRef } from 'react'
import { WPPost } from '@/types/wordpress'
import { useAppCache } from '@/lib/AppCacheContext'
import {
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  SkipForward,
} from 'lucide-react'

interface BulkPostResult {
  postId: number
  postTitle: string
  status: 'pending' | 'processing' | 'done' | 'error' | 'skipped'
  scoreSEO?: number
  error?: string
}

interface Props {
  posts: WPPost[]
}

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

const SCORE_BAR_COLOR = (score: number) => {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function BulkOptimizer({ posts }: Props) {
  const [results, setResults] = useState<BulkPostResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [isStopped, setIsStopped] = useState(false)
  const cache = useAppCache()
  // useRef para señal de parada — mutable y síncrono, no depende de batching de React
  const stopRef = useRef(false)

  const initializeResults = useCallback(() => {
    return posts.map((p) => ({
      postId: p.id,
      postTitle: p.title?.rendered || 'Sin título',
      status: 'pending' as const,
    }))
  }, [posts])

  const handleStart = async () => {
    const initial = initializeResults()
    setResults(initial)
    setIsRunning(true)
    setIsStopped(false)
    stopRef.current = false   // ← reset the stop signal
    setCurrentIndex(0)

    for (let i = 0; i < posts.length; i++) {
      // Check stop signal synchronously — no React batching involved
      if (stopRef.current) break

      const post = posts[i]
      setCurrentIndex(i)

      // Mark as processing
      setResults((prev) =>
        prev.map((r) =>
          r.postId === post.id ? { ...r, status: 'processing' } : r
        )
      )

      if (cache.credits < 7) {
        setResults((prev) =>
          prev.map((r) =>
            r.postId === post.id
              ? { ...r, status: 'error', error: 'Créditos insuficientes (7 necesarios).' }
              : r
          )
        )
        // Optionally break or let user recharge
        break;
      }
      
      cache.deductCredits(7)

      try {
        const keyword = post.meta?.['_keyword_principal'] || ''
        const res = await fetch('/api/wordpress/posts/bulk-improve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id, keyword }),
        })

        const json = await res.json()

        if (json.success) {
          setResults((prev) =>
            prev.map((r) =>
              r.postId === post.id
                ? {
                    ...r,
                    status: 'done',
                    scoreSEO: json.scoreSEO,
                    postTitle: json.postTitle || r.postTitle,
                  }
                : r
            )
          )
        } else {
          setResults((prev) =>
            prev.map((r) =>
              r.postId === post.id
                ? { ...r, status: 'error', error: json.error || 'Error desconocido' }
                : r
            )
          )
        }
      } catch (err) {
        setResults((prev) =>
          prev.map((r) =>
            r.postId === post.id
              ? {
                  ...r,
                  status: 'error',
                  error: err instanceof Error ? err.message : 'Error de red',
                }
              : r
          )
        )
      }

      // Small delay to prevent rate limits
      if (!stopRef.current && i < posts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }
    }

    setIsRunning(false)
    setCurrentIndex(-1)
  }

  const handleStop = () => {
    stopRef.current = true   // ← immediate, synchronous — no React batching
    setIsStopped(true)       // ← only for UI update (button state)
  }

  const pending = results.filter((r) => r.status === 'pending').length
  const done = results.filter((r) => r.status === 'done').length
  const errors = results.filter((r) => r.status === 'error').length
  const avgScore =
    done > 0
      ? Math.round(
          results
            .filter((r) => r.status === 'done' && r.scoreSEO !== undefined)
            .reduce((acc, r) => acc + (r.scoreSEO || 0), 0) / done
        )
      : 0

  const progressPct =
    results.length > 0
      ? Math.round(((done + errors) / results.length) * 100)
      : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <Zap className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-white">Optimización Masiva</h2>
          <p className="text-sm text-slate-500">
            {posts.length} artículos seleccionados · La IA mejorará cada uno y actualizará WordPress automáticamente
          </p>
        </div>
      </div>

      {/* Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4 text-center bg-white border-slate-200">
            <p className="text-2xl font-bold text-white">{results.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total</p>
          </div>
          <div className="card p-4 text-center bg-white border-slate-200">
            <p className="text-2xl font-bold text-emerald-400">{done}</p>
            <p className="text-xs text-slate-500 mt-1">Optimizados</p>
          </div>
          <div className="card p-4 text-center bg-white border-slate-200">
            <p className="text-2xl font-bold text-red-400">{errors}</p>
            <p className="text-xs text-slate-500 mt-1">Errores</p>
          </div>
          <div className="card p-4 text-center bg-white border-slate-200">
            <p className={`text-2xl font-bold ${done > 0 ? SCORE_COLOR(avgScore) : 'text-slate-600'}`}>
              {done > 0 ? avgScore : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Score promedio</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {results.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Progreso</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 w-full bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={posts.length === 0}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {results.length > 0 ? 'Reiniciar optimización' : 'Iniciar optimización masiva (7 🪙 c/u)'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex-1 btn-secondary flex items-center justify-center gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <SkipForward className="w-4 h-4" />
            Detener proceso
          </button>
        )}
      </div>

      {/* Results list */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {results.map((result, idx) => (
            <div
              key={result.postId}
              className={`card p-3 border transition-all duration-300 ${
                result.status === 'processing'
                  ? 'border-brand-500/50 bg-brand-500/5 shadow-lg shadow-brand-500/10'
                  : result.status === 'done'
                  ? 'border-emerald-500/20 bg-white'
                  : result.status === 'error'
                  ? 'border-red-500/20 bg-white'
                  : 'border-slate-200 bg-white opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="shrink-0">
                  {result.status === 'processing' && (
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                  )}
                  {result.status === 'done' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {result.status === 'error' && (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  {(result.status === 'pending' || result.status === 'skipped') && (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                  )}
                </div>

                {/* Title & Score */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-slate-800 truncate"
                    dangerouslySetInnerHTML={{ __html: result.postTitle }}
                  />
                  {result.status === 'processing' && (
                    <p className="text-xs text-brand-400 mt-0.5 animate-pulse">
                      Analizando y reescribiendo...
                    </p>
                  )}
                  {result.status === 'error' && (
                    <p className="text-xs text-red-400 mt-0.5 truncate">{result.error}</p>
                  )}
                </div>

                {/* Score badge */}
                {result.status === 'done' && result.scoreSEO !== undefined && (
                  <div className="shrink-0 text-right">
                    <span className={`text-sm font-bold ${SCORE_COLOR(result.scoreSEO)}`}>
                      {result.scoreSEO}/100
                    </span>
                    <div className="w-16 h-1.5 bg-slate-50 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${SCORE_BAR_COLOR(result.scoreSEO)}`}
                        style={{ width: `${result.scoreSEO}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && (
        <div className="card p-10 text-center border-dashed border-2 bg-white/50 flex flex-col items-center justify-center text-slate-500">
          <Zap className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm max-w-xs">
            Selecciona el modo y haz clic en{' '}
            <strong className="text-slate-600">Iniciar optimización masiva</strong> para que la IA
            mejore todos los artículos automáticamente.
          </p>
        </div>
      )}
    </div>
  )
}
