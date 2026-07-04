export const dynamic = 'force-dynamic'

/**
 * GET  /api/ecommerce-engine/products
 * Lista productos de WooCommerce con paginación, búsqueda y filtro de estado.
 * 
 * Query params:
 *   page      (default 1)
 *   per_page  (default 20)
 *   status    (default 'publish')
 *   search    (opcional)
 *   category  (opcional, ID de categoría WC)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getProducts } from '@/lib/woocommerce'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
  const per_page = searchParams.get('per_page') ? parseInt(searchParams.get('per_page')!) : 20
  const status = searchParams.get('status') || 'publish'
  const search = searchParams.get('search') || undefined
  const category = searchParams.get('category') ? parseInt(searchParams.get('category')!) : undefined

  try {
    const data = await getProducts(
      { page, per_page, status, search, category },
      session.user?.uid
    )
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
