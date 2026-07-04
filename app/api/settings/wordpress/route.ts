export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/auth'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'

// Fallback en dev: guarda en un archivo local cuando Firestore no está disponible
const LOCAL_SETTINGS_FILE = path.join(process.cwd(), '.local-settings.json')

function readLocalSettings(uid: string): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(LOCAL_SETTINGS_FILE)) return null
    const data = JSON.parse(fs.readFileSync(LOCAL_SETTINGS_FILE, 'utf-8'))
    return data?.[uid]?.wordpress ?? null
  } catch { return null }
}

function writeLocalSettings(uid: string, settings: Record<string, unknown>) {
  let data: Record<string, unknown> = {}
  try { if (fs.existsSync(LOCAL_SETTINGS_FILE)) data = JSON.parse(fs.readFileSync(LOCAL_SETTINGS_FILE, 'utf-8')) } catch {}
  if (!data[uid]) data[uid] = {}
  ;(data[uid] as Record<string, unknown>).wordpress = settings
  fs.writeFileSync(LOCAL_SETTINGS_FILE, JSON.stringify(data, null, 2))
}

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const uid = session.user.uid
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  try {
    const { getAdminFirestore } = await import('@/lib/firebase-admin')
    const db = getAdminFirestore()

    if (projectId) {
      const projectSnap = await db.collection('projects').doc(projectId).get()
      if (projectSnap.exists) {
        const data = projectSnap.data()
        // Map project fields to WPConfig format for the UI
        return NextResponse.json({ 
          success: true, 
          data: {
            apiUrl: data?.wpUrl || '',
            username: data?.wpUsername || '',
            appPassword: data?.wpAppPassword || '',
            hasWooCommerce: data?.hasWooCommerce || false,
            savedSites: data?.wpSavedSites || []
          } 
        })
      }
    }

    // Fallback to legacy user-level settings
    const snap = await db.collection('users').doc(uid).collection('settings').doc('wordpress').get()
    if (snap.exists) return NextResponse.json({ success: true, data: snap.data() })
    return NextResponse.json({ success: true, data: null })
  } catch (firestoreError) {
    // Fallback a almacenamiento local (solo en dev)
    console.warn('[WP Settings] Firestore no disponible, usando almacenamiento local:', (firestoreError as Error).message?.slice(0, 80))
    const localData = readLocalSettings(uid)
    return NextResponse.json({ success: true, data: localData, _source: 'local' })
  }
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const uid = session.user.uid
  const body = await req.json()
  const { apiUrl, username, appPassword, savedSites, hasWooCommerce, clearAll, projectId } = body

  const { getAdminFirestore } = await import('@/lib/firebase-admin')
  const db = getAdminFirestore()

  if (clearAll) {
    try {
      if (projectId) {
        await db.collection('projects').doc(projectId).update({
          wpUrl: null,
          wpUsername: null,
          wpAppPassword: null,
          wpSavedSites: null,
          hasWooCommerce: null
        })
      } else {
        await db.collection('users').doc(uid).collection('settings').doc('wordpress').delete()
      }
      return NextResponse.json({ success: true, message: 'Configuración eliminada.' })
    } catch(e) {
      return NextResponse.json({ error: 'Error al limpiar configuración' }, { status: 500 })
    }
  }

  if (!apiUrl || !username || !appPassword) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const settings: Record<string, any> = { 
    apiUrl, 
    username, 
    appPassword, 
    updatedAt: new Date().toISOString() 
  }

  if (typeof hasWooCommerce === 'boolean') {
    settings.hasWooCommerce = hasWooCommerce
  }

  if (Array.isArray(savedSites)) {
    settings.savedSites = savedSites
  }

  try {
    if (projectId) {
      // Save to project document
      await db.collection('projects').doc(projectId).update({
        wpUrl: apiUrl,
        wpUsername: username,
        wpAppPassword: appPassword,
        wpSavedSites: savedSites || [],
        hasWooCommerce: hasWooCommerce || false,
        updatedAt: new Date().toISOString()
      })
    } else {
      // Legacy: Save to user document
      await db.collection('users').doc(uid).collection('settings').doc('wordpress')
        .set(settings, { merge: true })
    }
    return NextResponse.json({ success: true, message: 'Configuración guardada en la nube.' })
  } catch (firestoreError) {
    // Fallback a archivo local en dev
    console.warn('[WP Settings] Firestore no disponible, guardando localmente:', (firestoreError as Error).message?.slice(0, 80))
    try {
      writeLocalSettings(uid, settings)
      return NextResponse.json({ success: true, message: 'Configuración guardada localmente (modo dev).' })
    } catch (localError) {
      console.error('Error guardando localmente:', localError)
      return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 })
    }
  }
}

