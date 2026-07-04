export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { findOrCreateCategory, updatePost } from '@/lib/wordpress'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { postId, categoryName } = await request.json()
    if (!postId || !categoryName) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 })
    }
    const uid = session.user?.uid

    // Buscar o crear la categoría
    const { category } = await findOrCreateCategory(categoryName)

    // Actualizar el post
    const updated = await updatePost(postId, {
      categories: [category.id],
    }, uid)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
