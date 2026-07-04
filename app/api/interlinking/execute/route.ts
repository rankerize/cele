export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getPost, updatePost } from '@/lib/wordpress'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { sourcePostId, targetUrl, anchorText, placement } = body as {
      sourcePostId: number
      targetUrl: string
      anchorText: string
      placement?: string
    }

    if (!sourcePostId || !targetUrl || !anchorText) {
      return NextResponse.json(
        { error: 'Se requieren sourcePostId, targetUrl y anchorText' },
        { status: 400 }
      )
    }

    // Obtener el post fuente
    const uid = session.user?.uid
    const post = await getPost(sourcePostId, uid)
    const currentContent = post.content?.rendered || ''

    if (!currentContent) {
      return NextResponse.json({ error: 'El post fuente no tiene contenido' }, { status: 400 })
    }

    // Construir la tag del enlace
    const linkTag = `<a href="${targetUrl}">${anchorText}</a>`

    // Estrategia de inserción: buscar el primer párrafo con al menos 80 caracteres
    // e insertar el anchor text suplantando la primera ocurrencia del texto coincidente
    let newContent = currentContent

    // Intentar insertar en el segundo párrafo si existe
    const paragraphs = currentContent.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || []
    if (paragraphs.length >= 2) {
      // Insertar el link en el segundo párrafo visible, al final
      const targetParagraph = paragraphs[1]
      const pWithLink = targetParagraph.replace(/<\/p>/i, ` ${linkTag}</p>`)
      newContent = currentContent.replace(targetParagraph, pWithLink)
    } else if (paragraphs.length === 1) {
      const targetParagraph = paragraphs[0]
      const pWithLink = targetParagraph.replace(/<\/p>/i, ` ${linkTag}</p>`)
      newContent = currentContent.replace(targetParagraph, pWithLink)
    } else {
      // Si no hay párrafos estructurados, agregar al final
      newContent = currentContent + `\n<p>${linkTag}</p>`
    }

    // Actualizar post en WordPress
    const updated = await updatePost(sourcePostId, { content: newContent }, uid)

    return NextResponse.json({
      success: true,
      message: `Enlace insertado correctamente en "${post.title?.rendered}"`,
      postId: updated.id,
      postUrl: updated.link,
    })
  } catch (error: any) {
    console.error('[interlinking/execute]', error)
    return NextResponse.json({ error: error.message || 'Error desconocido' }, { status: 500 })
  }
}
