/**
 * app/api/settings/shopify/verify/route.ts
 * POST → verifica las credenciales de Shopify llamando a /admin/api/shop.json
 *        y actualiza el campo `connected` en Firestore si tiene éxito.
 */
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { verifyShopifyConnection, normalizeShopDomain } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    let { shopDomain, adminAccessToken } = body
    const useStored = body.useStored === 'true' || body.useStored === true

    // Si el usuario no re-ingresó el token, leerlo de Firestore
    if (useStored || !adminAccessToken) {
      const db = getAdminFirestore()
      const snap = await db
        .collection('users')
        .doc(session.user.uid)
        .collection('settings')
        .doc('shopify')
        .get()
      if (!snap.exists) {
        return NextResponse.json(
          { success: false, error: 'No hay credenciales guardadas. Guarda el Access Token primero.' },
          { status: 400 }
        )
      }
      const stored = snap.data()!
      shopDomain = shopDomain || stored.shopDomain
      adminAccessToken = stored.adminAccessToken
    }

    if (!shopDomain || !adminAccessToken) {
      return NextResponse.json(
        { success: false, error: 'Faltan credenciales para verificar' },
        { status: 400 }
      )
    }

    const normalizedDomain = normalizeShopDomain(shopDomain)

    // Llamar a Shopify para verificar
    const result = await verifyShopifyConnection(normalizedDomain, adminAccessToken)

    if (result.success && result.shop) {
      // Guardar/actualizar en Firestore con connected = true y nombre de la tienda
      const db = getAdminFirestore()
      await db
        .collection('users')
        .doc(session.user.uid)
        .collection('settings')
        .doc('shopify')
        .set(
          {
            shopDomain: normalizedDomain,
            adminAccessToken,
            connected: true,
            shopName: result.shop.name,
            shopCurrency: result.shop.currency,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )

      return NextResponse.json({
        success: true,
        shop: result.shop,
      })
    }

    return NextResponse.json(
      { success: false, error: result.error ?? 'No se pudo conectar con Shopify' },
      { status: 400 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[api/settings/shopify/verify]', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
