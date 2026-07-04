'use client'

import Link from 'next/link'
import { usePathname, useRouter, useParams } from 'next/navigation'
import {
  LayoutDashboard,
  PenSquare,
  History,
  Settings,
  LogOut,
  ChevronRight,
  Network,
  RefreshCw,
  LineChart,
  Brain,
  Sparkles,
  Layers,
  Link2,
  Target,
  Radar,
  ShieldCheck,
  ShoppingBag,
  Search,
  Megaphone,
  Users,
  Image as ImageIcon,
  CreditCard,
} from 'lucide-react'

const ADMIN_EMAIL = 'cesar.jimenez@rankerize.com'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'
import { gsap, useGSAP } from '@/lib/animations'
import { Zap, Coins, Info } from 'lucide-react'
import { useAppCache } from '@/lib/AppCacheContext'


// Add Lock icon for onboarding
import { Lock } from 'lucide-react'

interface Alert { type: string; count: number }

const analyzeItems = [
  { href: '/seo', label: 'SEO Estratégico', icon: LineChart, alertType: 'cannibalization' },
  { href: '/editorial', label: 'Mapa Editorial', icon: Network, alertType: 'orphaned' },
  { href: '/interlinking', label: 'Enlazado Interno', icon: Link2 },
]

const produceItems = [
  { href: '/keywords', label: 'Keyword Research', icon: Search },
  { href: '/create', label: 'Crear Contenido', icon: PenSquare },
  { href: '/batch', label: 'Lote de Artículos', icon: Layers },
  { href: '/improve', label: 'Mejorar Contenido', icon: RefreshCw, alertType: 'striking_distance' },
  { href: '/tendencias', label: 'Tendencias 🔥', icon: Radar },
]

const trackItems = [
  { href: '/history', label: 'Historial general', icon: History },
  { href: '/billing', label: 'Suscripción y Pagos', icon: CreditCard },
  { href: '/settings', label: 'Integraciones', icon: Settings },
]

// ADs Module Items - REMOVED as Flow is now SEO only

