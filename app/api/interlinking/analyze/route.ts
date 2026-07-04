export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getSearchAnalytics } from '@/lib/gsc'
import { getProjectById } from '@/lib/services/projects'
import { getAllPosts, getCategories } from '@/lib/wordpress'
import { TargetPageData, SourcePageData } from '@/types/interlinking'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const siteUrl = searchParams.get('siteUrl') || ''
    const projectId = searchParams.get('projectId')
    let effectiveSiteUrl = siteUrl

    if (!effectiveSiteUrl && projectId) {
      const project = await getProjectById(projectId)
      if (project && project.userId === session.user?.uid) {
        effectiveSiteUrl = project.gscSiteUrl || ''
      }
    }

    if (!effectiveSiteUrl && !session.googleTokens) {
      return NextResponse.json({ error: 'Se requiere siteUrl y Google conectado' }, { status: 400 })
    }

    // Fechas para GSC: últimos 90 días
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)
    const fmt = (d: Date) => d.toISOString().split('T')[0]

    // Cargar datos en paralelo
    const [gscRows, wpPosts, wpCategories] = await Promise.all([
      session.googleTokens && effectiveSiteUrl
        ? getSearchAnalytics(session.googleTokens, effectiveSiteUrl, fmt(startDate), fmt(endDate), ['page', 'query'], 500)
        : Promise.resolve([]),
      getAllPosts('publish', session.user?.uid),
      getCategories(session.user?.uid),
    ])

    // Mapa de categoría por id
    const catMap = new Map(wpCategories.map(c => [c.id, c.name]))

    // Construir lookup de posts de WP por URL/slug
    const wpPostMap = new Map<string, typeof wpPosts[0]>()
    for (const post of wpPosts) {
      if (post.link) wpPostMap.set(post.link, post)
      if (post.slug) wpPostMap.set(post.slug, post)
    }

    // Contar enlaces salientes por post (buscando <a href=...> dentro del contenido)
    const outboundLinksCount = new Map<number, number>()
    for (const post of wpPosts) {
      const content = post.content?.rendered || ''
      const hrefs = content.match(/href="[^"]*"/g) || []
      outboundLinksCount.set(post.id, hrefs.length)
    }

    // Agrupar GSC rows por page, tomar best query (más impresiones)
    const pageDataMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number; query: string }>()
    for (const row of gscRows) {
      const page = row.keys[0]
      const query = row.keys[1] || ''
      const existing = pageDataMap.get(page)
      if (!existing || row.impressions > existing.impressions) {
        pageDataMap.set(page, {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
          query,
        })
      }
    }

    // Construir targets (páginas con oportunidad)
    const targets: TargetPageData[] = []
    const sources: SourcePageData[] = []

    for (const post of wpPosts) {
      const postLink = post.link || ''
      const gscData = pageDataMap.get(postLink) || { clicks: 0, impressions: 0, ctr: 0, position: 99, query: '' }
      const categoryId = post.categories?.[0]
      const categoryName = categoryId ? catMap.get(categoryId) : undefined
      const decodedTitle = post.title?.rendered?.replace(/&#\d+;/g, c => {
        const code = parseInt(c.slice(2, -1))
        return String.fromCharCode(code)
      }) || 'Sin título'

      const target: TargetPageData = {
        url: postLink,
        title: decodedTitle,
        slug: post.slug,
        category: categoryName,
        clicks: gscData.clicks,
        impressions: gscData.impressions,
        ctr: gscData.ctr,
        position: gscData.position,
        keywords: gscData.query ? [gscData.query] : [],
      }

      const source: SourcePageData = {
        id: post.id,
        url: postLink,
        title: decodedTitle,
        category: categoryName,
        excerpt: post.excerpt?.rendered?.replace(/<[^>]*>/g, '').slice(0, 200),
        internalOutboundLinksCount: outboundLinksCount.get(post.id) || 0,
      }

      // Es target si tiene oportunidad: posición 4-20 con cierto volumen, o poco GSC data
      const isStrikingDistance = gscData.position >= 4 && gscData.position <= 20 && gscData.impressions > 30
      const isOrphaned = gscData.impressions === 0 || gscData.clicks === 0
      const hasGoodVolume = gscData.impressions > 100

      if (isStrikingDistance || isOrphaned || hasGoodVolume) {
        targets.push(target)
      }

      sources.push(source)
    }

    // Ordenar targets: mayor oportunidad primero (impresiones altas + posición media 4-20)
    targets.sort((a, b) => {
      const scoreA = a.impressions * (a.position >= 4 && a.position <= 20 ? 2 : 1)
      const scoreB = b.impressions * (b.position >= 4 && b.position <= 20 ? 2 : 1)
      return scoreB - scoreA
    })

    // Estadísticas para el diagnóstico general
    const stats = {
      totalPosts: wpPosts.length,
      totalTargets: targets.length,
      totalSources: sources.length,
      strikingDistanceCount: targets.filter(t => t.position >= 4 && t.position <= 20).length,
      orphanedCount: targets.filter(t => t.impressions === 0).length,
      highVolumeCount: targets.filter(t => t.impressions > 500).length,
    }

    return NextResponse.json({
      success: true,
      stats,
      targets: targets.slice(0, 100), // Limitar a top 100
      sources: sources.slice(0, 200), // Limitar fuentes a 200
    })
  } catch (error: any) {
    console.error('[interlinking/analyze]', error)
    return NextResponse.json({ error: error.message || 'Error desconocido' }, { status: 500 })
  }
}
