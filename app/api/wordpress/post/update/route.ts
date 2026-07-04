export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { updatePost } from '@/lib/wordpress'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Faltan parámetros requeridos (id, status)' }, { status: 400 })
    }

    // Only allow specific payload for safety
    const updatedPost = await updatePost(Number(id), { status }, session.user?.uid)

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPost.id,
        status: updatedPost.status
      }
    })
  } catch (error) {
    console.error('API /api/wordpress/post/update error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido al actualizar el post'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
