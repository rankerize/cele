export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { createPage, slugify } from '@/lib/wordpress'
import { PublishSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  const userId = session.user?.uid

  try {
    const body = await request.json()
    const parsed = PublishSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { title, slug, content, excerpt, faqs, status } = parsed.data

    // Añadir FAQs al contenido si existen
    let finalContent = content
    if (faqs && faqs.length > 0) {
      const faqHtml = `\n<section class="faq-section">\n<h2>Preguntas frecuentes</h2>\n${faqs
        .map(
          (faq) =>
            `<div class="faq-item">\n<h3>${faq.pregunta}</h3>\n<p>${faq.respuesta}</p>\n</div>`
        )
        .join('\n')}\n</section>`
      finalContent = content + faqHtml
    }

    // Crear la Página en WordPress (endpoint /pages — NO /posts)
    const page = await createPage({
      title,
      content: finalContent,
      slug: slugify(slug),
      excerpt: excerpt || '',
      status: status || 'draft',
    }, userId)

    // URL del panel de administración
    const apiUrl = process.env.WORDPRESS_API_URL || ''
    const siteBase = apiUrl.replace('/wp-json/wp/v2', '')
    const adminUrl = `${siteBase}/wp-admin/post.php?post=${page.id}&action=edit`

    return NextResponse.json({
      success: true,
      data: {
        postId: page.id,
        postUrl: page.link,
        adminUrl,
        status: page.status,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
