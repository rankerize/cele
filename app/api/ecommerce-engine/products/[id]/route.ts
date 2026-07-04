export const dynamic = 'force-dynamic'

/**
 * GET  /api/ecommerce-engine/products/[id]
 *   → Lee un producto con su array completo de imágenes (id, src, name, alt).
 *
 * PUT  /api/ecommerce-engine/products/[id]
 *   → Actualiza el título, descripción y/o ALT de imágenes en WooCommerce.
 *      Body: { name?, description?, short_description?, images?: [{id, alt}] }
 *
 * POST /api/ecommerce-engine/products/[id]/optimize (ver route dedicada)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getProduct, updateProduct } from '@/lib/woocommerce'
import { WCUpdateProductPayload } from '@/types/woocommerce'

// ── GET ──────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  const productId = parseInt(params.id, 10)
  if (isNaN(productId)) {
    return NextResponse.json({ success: false, error: 'ID de producto inválido' }, { status: 400 })
  }

  try {
    const product = await getProduct(productId, session.user?.uid)
    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ── PUT ──────────────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  const productId = parseInt(params.id, 10)
  if (isNaN(productId)) {
    return NextResponse.json({ success: false, error: 'ID de producto inválido' }, { status: 400 })
  }

  try {
    const body = (await request.json()) as WCUpdateProductPayload

    // Validación mínima: al menos un campo debe estar presente
    const hasContent =
      body.name !== undefined ||
      body.description !== undefined ||
      body.short_description !== undefined ||
      (body.images && body.images.length > 0)

    if (!hasContent) {
      return NextResponse.json(
        { success: false, error: 'El body está vacío. Envía al menos un campo a actualizar.' },
        { status: 400 }
      )
    }

    const updated = await updateProduct(productId, body, session.user?.uid)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
