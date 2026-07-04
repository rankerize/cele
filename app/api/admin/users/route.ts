export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'

const ADMIN_EMAIL = 'cesar.jimenez@rankerize.com'

function isAdminRequest(session: SessionData): boolean {
  return (
    session.isLoggedIn &&
    !!session.user &&
    session.user.email === ADMIN_EMAIL
  )
}

export interface AdminUser {
  uid: string
  email: string
  displayName: string
  role: string
  createdAt: string
  lastLoginAt?: string
  credits?: number
  wordsGenerated?: number
  wpConnected?: boolean
}

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)

  if (!isAdminRequest(session)) {
    return NextResponse.json({ error: 'Acceso denegado. Solo el administrador maestro puede ver esto.' }, { status: 403 })
  }

  try {
    const { getAdminFirestore } = await import('@/lib/firebase-admin')
    const db = getAdminFirestore()

    // Listar todos los documentos en la colección users
    const usersSnap = await db.collection('users').get()
    const users: AdminUser[] = []

    for (const doc of usersSnap.docs) {
      const data = doc.data()

      // Intentar leer créditos de la sub-colección credits/balance
      let credits = data.credits ?? null
      let wordsGenerated = data.wordsGenerated ?? 0
      let wpConnected = false

      try {
        const creditsDoc = await db
          .collection('users').doc(doc.id)
          .collection('credits').doc('balance')
          .get()
        if (creditsDoc.exists) {
          credits = creditsDoc.data()?.balance ?? credits
          wordsGenerated = creditsDoc.data()?.wordsGenerated ?? wordsGenerated
        }

        const wpDoc = await db
          .collection('users').doc(doc.id)
          .collection('settings').doc('wordpress')
          .get()
        wpConnected = wpDoc.exists && !!wpDoc.data()?.apiUrl
      } catch {
        // Sub-colecciones pueden no existir
      }

      users.push({
        uid: doc.id,
        email: data.email || '—',
        displayName: data.displayName || data.email?.split('@')[0] || '—',
        role: data.role || 'user',
        createdAt: data.createdAt || data.adminSince || doc.createTime?.toDate().toISOString() || '—',
        lastLoginAt: data.lastLoginAt || '—',
        credits: credits ?? 0,
        wordsGenerated,
        wpConnected,
      })
    }

    // Ordenar: admins primero, luego por fecha de creación desc
    users.sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1
      if (b.role === 'admin' && a.role !== 'admin') return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({ success: true, users, total: users.length })
  } catch (err) {
    console.error('[Admin API] Error listando usuarios:', err)
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al obtener usuarios: ${msg}` }, { status: 500 })
  }
}
