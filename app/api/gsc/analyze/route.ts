export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getSearchAnalytics, classifyOpportunities } from '@/lib/gsc'
import { buildEditorialMap } from '@/lib/cannibalization'

export async function GET(req: Request) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!session.isLoggedIn || !session.googleTokens) {
    return NextResponse.json({ success: false, error: 'No autorizado con Google' }, { status: 401 })
  }

  let siteUrl = session.gscSiteUrl

  if (projectId) {
    const { getAdminFirestore } = await import('@/lib/firebase-admin')
    const db = getAdminFirestore()
    const projectSnap = await db.collection('projects').doc(projectId).get()
    if (projectSnap.exists && projectSnap.data()?.userId === session.user?.uid) {
      siteUrl = projectSnap.data()?.gscSiteUrl || siteUrl
    }
  }

  if (!siteUrl) {
    return NextResponse.json({ success: false, error: 'No hay propiedad GSC seleccionada' }, { status: 400 })
  }

  try {
    const today = new Date()
    const currentYear = today.getFullYear()

    // Current YTD window (with 3 day gap for GSC lag)
    const currentYtdEnd = new Date(today)
    currentYtdEnd.setDate(currentYtdEnd.getDate() - 3)
    const currentYtdStart = new Date(currentYear, 0, 1)

    // Previous YTD window for YoY comparison
    const lastYtdEnd = new Date(currentYtdEnd)
    lastYtdEnd.setFullYear(currentYear - 1)
    const lastYtdStart = new Date(currentYear - 1, 0, 1)

    const startDate = currentYtdStart.toISOString().split('T')[0]
    const endDate = currentYtdEnd.toISOString().split('T')[0]

    const [gscRowsYtd, previousTotalsRows, currentTotalsRows, editorialMap] = await Promise.all([
      getSearchAnalytics(session.googleTokens, siteUrl, startDate, endDate, ['query', 'page'], 5000),
      getSearchAnalytics(session.googleTokens, siteUrl, lastYtdStart.toISOString().split('T')[0], lastYtdEnd.toISOString().split('T')[0], []),
      getSearchAnalytics(session.googleTokens, siteUrl, startDate, endDate, []),
      buildEditorialMap(session.user?.uid),
    ])

    const { opportunities, cannibalizations } = classifyOpportunities(gscRowsYtd, editorialMap)

    const positionBuckets = { top3: 0, top10: 0, top20: 0, beyond: 0 }
    const queryStats = new Map<string, { clicks: number; impressions: number; position: number; count: number }>()

    for (const row of gscRowsYtd) {
      if (!row.keys) continue
      const query = row.keys[0]
      const pos = row.position

      if (pos <= 3) positionBuckets.top3++
      else if (pos <= 10) positionBuckets.top10++
      else if (pos <= 20) positionBuckets.top20++
      else positionBuckets.beyond++

      let stats = queryStats.get(query)
      if (!stats) {
        stats = { clicks: 0, impressions: 0, position: 0, count: 0 }
        queryStats.set(query, stats)
      }

      stats.clicks += row.clicks
      stats.impressions += row.impressions
      stats.position += pos
      stats.count += 1
    }

    const topKeywordsList = Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        clicks: stats.clicks,
        impressions: stats.impressions,
        position: stats.position / stats.count,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10)

    const performance = {
      currentYtd: currentTotalsRows[0] || { clicks: 0, impressions: 0 },
      previousYtd: previousTotalsRows[0] || { clicks: 0, impressions: 0 },
      positionBuckets,
      topKeywords: topKeywordsList,
    }

    return NextResponse.json({
      success: true,
      data: { opportunities, cannibalizations, dateRange: { startDate, endDate }, performance },
    })
  } catch (error) {
    console.error('API GSC Analyze Error:', error)
    const message = error instanceof Error ? error.message : 'Error al analizar datos GSC'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
