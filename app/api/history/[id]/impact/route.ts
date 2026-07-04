export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getSearchAnalytics } from '@/lib/gsc'
import { getAdminFirestore } from '@/lib/firebase-admin'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

    if (!session.isLoggedIn || !session.googleTokens || !session.gscSiteUrl) {
      return NextResponse.json({ success: false, error: 'GSC no conectado' }, { status: 401 })
    }

    // Fetch history item from Firestore
    const adminDb = getAdminFirestore()
    const historySnap = await adminDb.collection('history').doc(params.id).get()

    if (!historySnap.exists) {
      return NextResponse.json({ success: false, error: 'Item no encontrado' }, { status: 404 })
    }

    const item = historySnap.data()!
    const postUrl = item.wordpressPostUrl

    if (!postUrl) {
      return NextResponse.json({ success: false, error: 'Este item no tiene URL de WordPress asociada' }, { status: 400 })
    }

    // Build 30-day window for "current" data
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 3) // GSC has ~3 day delay
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 30)

    const currentRows = await getSearchAnalytics(
      session.googleTokens,
      session.gscSiteUrl,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      ['query'],
      50,
      [{ dimension: 'page', expression: postUrl }]
    )

    // Aggregate current metrics
    const currentMetrics = currentRows.reduce(
      (acc, row) => ({
        impressions: acc.impressions + (row.impressions || 0),
        clicks: acc.clicks + (row.clicks || 0),
        position: acc.position + (row.position || 0),
        count: acc.count + 1,
      }),
      { impressions: 0, clicks: 0, position: 0, count: 0 }
    )

    const currentAvgPosition = currentMetrics.count > 0
      ? currentMetrics.position / currentMetrics.count
      : 0

    const currentCtr = currentMetrics.impressions > 0
      ? (currentMetrics.clicks / currentMetrics.impressions) * 100
      : 0

    // "Before" metrics saved at the time of improvement
    const beforeMetrics = item.gscMetrics || null

    // Calculate delta and impact score
    let impactScore = 0
    let positionDelta: number | null = null
    let impressionsDelta: number | null = null
    let clicksDelta: number | null = null
    let ctrDelta: number | null = null

    if (beforeMetrics) {
      const beforeCtr = beforeMetrics.impressions > 0
        ? (beforeMetrics.clicks / beforeMetrics.impressions) * 100
        : 0

      positionDelta = beforeMetrics.position - currentAvgPosition // positive = better (lower number)
      impressionsDelta = currentMetrics.impressions - beforeMetrics.impressions
      clicksDelta = currentMetrics.clicks - beforeMetrics.clicks
      ctrDelta = currentCtr - beforeCtr

      // Score 0–100
      // Position improvement: 50% weight (normalised over 20 positions)
      const posScore = Math.min(Math.max((positionDelta / 20) * 50, -50), 50)
      // Impressions improvement: 30% weight
      const impScore = beforeMetrics.impressions > 0
        ? Math.min((impressionsDelta / beforeMetrics.impressions) * 30, 30)
        : 0
      // CTR improvement: 20% weight
      const ctrScore = Math.min(Math.max(ctrDelta * 2, -20), 20)

      impactScore = Math.round(50 + posScore + impScore + ctrScore) // 50 = neutral baseline
      impactScore = Math.min(Math.max(impactScore, 0), 100) // clamp 0–100
    }

    // Top queries driving current traffic
    const topQueries = currentRows
      .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
      .slice(0, 5)
      .map(r => ({
        query: r.keys?.[0] || '',
        impressions: r.impressions || 0,
        clicks: r.clicks || 0,
        position: r.position || 0,
        ctr: ((r.ctr || 0) * 100).toFixed(1)
      }))

    return NextResponse.json({
      success: true,
      data: {
        itemId: params.id,
        postUrl,
        improvedAt: item.createdAt,
        before: beforeMetrics
          ? {
              impressions: beforeMetrics.impressions,
              clicks: beforeMetrics.clicks,
              position: beforeMetrics.position,
              ctr: beforeMetrics.impressions > 0
                ? ((beforeMetrics.clicks / beforeMetrics.impressions) * 100).toFixed(1)
                : '0.0',
            }
          : null,
        current: {
          impressions: currentMetrics.impressions,
          clicks: currentMetrics.clicks,
          position: currentAvgPosition.toFixed(1),
          ctr: currentCtr.toFixed(1),
        },
        delta: beforeMetrics
          ? {
              position: positionDelta?.toFixed(1),
              impressions: impressionsDelta,
              clicks: clicksDelta,
              ctr: ctrDelta?.toFixed(1),
            }
          : null,
        impactScore,
        topQueries,
        windowDays: 30,
      }
    })
  } catch (error) {
    console.error('Impact API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
