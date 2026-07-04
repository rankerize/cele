'use client'

/**
 * AppCacheContext
 * ───────────────────────────────────────────────────────────────────────────
 * Cache global de datos que persiste durante toda la sesión del dashboard.
 * 
 * Propósito: evitar re-fetching cuando el usuario navega entre módulos.
 * Los datos se cargan una sola vez y quedan en memoria hasta que el usuario
 * cierra la pestaña o hace logout.
 * 
 * Uso en cualquier componente:
 *   const { posts, setPosts, postsLoaded, setPostsLoaded } = useAppCache()
 */

import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react'
import { WPPost } from '@/types/wordpress'
import { WCProduct } from '@/types/woocommerce'

// ── Tipos del cache ─────────────────────────────────────────────────────────

interface DashboardStats {
  totalPosts: number
  totalImpressions: number
  totalClicks: number
  avgPosition: number
}

interface AppCacheState {
  // WordPress Posts
  posts: WPPost[]
  postsLoaded: boolean
  postsTotal: number
  postsTotalPages: number

  // WooCommerce Products
  products: WCProduct[]
  productsLoaded: boolean
  productsTotal: number

  // Dashboard Stats
  dashboardStats: DashboardStats | null
  dashboardStatsLoaded: boolean

  // AI Provider
  aiProvider: string
  aiProviderLoaded: boolean

  // Credits (Simulated global balance)
  credits: number
  totalCredits: number

  // Timestamp del último fetch (para saber si refrescar)
  lastFetch: Record<string, number>
}

interface AppCacheActions {
  setPosts: (posts: WPPost[], total?: number, totalPages?: number) => void
  setPostsLoaded: (loaded: boolean) => void
  setProducts: (products: WCProduct[], total?: number) => void
  setProductsLoaded: (loaded: boolean) => void
  setDashboardStats: (stats: DashboardStats) => void
  setAiProvider: (provider: string) => void
  deductCredits: (amount: number) => void
  invalidate: (key: keyof AppCacheState['lastFetch']) => void
  invalidateAll: () => void
  isStale: (key: string, maxAgeMs?: number) => boolean
}

type AppCache = AppCacheState & AppCacheActions

// ── Contexto ─────────────────────────────────────────────────────────────────

const AppCacheContext = createContext<AppCache | null>(null)

const INITIAL_STATE: AppCacheState = {
  posts: [],
  postsLoaded: false,
  postsTotal: 0,
  postsTotalPages: 1,
  products: [],
  productsLoaded: false,
  productsTotal: 0,
  dashboardStats: null,
  dashboardStatsLoaded: false,
  aiProvider: 'IA',
  aiProviderLoaded: false,
  credits: 1250,
  totalCredits: 5000,
  lastFetch: {},
}

// Máximo de antigüedad por defecto: 5 minutos
const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000

export function AppCacheProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppCacheState>(INITIAL_STATE)

  const setPosts = useCallback((posts: WPPost[], total = 0, totalPages = 1) => {
    setState(prev => ({
      ...prev,
      posts,
      postsLoaded: true,
      postsTotal: total,
      postsTotalPages: totalPages,
      lastFetch: { ...prev.lastFetch, posts: Date.now() },
    }))
  }, [])

  const setPostsLoaded = useCallback((loaded: boolean) => {
    setState(prev => ({ ...prev, postsLoaded: loaded }))
  }, [])

  const setProducts = useCallback((products: WCProduct[], total = 0) => {
    setState(prev => ({
      ...prev,
      products,
      productsLoaded: true,
      productsTotal: total,
      lastFetch: { ...prev.lastFetch, products: Date.now() },
    }))
  }, [])

  const setProductsLoaded = useCallback((loaded: boolean) => {
    setState(prev => ({ ...prev, productsLoaded: loaded }))
  }, [])

  const setDashboardStats = useCallback((stats: DashboardStats) => {
    setState(prev => ({
      ...prev,
      dashboardStats: stats,
      dashboardStatsLoaded: true,
      lastFetch: { ...prev.lastFetch, dashboardStats: Date.now() },
    }))
  }, [])

  const setAiProvider = useCallback((provider: string) => {
    setState(prev => ({
      ...prev,
      aiProvider: provider,
      aiProviderLoaded: true,
      lastFetch: { ...prev.lastFetch, aiProvider: Date.now() },
    }))
  }, [])

  const deductCredits = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      credits: Math.max(0, prev.credits - amount)
    }))
  }, [])

  const invalidate = useCallback((key: string) => {
    setState(prev => ({
      ...prev,
      lastFetch: { ...prev.lastFetch, [key]: 0 },
      // Resetear los flags de loaded correspondientes
      ...(key === 'posts' ? { postsLoaded: false } : {}),
      ...(key === 'products' ? { productsLoaded: false } : {}),
      ...(key === 'dashboardStats' ? { dashboardStatsLoaded: false } : {}),
    }))
  }, [])

  const invalidateAll = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  const isStale = useCallback((key: string, maxAgeMs = DEFAULT_MAX_AGE_MS): boolean => {
    const lastTime = state.lastFetch[key]
    if (!lastTime) return true
    return Date.now() - lastTime > maxAgeMs
  }, [state.lastFetch])

  return (
    <AppCacheContext.Provider value={{
      ...state,
      setPosts,
      setPostsLoaded,
      setProducts,
      setProductsLoaded,
      setDashboardStats,
      setAiProvider,
      deductCredits,
      invalidate,
      invalidateAll,
      isStale,
    }}>
      {children}
    </AppCacheContext.Provider>
  )
}

export function useAppCache(): AppCache {
  const ctx = useContext(AppCacheContext)
  if (!ctx) throw new Error('useAppCache must be used inside AppCacheProvider')
  return ctx
}
