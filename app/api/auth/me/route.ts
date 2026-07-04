export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'

export async function GET() {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  let activeModules = ['seo'] // Default para usuarios existentes que no tengan el field
  let adsBriefCompleted = false

  if (session.isLoggedIn && session.user?.uid) {
    try {
      const { getAdminFirestore } = await import('@/lib/firebase-admin')
      const db = getAdminFirestore()
      const userSnap = await db.collection('users').doc(session.user.uid).get()
      if (userSnap.exists) {
        const data = userSnap.data()
        if (data?.activeModules && Array.isArray(data.activeModules)) {
          activeModules = data.activeModules
        }
        if (data?.adsBrief) {
          adsBriefCompleted = true
        }
      }
    } catch (e) {
      console.warn('[Auth/Me] Failed to fetch activeModules:', e)
    }
  }

  return NextResponse.json({ 
    isLoggedIn: session.isLoggedIn,
    user: session.user ? { ...session.user, activeModules, adsBriefCompleted } : null
  })
}
