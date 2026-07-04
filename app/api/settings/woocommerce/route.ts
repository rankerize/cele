export const dynamic = 'force-dynamic'

/**
 * GET  /api/settings/woocommerce  → lee credenciales del usuario desde Firestore (Admin SDK)
 * POST /api/settings/woocommerce  → guarda apiUrl, consumerKey, consumerSecret
 */
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
    let snap;

    if (projectId) {
      // Intentar obtener del proyecto
      snap = await db.collection('projects').doc(projectId).get()
      if (snap.exists) {
        const data = snap.data()
        return NextResponse.json({ 
          success: true, 
          data: {
            apiUrl: data?.wcApiUrl,
            consumerKey: data?.wcConsumerKey,
            consumerSecret: data?.wcConsumerSecret
          } 
        })
      }
    }

    // Fallback o legacy: obtener del usuario
    snap = await db
      .collection('users').doc(session.user.uid)
      .collection('settings').doc('woocommerce')
      .get()

    if (snap.exists) {
      return NextResponse.json({ success: true, data: snap.data() })
    }
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Error getting WC settings:', error)
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { apiUrl, consumerKey, consumerSecret, projectId } = body

    if (!apiUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const db = getAdminFirestore()
    const updateData = { 
      wcApiUrl: apiUrl, 
      wcConsumerKey: consumerKey, 
      wcConsumerSecret: consumerSecret, 
      wcUpdatedAt: new Date().toISOString() 
    }

    if (projectId) {
      // Guardar en el proyecto
      await db.collection('projects').doc(projectId).set(updateData, { merge: true })
    } else {
      // Legacy: Guardar en el usuario
      await db
        .collection('users').doc(session.user.uid)
        .collection('settings').doc('woocommerce')
        .set({ apiUrl, consumerKey, consumerSecret, updatedAt: new Date().toISOString() }, { merge: true })
    }

    return NextResponse.json({ success: true, message: 'Configuración guardada correctamente' })
  } catch (error) {
    console.error('Error saving WC settings:', error)
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 })
  }
}
