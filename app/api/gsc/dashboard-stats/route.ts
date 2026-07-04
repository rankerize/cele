export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getSearchAnalytics } from '@/lib/gsc'
import { getProjectById } from '@/lib/services/projects'

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function getDateRange(daysAgo: number, windowDays: number = 28): { start: string; end: string } {
  const today = new Date()
  const end = new Date(today)
  end.setDate(end.getDate() - 3) // GSC lag
  const start = new Date(end)
  start.setDate(start.getDate() - windowDays)
  // Shift back if needed
  end.setDate(end.getDate() - daysAgo)
  start.setDate(start.getDate() - daysAgo)
  return { start: formatDate(start), end: formatDate(end) }
}

interface WeeklyPoint {
  week: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

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
    const project = await getProjectById(projectId)
    if (project && project.userId === session.user?.uid) {
      siteUrl = project.gscSiteUrl || siteUrl
    }
  }

  if (!siteUrl) {
    return NextResponse.json({ success: false, error: 'No hay propiedad GSC seleccionada' }, { status: 400 })
  }

  try {
    const today = new Date()
    
    // Periodo actual: últimas 4 semanas (con lag de 3 días)
    const endCurrent = new Date(today)
    endCurrent.setDate(endCurrent.getDate() - 3)
    const startCurrent = new Date(endCurrent)
    startCurrent.setDate(startCurrent.getDate() - 28)

    // Mismo periodo hace 1 año
    const endPrev = new Date(endCurrent)
    endPrev.setFullYear(endPrev.getFullYear() - 1)
    const startPrev = new Date(startCurrent)
    startPrev.setFullYear(startPrev.getFullYear() - 1)

    // Datos de las últimas 16 semanas para el gráfico de tendencia
    const endChart = new Date(endCurrent)
    const startChart = new Date(endChart)
    startChart.setDate(startChart.getDate() - 112) // 16 semanas

    // Año anterior para el gráfico
    const endChartPrev = new Date(endChart)
    endChartPrev.setFullYear(endChartPrev.getFullYear() - 1)
    const startChartPrev = new Date(startChart)
    startChartPrev.setFullYear(startChartPrev.getFullYear() - 1)

    // Fetch en paralelo: actual, anterior, chart actual, chart anterior
    const [rowsCurrent, rowsPrev, rowsChart, rowsChartPrev] = await Promise.all([
      getSearchAnalytics(
        session.googleTokens,
        siteUrl,
        formatDate(startCurrent),
        formatDate(endCurrent),
        ['query'],
        5000
      ),
      getSearchAnalytics(
        session.googleTokens,
        siteUrl,
        formatDate(startPrev),
        formatDate(endPrev),
        ['query'],
        5000
      ),
      getSearchAnalytics(
        session.googleTokens,
        siteUrl,
        formatDate(startChart),
        formatDate(endChart),
        ['date'],
        2000
      ),
      getSearchAnalytics(
        session.googleTokens,
        siteUrl,
        formatDate(startChartPrev),
        formatDate(endChartPrev),
        ['date'],
        2000
      ),
    ])

    // ── Clasificar keywords por rango de posición ──
    const top3 = rowsCurrent.filter(r => r.position >= 1 && r.position <= 3)
    const pos4to10 = rowsCurrent.filter(r => r.position > 3 && r.position <= 10)
    const pos10plus = rowsCurrent.filter(r => r.position > 10)

    // ── Métricas globales periodo actual ──
    const totalClicks = rowsCurrent.reduce((s, r) => s + r.clicks, 0)
    const totalImpressions = rowsCurrent.reduce((s, r) => s + r.impressions, 0)
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0
    const avgPosition = rowsCurrent.length > 0
      ? rowsCurrent.reduce((s, r) => s + r.position, 0) / rowsCurrent.length
      : 0

    // ── Métricas globales periodo anterior ──
    const prevClicks = rowsPrev.reduce((s, r) => s + r.clicks, 0)
    const prevImpressions = rowsPrev.reduce((s, r) => s + r.impressions, 0)
    const prevAvgPosition = rowsPrev.length > 0
      ? rowsPrev.reduce((s, r) => s + r.position, 0) / rowsPrev.length
      : 0

    // ── Agrupar datos del gráfico por semana ──
    function groupByWeek(rows: typeof rowsChart): WeeklyPoint[] {
      const weekMap = new Map<string, { clicks: number; impressions: number; count: number }>()
      for (const r of rows) {
        const date = new Date(r.keys[0])
        // Inicio de semana (lunes)
        const day = date.getDay()
        const diff = (day === 0 ? -6 : 1) - day
        const monday = new Date(date)
        monday.setDate(date.getDate() + diff)
        const key = formatDate(monday)
        if (!weekMap.has(key)) weekMap.set(key, { clicks: 0, impressions: 0, count: 0 })
        const w = weekMap.get(key)!
        w.clicks += r.clicks
        w.impressions += r.impressions
        w.count++
      }
      return Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, d]) => ({
          week,
          clicks: d.clicks,
          impressions: d.impressions,
          ctr: d.impressions > 0 ? d.clicks / d.impressions : 0,
          position: 0
        }))
    }

    const chartCurrent = groupByWeek(rowsChart)
    const chartPrev = groupByWeek(rowsChartPrev)

    // ── Top keywords por cada banda ──
    const topKeywordsTop3 = top3
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)
      .map(r => ({ query: r.keys[0], position: Math.round(r.position * 10) / 10, clicks: r.clicks, impressions: r.impressions }))

    const topKeywords4to10 = pos4to10
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5)
      .map(r => ({ query: r.keys[0], position: Math.round(r.position * 10) / 10, clicks: r.clicks, impressions: r.impressions }))

    return NextResponse.json({
      success: true,
      data: {
        period: {
          current: { start: formatDate(startCurrent), end: formatDate(endCurrent) },
          previous: { start: formatDate(startPrev), end: formatDate(endPrev) },
        },
        totals: {
          keywords: rowsCurrent.length,
          clicks: totalClicks,
          impressions: totalImpressions,
          ctr: avgCtr,
          avgPosition,
        },
        prevTotals: {
          keywords: rowsPrev.length,
          clicks: prevClicks,
          impressions: prevImpressions,
          avgPosition: prevAvgPosition,
        },
        bands: {
          top3: { count: top3.length, clicks: top3.reduce((s, r) => s + r.clicks, 0), impressions: top3.reduce((s, r) => s + r.impressions, 0), topKeywords: topKeywordsTop3 },
          pos4to10: { count: pos4to10.length, clicks: pos4to10.reduce((s, r) => s + r.clicks, 0), impressions: pos4to10.reduce((s, r) => s + r.impressions, 0), topKeywords: topKeywords4to10 },
          pos10plus: { count: pos10plus.length, clicks: pos10plus.reduce((s, r) => s + r.clicks, 0), impressions: pos10plus.reduce((s, r) => s + r.impressions, 0) },
        },
        chart: {
          current: chartCurrent,
          previous: chartPrev,
        },
        siteUrl,
      }
    })
  } catch (error) {
    console.error('GSC Dashboard Stats Error:', error)
    const message = error instanceof Error ? error.message : 'Error al obtener estadísticas'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
