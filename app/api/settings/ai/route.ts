export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/auth'
import { cookies } from 'next/headers'
import { getAdminFirestore } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  try {
    const db = getAdminFirestore()

    if (projectId) {
      const projectSnap = await db.collection('projects').doc(projectId).get()
      if (projectSnap.exists) {
        const data = projectSnap.data()
        return NextResponse.json({ 
          success: true, 
          data: {
            provider: data?.aiProvider || 'gemini',
            apiKey: data?.aiApiKey || '',
            model: data?.aiModel || ''
          } 
        })
      }
    }

    const snap = await db
      .collection('users').doc(session.user.uid)
      .collection('settings').doc('ai')
      .get()

    if (snap.exists) {
      return NextResponse.json({ success: true, data: snap.data() })
    }
    return NextResponse.json({ success: true, data: { provider: 'gemini', apiKey: '', model: '' } })
  } catch (error) {
    console.error('Error getting AI settings:', error)
    return NextResponse.json({ error: 'Error al obtener configuración de IA' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { provider, apiKey, model, projectId } = body

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const db = getAdminFirestore()

    if (projectId) {
      await db.collection('projects').doc(projectId).update({
        aiProvider: provider,
        aiApiKey: apiKey,
        aiModel: model || '',
        updatedAt: new Date().toISOString()
      })
    } else {
      await db
        .collection('users').doc(session.user.uid)
        .collection('settings').doc('ai')
        .set({ provider, apiKey, model: model || '', updatedAt: new Date().toISOString() }, { merge: true })
    }

    return NextResponse.json({ success: true, message: 'Configuración de IA guardada correctamente' })
  } catch (error) {
    console.error('Error saving AI settings:', error)
    return NextResponse.json({ error: 'Error al guardar configuración de IA' }, { status: 500 })
  }
}
