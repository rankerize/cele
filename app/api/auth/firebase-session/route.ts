export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  try {
    const { uid, email, displayName, photoURL } = await request.json()

    if (!uid) {
      return NextResponse.json({ success: false, error: 'UID faltante' }, { status: 400 })
    }

    session.isLoggedIn = true
    session.loginAt = new Date().toISOString()
    session.user = { uid, email, displayName, photoURL }
    
    await session.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in firebase-session sync:', err)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
