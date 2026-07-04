export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getLocalHistory, upsertLocalHistory } from '@/lib/local-history'
import { ContentItem } from '@/types/content'

// Cache de disponibilidad de Firestore (evita re-intentar en cada request si sabemos que falla)
let firestoreAvailable: boolean | null = null
let firestoreLastCheck = 0
const FIRESTORE_RECHECK_MS = 60_000 // Reintentar cada 1 minuto

async function getFirestoreItems(): Promise<ContentItem[] | null> {
  const now = Date.now()
  if (firestoreAvailable === false && now - firestoreLastCheck < FIRESTORE_RECHECK_MS) {
    return null // Sabemos que falla, no intentar
  }

  try {
    const { db } = await import('@/lib/firebase')
    const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore')

    const q = query(collection(db, 'history'), orderBy('createdAt', 'desc'), limit(100))
    const snapshot = await getDocs(q)

    firestoreAvailable = true
    firestoreLastCheck = now
    return snapshot.docs.map(d => ({
      ...d.data(),
      id: d.id,
      type: d.data().type || 'creation',
      status: d.data().status || 'generated'
    })) as ContentItem[]
  } catch (e: any) {
    firestoreAvailable = false
    firestoreLastCheck = now
    return null
  }
}

async function writeFirestoreItem(data: Partial<ContentItem>): Promise<boolean> {
  if (firestoreAvailable === false) return false
  try {
    const { db } = await import('@/lib/firebase')
    const { doc, setDoc } = await import('firebase/firestore')
    await setDoc(
      doc(db, 'history', data.id!),
      { ...data, updatedAt: new Date().toISOString() },
      { merge: true }
    )
    firestoreAvailable = true
    return true
  } catch {
    firestoreAvailable = false
    return false
  }
}

export async function GET(req: NextRequest) {
  try {
    // Local siempre disponible
    const localItems = getLocalHistory()

    // Intentar Firestore con timeout de 2s
    const firestoreItems = await Promise.race<ContentItem[] | null>([
      getFirestoreItems(),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 2000))
    ])

    if (firestoreItems !== null) {
      // Unificar: Firestore como fuente principal + items locales que no están en Firestore
      const firestoreIds = new Set(firestoreItems.map(i => i.id))
      const localOnly = localItems.filter(i => !firestoreIds.has(i.id))

      // Migrar items locales a Firestore en background
      if (localOnly.length > 0) {
        Promise.allSettled(localOnly.map(item => writeFirestoreItem(item))).catch(() => {})
      }

      const merged = [...firestoreItems, ...localOnly].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 100)

      return NextResponse.json({ success: true, data: merged, source: 'firestore' })
    }

    // Fallback: solo datos locales
    return NextResponse.json({ success: true, data: localItems, source: 'local' })
  } catch (error) {
    const localItems = getLocalHistory()
    return NextResponse.json({ success: true, data: localItems, source: 'local-error-recovery' })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json() as Partial<ContentItem>

    if (!data.id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
    }

    // 1. Guardar en local SIEMPRE (garantizado, síncrono)
    const saved = upsertLocalHistory(data)

    // 2. Intentar Firestore en background (no bloquear la respuesta)
    writeFirestoreItem(data).catch(() => {})

    return NextResponse.json({ success: true, id: data.id, saved })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
