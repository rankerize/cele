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
    const { targets, sources } = body as { targets: TargetPageData[]; sources: SourcePageData[] }

    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json({ error: 'Se requiere al menos un target' }, { status: 400 })
    }

    // Función para procesar un solo target (las 3 capas de IA)
    async function processTarget(
      target: TargetPageData
    ): Promise<{ target: TargetPageData; recommendation: FullRecommendation | null; error?: string }> {
      // Capa 1: Priorización
      const prioritization = await prioritizeTargetUrl(target)

      if (!prioritization.shouldStrengthen) {
        return {
          target,
          recommendation: {
            targetUrl: target.url,
            targetKeyword: target.keywords?.[0],
            shouldStrengthen: false,
            opportunityLevel: prioritization.opportunityLevel,
            reasoning: prioritization.reasoning,
            recommendedSourcePages: [],
            pagesToAvoid: [],
            generalWarnings: ['La IA determinó que esta URL no requiere refuerzo en este momento.'],
            nextAction: 'discard',
          },
        }
      }

      // Capa 2: Recomendar páginas fuente
      const filteredSources = sources
        .filter(s => s.url !== target.url)
        .filter(s => s.category === target.category || !target.category)
        .slice(0, 20)

      const sourceRecommendation = await recommendSourcePages(target, filteredSources)

      // Capa 3: Anchors (solo para top 3 fuentes, en paralelo entre sí)
      const enrichedSources = await Promise.all(
        sourceRecommendation.recommendedSourcePages.slice(0, 3).map(async (rec) => {
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

      const nextAction = enrichedSources.length > 0
        ? (prioritization.opportunityLevel === 'high' ? 'approve' : 'review')
        : 'discard'

      return {
        target,
        recommendation: {
          targetUrl: target.url,
          targetKeyword: target.keywords?.[0],
          shouldStrengthen: true,
          opportunityLevel: prioritization.opportunityLevel,
          reasoning: prioritization.reasoning,
          recommendedSourcePages: enrichedSources,
          pagesToAvoid: sourceRecommendation.pagesToAvoid || [],
          generalWarnings: sourceRecommendation.generalWarnings || [],
          nextAction,
        },
      }
    }

    // ⚡ Procesar todos los targets en PARALELO (máx 20)
    const settled = await Promise.allSettled(
      targets.slice(0, 20).map(target => processTarget(target))
    )

    const results = settled.map((result, i) => {
      if (result.status === 'fulfilled') return result.value
      return { target: targets[i], recommendation: null, error: (result.reason as Error)?.message || 'Error desconocido' }
    })

    const approved = results.filter(r => r.recommendation?.nextAction === 'approve').length
    const review = results.filter(r => r.recommendation?.nextAction === 'review').length
    const discarded = results.filter(r => r.recommendation?.nextAction === 'discard' || r.error).length

    return NextResponse.json({
      success: true,
      summary: { total: results.length, approved, review, discarded },
      results,
    })
  } catch (error: any) {
    console.error('[interlinking/batch]', error)
    return NextResponse.json({ error: error.message || 'Error desconocido' }, { status: 500 })
  }
}
