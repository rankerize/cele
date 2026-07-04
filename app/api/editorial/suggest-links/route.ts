export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { suggestInternalLinks } from '@/lib/ai'
import { buildEditorialMap } from '@/lib/cannibalization'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ success: false, error: 'El contenido es requerido' }, { status: 400 })
    }

    // 1. Obtener el mapa editorial (posts existentes)
    const editorialMap = await buildEditorialMap(session.user?.uid)
    
    // 2. Mapear a formato simple para la IA
    const availablePosts = editorialMap.map(post => ({
      title: post.title,
      url: post.url,
      keywordPrincipal: post.keywordPrincipal
    }))

    // 3. Obtener sugerencias de la IA
    const suggestions = await suggestInternalLinks(content, availablePosts)

    return NextResponse.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    console.error('Error sugiriendo enlaces:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: `Error al generar sugerencias: ${message}` },
      { status: 500 }
    )
  }
}
