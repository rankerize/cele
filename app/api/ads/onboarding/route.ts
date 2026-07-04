import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getAdminFirestore } from '@/lib/firebase-admin'

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

    if (!session.isLoggedIn || !session.user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const db = getAdminFirestore()
    
    await db.collection('users').doc(session.user.uid).set({
      adsBrief: {
        businessName: data.businessName || '',
        websiteUrl: data.websiteUrl || '',
        mainProduct: data.mainProduct || '',
        targetAudience: data.targetAudience || '',
        mainObjection: data.mainObjection || '',
        updatedAt: new Date().toISOString()
      }
    }, { merge: true })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error saving ads brief:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