function NavGroup({ label, items, pathname, alerts, isLocked, projectId }: {
  label: string
  items: { href: string; label: string; icon: React.ElementType; alertType?: string }[]
  pathname: string
  alerts: Alert[]
  isLocked?: boolean
  projectId: string
}) {
  return (
    <div className={cn("mb-1", isLocked && "opacity-40 pointer-events-none")}>
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-3 mt-4 mb-1.5 flex items-center justify-between">
        {label}
        {isLocked && <Lock className="w-3 h-3 text-slate-500 opacity-60" />}
      </p>
      {items.map(({ href, label, icon: Icon, alertType }) => {
        const fullHref = `/dashboard/${projectId}${href}`
        const isActive = pathname === fullHref || (href !== '/' && pathname.startsWith(fullHref))
        const alertCount = alertType ? alerts.find(a => a.type === alertType)?.count ?? 0 : 0
        return (
          <Link
            key={href}
            href={fullHref}
            className={cn(isActive ? 'nav-item-active' : 'nav-item', 'sidebar-nav-item relative')}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {alertCount > 0 && !isActive && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black shadow-lg shadow-red-500/30 shrink-0">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
            {isActive && <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />}
          </Link>
        )
      })}
    </div>
  )
}


export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string
  const [loggingOut, setLoggingOut] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [actionCenterCount, setActionCenterCount] = useState(0)
  const [hasEcommerce, setHasEcommerce] = useState(false)
  
  // Focus Mode de UX (Bloqueo si no hay setup completo)
  const [isSetupComplete, setIsSetupComplete] = useState(true)
  const sidebarRef = useRef<HTMLElement>(null)
  const { credits, totalCredits, aiProvider } = useAppCache()
  const creditsPercentage = Math.round((credits / totalCredits) * 100)

  // ── GSAP: Sidebar slide-in + nav stagger on mount ────────────────────────
  useGSAP(
    () => {
      // Sidebar slides in from left
      gsap.from(sidebarRef.current, {
        x: -30,
        opacity: 0,
        duration: 0.55,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      })
      // Nav items stagger up
      gsap.from('.sidebar-nav-item', {
        opacity: 0,
        x: -12,
        duration: 0.35,
        ease: 'power2.out',
        stagger: 0.045,
        delay: 0.2,
        clearProps: 'transform,opacity',
      })
      // Logo scale
      gsap.from('.sidebar-logo', {
        opacity: 0,
        scale: 0.88,
        duration: 0.4,
        ease: 'back.out(1.6)',
        clearProps: 'transform,opacity',
      })
    },
    { scope: sidebarRef }
  )

  useEffect(() => {
    // Load workspace preference - REMOVED

    async function loadData() {
      // Load user
      try {
        const userRes = await fetch('/api/auth/me')
        if (userRes.ok) {
          const data = await userRes.json()
          if (data.isLoggedIn) setUser(data.user)
        }
      } catch {}

      // AI provider is configured server-side (OPENAI_API_KEY env var)
      // No need to fetch — always active

      // Load dashboard status for alerts & setup completion
      try {
        const statusRes = await fetch('/api/dashboard/status')
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          if (statusData.success && statusData.data?.integrations) {
            const ints = statusData.data.integrations
            setIsSetupComplete(ints.wordpress && ints.gsc && ints.ai)
          }

          if (statusData.success && statusData.data?.alerts) {
            setAlerts(statusData.data.alerts)
          }
          if (statusData.success && statusData.data?.integrations?.hasEcommerce) {
            setHasEcommerce(true)
          }
        }
      } catch {}

      // Load Action Center pending count
      try {
        const acRes = await fetch('/api/action-center?status=pending')
        if (acRes.ok) {
          const acData = await acRes.json()
          if (acData.success) setActionCenterCount(acData.total ?? 0)
        }
      } catch {}
    }
    loadData()
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const totalAlerts = alerts.reduce((s, a) => s + a.count, 0)

  const hasAdsAccess = false // REMOVED

  return (
    <aside ref={sidebarRef} className="fixed inset-y-0 left-0 w-60 bg-white border-r border-slate-200 flex flex-col z-30">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-200">
        <Link href="/dashboard" className="sidebar-logo flex items-center group relative">
          <img
            src="/logo-flow-black.png"
            alt="Rankerize Flow"
            width={150}
            height={40}
            style={{ width: '150px', height: 'auto', objectFit: 'contain' }}
            className="transition-opacity duration-200 group-hover:opacity-80"
          />
          {totalAlerts > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center shadow shadow-red-500/50">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </Link>
      </div>

      {/* Workspace Switcher eliminado por ahora */}

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto hidden-scrollbar">
        {/* Dashboard home */}
        <Link
          href={`/dashboard/${projectId}`}
          className={cn(pathname === `/dashboard/${projectId}` ? 'nav-item-active' : 'nav-item', 'sidebar-nav-item')}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span className="flex-1">Dashboard</span>
          {pathname === `/dashboard/${projectId}` && <ChevronRight className="w-3 h-3 opacity-50" />}
        </Link>

        {/* Action Center — destacado */}
        <Link
          href={`/dashboard/${projectId}/action-center`}
          className={cn(
            pathname.startsWith(`/dashboard/${projectId}/action-center`) ? 'nav-item-active' : 'nav-item',
            'sidebar-nav-item relative mt-2 mb-1'
          )}
        >
          <Target className="w-4 h-4 shrink-0" />
          <span className="flex-1">Action Center</span>
          {actionCenterCount > 0 && !pathname.startsWith(`/dashboard/${projectId}/action-center`) && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white text-[9px] font-black shadow-lg shadow-brand-500/30 shrink-0">
              {actionCenterCount > 9 ? '9+' : actionCenterCount}
            </span>
          )}
          {pathname.startsWith(`/dashboard/${projectId}/action-center`) && <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />}
        </Link>

        <NavGroup label="Analizar" items={analyzeItems} pathname={pathname} alerts={alerts} projectId={projectId} />
        {hasEcommerce && (
          <Link
            href={`/dashboard/${projectId}/ecommerce`}
            className={cn(pathname.startsWith(`/dashboard/${projectId}/ecommerce`) ? 'nav-item-active' : 'nav-item', 'sidebar-nav-item')}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="flex-1">Tienda Online</span>
            {pathname.startsWith(`/dashboard/${projectId}/ecommerce`) && <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />}
          </Link>
        )}
        <NavGroup label="Producir" items={produceItems} pathname={pathname} alerts={alerts} projectId={projectId} />

        <NavGroup label="Recursos & Logs" items={trackItems} pathname={pathname} alerts={alerts} projectId={projectId} />

        {/* Admin Panel — solo visible para rankerize@gmail.com */}
        {user?.email === ADMIN_EMAIL && (
          <div className="mb-1">
            <p className="text-[9px] font-black text-purple-700 uppercase tracking-[0.2em] px-3 mt-4 mb-1.5">
              Administración
            </p>
            <Link
              href="/dashboard/admin"
              className={cn(
                pathname.startsWith('/dashboard/admin') ? 'nav-item-active' : 'nav-item',
                'sidebar-nav-item'
              )}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-purple-400" />
              <span className="flex-1 text-purple-300">Admin Panel</span>
              {pathname.startsWith('/dashboard/admin') && <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />}
            </Link>
          </div>
        )}
      </nav>

      {/* Footer del Sidebar: Super Compacto (Créditos, IA, Perfil, Logout) */}
      <div className="border-t border-slate-200 bg-white mt-auto">
        
        {/* Fila 1: Créditos e IA */}
        <div className="px-3 py-2 flex items-center gap-2 border-b border-slate-100">
          {/* Módulo de Créditos Píldora */}
          <div className="flex-1 flex flex-col gap-1 px-2 py-1.5 bg-slate-50 rounded-md border border-slate-200 relative overflow-hidden group">
             <div className="flex items-center justify-between z-10 relative">
               <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                 <Coins className="w-3 h-3" />
                 <span>Créditos</span>
               </div>
               <span className="text-[9px] text-slate-700 font-medium">{credits.toLocaleString()}</span>
             </div>
             {/* Progress */}
             <div className="absolute bottom-0 left-0 h-[2px] bg-amber-500/50 transition-all duration-500" style={{ width: `${creditsPercentage}%` }} />
             
             {/* Hover info tooltip inline */}
             <div className="absolute inset-0 bg-white border border-slate-200 hidden group-hover:flex items-center justify-center text-[8.5px] text-slate-700 z-20 rounded-md text-center p-0.5">
                Art/10 • Mej/7 • Inf/5 • Link/1
             </div>
          </div>
          
          {/* Módulo de IA Status Píldora */}
          {aiProvider ? (
            <div className={`flex flex-col items-center justify-center shrink-0 px-2 py-1.5 rounded-md border  ${
              aiProvider === 'openai'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-brand-500/10 border-brand-500/20 text-brand-400'
            }`} title={`IA Activa: ${aiProvider.toUpperCase()}`}>
              {aiProvider === 'openai' ? <Brain className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
          ) : (
            <div className="flex items-center justify-center shrink-0 px-2 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-500">
              <span className="text-[10px]">...</span>
            </div>
          )}
        </div>

        {/* Fila 2: Perfil y Logout */}
        <div className="px-3 py-2 flex items-center gap-2">
          {user ? (
            <Link href="/dashboard/profile" className="flex items-center gap-2 flex-1 min-w-0 group cursor-pointer">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}`}
                alt="Avatar"
                className="w-7 h-7 rounded-md shrink-0 object-cover group-hover:ring-1 ring-brand-500/50 transition-all"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">{user.displayName}</p>
                <p className="text-[9px] text-slate-500 truncate">{user.email}</p>
              </div>
            </Link>
          ) : (
            <div className="flex-1 text-[10px] text-slate-500 italic">Sesión...</div>
          )}
          
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Cerrar sesión"
            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
