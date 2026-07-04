export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { updatePost } from '@/lib/wordpress'

export async function PUT(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions)
    if (!session.isLoggedIn) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    const uid = session.user?.uid
    const body = await req.json()
    const { postId, categoryId } = body

    if (!postId || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros: postId y categoryId son requeridos.' },
        { status: 400 }
      )
    }

    // Usar la librería de WordPress para actualizar la categoría del post.
    // updatePost acepta categories: number[]
    const updatedPost = await updatePost(Number(postId), {
      categories: [Number(categoryId)],
    }, uid)

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: 'Categoría actualizada con éxito en WordPress.',
    })
  } catch (error: any) {
    console.error('Error actualizando categoría del post:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error desconocido al actualizar la categoría' },
      { status: 500 }
    )
  }
}
