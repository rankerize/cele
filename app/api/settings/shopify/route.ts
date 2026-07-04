/**
 * app/api/settings/shopify/route.ts
 * GET    → leer config guardada (sin exponer el token)
 * DELETE → eliminar config (desconectar tienda)
 *
 * NOTA: El POST manual ya no es necesario — la conexión se hace via OAuth.
 *       Lo dejamos como fallback opcional.
 */
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getAdminFirestore } from '@/lib/firebase-admin'

// ── GET: retorna config sin exponer el token ─────────────────────────────────
export async function GET(req: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  try {
    const db = getAdminFirestore()
    let snap;

    if (projectId) {
      snap = await db.collection('projects').doc(projectId).get()
      if (snap.exists) {
        const data = snap.data()!
        if (data.shopifyConnected) {
          return NextResponse.json({
            success: true,
            data: {
              shopDomain: data.shopifyDomain ?? '',
              shopDisplayDomain: data.shopifyDisplayDomain ?? data.shopifyDomain ?? '',
              connected: data.shopifyConnected ?? false,
              shopName: data.shopifyName ?? '',
              shopCurrency: data.shopifyCurrency ?? '',
              scopes: data.shopifyScopes ?? '',
              updatedAt: data.shopifyUpdatedAt ?? '',
            },
          })
        }
      }
    }

    // Fallback Legacy
    snap = await db
      .collection('users')
      .doc(session.user.uid)
      .collection('settings')
      .doc('shopify')
      .get()

    if (!snap.exists) {
      return NextResponse.json({ success: true, data: null })
    }

    const data = snap.data()!
    return NextResponse.json({
      success: true,
      data: {
        shopDomain: data.shopDomain ?? '',
        shopDisplayDomain: data.shopDisplayDomain ?? data.shopDomain ?? '',
        connected: data.connected ?? false,
        shopName: data.shopName ?? '',
        shopCurrency: data.shopCurrency ?? '',
        scopes: data.scopes ?? '',
        updatedAt: data.updatedAt ?? '',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[api/settings/shopify GET]', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ── DELETE: desconectar tienda ───────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  try {
    const db = getAdminFirestore()
    
    if (projectId) {
      await db.collection('projects').doc(projectId).update({
        shopifyAccessToken: null,
        shopifyConnected: false,
        shopifyDomain: null,
        shopifyName: null,
        shopifyCurrency: null,
        shopifyScopes: null,
        shopifyUpdatedAt: new Date().toISOString()
      })
    } else {
      await db
        .collection('users')
        .doc(session.user.uid)
        .collection('settings')
        .doc('shopify')
        .delete()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[api/settings/shopify DELETE]', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
