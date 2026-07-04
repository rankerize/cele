/**
 * app/api/auth/shopify/callback/route.ts
 * Maneja el callback de OAuth de Shopify.
 * Shopify redirige aquí con: ?code=...&state=...&shop=...
 *
 * Este endpoint:
 * 1. Valida el state anti-CSRF
 * 2. Intercambia el code por un access token
 * 3. Guarda el token en Firestore (server-side only)
 * 4. Redirige al usuario a /dashboard/settings con éxito
 */
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { normalizeShopDomain } from '@/lib/shopify'

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:1015'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.redirect(`${APP_URL}/login`)
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const shopParam = searchParams.get('shop')
  const errorParam = searchParams.get('error')

  // Si el usuario canceló la autorización
  if (errorParam) {
    const description = searchParams.get('error_description') ?? 'Autorización cancelada'
    return NextResponse.redirect(
      `${APP_URL}/dashboard/settings?shopify_error=${encodeURIComponent(description)}`
    )
  }

  if (!code || !state || !shopParam) {
    return NextResponse.redirect(
      `${APP_URL}/dashboard/settings?shopify_error=${encodeURIComponent('Parámetros de OAuth inválidos')}`
    )
  }

  // Validar state anti-CSRF
  // @ts-expect-error
  const savedState = session.shopifyOAuthState
  // @ts-expect-error
  const savedShop = session.shopifyOAuthShop
  // @ts-expect-error
  const projectId = session.shopifyProjectId

  const baseRedirectUrl = projectId ? `${APP_URL}/dashboard/${projectId}/settings` : `${APP_URL}/dashboard/settings`

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      `${baseRedirectUrl}?shopify_error=${encodeURIComponent('Error de seguridad: state inválido. Intenta conectar de nuevo.')}`
    )
  }

  const shop = normalizeShopDomain(shopParam)

  try {
    // Intercambiar code por access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code,
      }),
    })

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text()
      console.error('[Shopify OAuth callback] Token exchange failed:', errorText)
      return NextResponse.redirect(
        `${baseRedirectUrl}?shopify_error=${encodeURIComponent('No se pudo obtener el token de Shopify')}`
      )
    }

    const { access_token, scope } = await tokenRes.json()

    if (!access_token) {
      return NextResponse.redirect(
        `${baseRedirectUrl}?shopify_error=${encodeURIComponent('Shopify no devolvió un token válido')}`
      )
    }

    // Obtener info de la tienda para guardar el nombre
    let shopName = shop
    let currency = ''
    let shopDisplayDomain = shop
    try {
      const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: { 'X-Shopify-Access-Token': access_token },
      })
      if (shopRes.ok) {
        const shopData = await shopRes.json()
        shopName = shopData.shop?.name ?? shop
        currency = shopData.shop?.currency ?? ''
        shopDisplayDomain = shopData.shop?.domain ?? shop
      }
    } catch {
      // no-op: guardamos con la info básica
    }

    // Guardar en Firestore — token NUNCA va al cliente
    const db = getAdminFirestore()
    
    if (projectId) {
      // Guardar en el proyecto
      await db.collection('projects').doc(projectId).set({
        shopifyAccessToken: access_token,
        shopifyConnected: true,
        shopifyDomain: shop,
        shopifyDisplayDomain: shopDisplayDomain,
        shopifyName: shopName,
        shopifyCurrency: currency,
        shopifyScopes: scope,
        shopifyUpdatedAt: new Date().toISOString(),
      }, { merge: true })
    } else {
      // Legacy: Guardar en el usuario
      await db
        .collection('users')
        .doc(session.user.uid)
        .collection('settings')
        .doc('shopify')
        .set({
          shopDomain: shop,
          shopDisplayDomain,
          adminAccessToken: access_token,
          scopes: scope,
          connected: true,
          shopName,
          shopCurrency: currency,
          updatedAt: new Date().toISOString(),
        }, { merge: true })
    }

    // Limpiar state de sesión
    // @ts-expect-error
    delete session.shopifyOAuthState
    // @ts-expect-error
    delete session.shopifyOAuthShop
    // @ts-expect-error
    delete session.shopifyProjectId
    await session.save()

    // Redirigir con éxito
    return NextResponse.redirect(
      `${baseRedirectUrl}?shopify_success=1&shop=${encodeURIComponent(shopName)}`
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[Shopify OAuth callback]', message)
    return NextResponse.redirect(
      `${baseRedirectUrl}?shopify_error=${encodeURIComponent('Error al procesar la conexión')}`
    )
  }
}
