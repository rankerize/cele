export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { analyzeContentForImprovement } from '@/lib/ai'
import { updatePost, getPost } from '@/lib/wordpress'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { postId, keyword } = body as { postId: number; keyword?: string }

    if (!postId) {
      return NextResponse.json({ success: false, error: 'postId es requerido' }, { status: 400 })
    }

    // 1. Fetch the current post from WordPress
    const uid = session.user?.uid
    const currentPost = await getPost(postId, uid)
    const title = currentPost.title?.rendered || ''
    const content = currentPost.content?.rendered || ''
    const category = currentPost.meta?.['_keyword_principal'] || keyword || ''

    if (!content.trim()) {
      return NextResponse.json({
        success: false,
        error: 'El post no tiene contenido para optimizar.',
        postId,
      }, { status: 422 })
    }

    // 2. Generate AI improvement
    const suggestion = await analyzeContentForImprovement(content, title, keyword || category, undefined)

    // 3. Build meta payload
    const meta: Record<string, string> = {
      _seo_score: String(suggestion.scoreSEO ?? 0),
    }
    if (keyword) {
      meta['_keyword_principal'] = keyword
    }
    if (suggestion.improvedSeoTitle) {
      meta['_yoast_wpseo_title'] = suggestion.improvedSeoTitle
      meta['_seo_title'] = suggestion.improvedSeoTitle
    }
    if (suggestion.improvedMetaDescription) {
      meta['_yoast_wpseo_metadesc'] = suggestion.improvedMetaDescription
      meta['_meta_description'] = suggestion.improvedMetaDescription
    }

    // 4. Update the post in WordPress
    await updatePost(postId, {
      title: suggestion.improvedTitle || title,
      content: suggestion.improvedContent || content,
      slug: suggestion.improvedSlug || currentPost.slug,
      meta,
    }, uid)

    return NextResponse.json({
      success: true,
      postId,
      postTitle: suggestion.improvedTitle || title,
      scoreSEO: suggestion.scoreSEO,
      suggestion,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
