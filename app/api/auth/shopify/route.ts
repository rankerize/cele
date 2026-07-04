/**
 * app/api/auth/shopify/route.ts
 * Inicia el flujo OAuth de Shopify.
 * El cliente llama a: GET /api/auth/shopify?shop=tienda.myshopify.com
 */
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { normalizeShopDomain } from '@/lib/shopify'
import crypto from 'crypto'

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:1015'

// Scopes que necesitamos para leer/publicar contenido y productos
const SHOPIFY_SCOPES = [
  'read_products',
  'write_products',
  'read_content',
  'write_content',
].join(',')

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  let shop = searchParams.get('shop')
  const projectId = searchParams.get('projectId')

  if (!shop) {
    return NextResponse.json(
      { error: 'Parámetro "shop" requerido. Ej: tienda.myshopify.com' },
      { status: 400 }
    )
  }

  // Normalizar dominio
  shop = normalizeShopDomain(shop)

  // Generar nonce anti-CSRF y guardarlo en sesión
  const state = crypto.randomBytes(16).toString('hex')
  // @ts-expect-error — extendemos la sesión con shopify state
  session.shopifyOAuthState = state
  // @ts-expect-error
  session.shopifyOAuthShop = shop
  // @ts-expect-error
  session.shopifyProjectId = projectId
  await session.save()

  const redirectUri = `${APP_URL}/api/auth/shopify/callback`

  const authUrl = new URL(`https://${shop}/admin/oauth/authorize`)
  authUrl.searchParams.set('client_id', SHOPIFY_CLIENT_ID)
  authUrl.searchParams.set('scope', SHOPIFY_SCOPES)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
