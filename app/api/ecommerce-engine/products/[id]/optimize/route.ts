export const dynamic = 'force-dynamic'

/**
 * POST /api/ecommerce-engine/products/[id]/optimize
 *
 * Ejecuta el flujo completo:
 *   1. Lee el producto desde WooCommerce
 *   2. La IA genera título, descripción y ALTs optimizados
 *   3. Empuja los cambios a WooCommerce (PUT)
 *   4. Descuenta 1 crédito del usuario en Firestore
 *
 * Body (opcional):
 *   {
 *     overrides?: {
 *       name?: string,
 *       description?: string,
 *       short_description?: string,
 *       imagesAlt?: [{id: number, alt: string}]
 *     }
 *   }
 *
 * Si no se envía body, la IA genera todos los campos automáticamente.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { optimizeAndPushProduct } from '@/lib/woocommerce'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  const productId = parseInt(params.id, 10)
  if (isNaN(productId)) {
    return NextResponse.json({ success: false, error: 'ID de producto inválido' }, { status: 400 })
  }

  try {
    const body = request.headers.get('content-length') !== '0'
      ? await request.json().catch(() => ({}))
      : {}

    const result = await optimizeAndPushProduct({
      productId,
      userId: session.user.uid,
      overrides: body.overrides,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status = message.includes('Créditos insuficientes') ? 402 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
