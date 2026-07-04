import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { Lock } from 'lucide-react'

export default async function AdsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn || !session.user?.uid) {
    return <div>Sesión requerida</div>
  }

  let hasAdsAccess = false
  let hasAdsBrief = false
  try {
    const db = getAdminFirestore()
    const userSnap = await db.collection('users').doc(session.user.uid).get()
    if (userSnap.exists) {
      const data = userSnap.data()
      if (data?.activeModules && Array.isArray(data.activeModules) && data.activeModules.includes('ads')) {
        hasAdsAccess = true
      }
      if (data?.adsBrief) {
        hasAdsBrief = true
      }
    }
  } catch (e) {
    console.error('Error checking ads access:', e)
  }

  if (!hasAdsAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-700 overflow-hidden relative">
        <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-3xl pointer-events-none" />
        
        <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mb-8 shadow-2xl relative z-10">
          <Lock className="w-8 h-8 text-emerald-500" />
        </div>
        
        <h2 className="font-display text-3xl font-black text-white mb-4 relative z-10">
          Módulo ADS Exclusivo
        </h2>
        
        <p className="text-sm text-slate-600 max-w-md mb-8 leading-relaxed relative z-10">
          Estás intentando acceder a una zona protegida. Este módulo contiene herramientas avanzadas de Inteligencia Artificial conectadas a Meta Ads.
        </p>
        
        <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 relative z-10">
          Actualizar Plan (Próximamente)
        </button>
      </div>
    )
  }

  if (!hasAdsBrief) {
    // Renderea el Gatekeeper (La pantalla de entrevista/onboarding que construyamos)
    const AdsOnboardingWizard = (await import('@/components/ads/AdsOnboardingWizard')).default
    return (
      <div className="ads-module-wrapper">
        <AdsOnboardingWizard />
      </div>
    )
  }

  return (
    <div className="ads-module-wrapper">
      {children}
    </div>
  )
}
