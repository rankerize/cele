export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { prioritizeTargetUrl, recommendSourcePages, suggestAnchors } from '@/lib/ai'
import { TargetPageData, SourcePageData, FullRecommendation } from '@/types/interlinking'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { target, sources } = body as { target: TargetPageData; sources: SourcePageData[] }

    if (!target || !sources) {
      return NextResponse.json({ error: 'Se requieren target y sources' }, { status: 400 })
    }

    // Capa 1: Priorización de URL objetivo
    const prioritization = await prioritizeTargetUrl(target)

    if (!prioritization.shouldStrengthen) {
      const result: FullRecommendation = {
        targetUrl: target.url,
        targetKeyword: target.keywords?.[0],
        shouldStrengthen: false,
        opportunityLevel: prioritization.opportunityLevel,
        reasoning: prioritization.reasoning,
        recommendedSourcePages: [],
        pagesToAvoid: [],
        generalWarnings: ['La IA determinó que esta página no requiere refuerzo interno en este momento.'],
        nextAction: 'discard',
      }
      return NextResponse.json({ success: true, recommendation: result })
    }

    // Capa 2: Recomendar páginas fuente (filtrar hasta 30 más relevantes por categoría y extracto)
    const filteredSources = sources
      .filter(s => s.url !== target.url)
      .filter(s => s.category === target.category || !target.category)
      .slice(0, 30)

    const sourceRecommendation = await recommendSourcePages(target, filteredSources)

    // Capa 3: Sugerir anchors para cada fuente recomendada
    const enrichedSources = await Promise.all(
      sourceRecommendation.recommendedSourcePages.slice(0, 5).map(async (rec) => {
        const sourceData = filteredSources.find(s => s.id === rec.sourceId || s.url === rec.sourceUrl)
        try {
          const anchorData = await suggestAnchors(
            target.url,
            target.title,
            rec.sourceUrl,
            rec.sourceTitle,
            sourceData?.excerpt
          )
          return {
            ...rec,
            recommendedAnchorTexts: anchorData.recommendedAnchorTexts || [],
            recommendedPlacement: anchorData.recommendedPlacement || 'En el cuerpo del artículo',
          }
        } catch {
          return {
            ...rec,
            recommendedAnchorTexts: [target.title],
            recommendedPlacement: 'En el cuerpo del artículo',
          }
        }
      })
    )

    // Determinar nextAction
    const nextAction = enrichedSources.length > 0
      ? (prioritization.opportunityLevel === 'high' ? 'approve' : 'review')
      : 'discard'

    const result: FullRecommendation = {
      targetUrl: target.url,
      targetKeyword: target.keywords?.[0],
      shouldStrengthen: true,
      opportunityLevel: prioritization.opportunityLevel,
      reasoning: prioritization.reasoning,
      recommendedSourcePages: enrichedSources,
      pagesToAvoid: sourceRecommendation.pagesToAvoid || [],
      generalWarnings: sourceRecommendation.generalWarnings || [],
      nextAction,
    }

    return NextResponse.json({ success: true, recommendation: result })
  } catch (error: any) {
    console.error('[interlinking/recommend]', error)
    return NextResponse.json({ error: error.message || 'Error desconocido' }, { status: 500 })
  }
}
