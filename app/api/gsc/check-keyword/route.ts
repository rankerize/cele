export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getSearchAnalytics } from '@/lib/gsc'
import { buildEditorialMap } from '@/lib/cannibalization'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn || !session.googleTokens || !session.gscSiteUrl) {
     // Si no está conectado GSC, simplemente pasamos de largo sin bloquear
    return NextResponse.json({ success: true, hasWarning: false }) 
  }

  try {
    const { keyword } = await request.json()
    if (!keyword) return NextResponse.json({ success: true, hasWarning: false })

    const end = new Date()
    end.setDate(end.getDate() - 3)
    const start = new Date(end)
    start.setDate(start.getDate() - 30)

    const startDate = start.toISOString().split('T')[0]
    const endDate = end.toISOString().split('T')[0]

    // 1. Check GSC for this keyword specifically
    const gscRows = await getSearchAnalytics(
       session.googleTokens, 
       session.gscSiteUrl, 
       startDate, 
       endDate, 
       ['query', 'page'], 
       10, 
       [{ dimension: 'query', expression: keyword }]
    )

    // Agregamos data de WP
    const editorialMap = await buildEditorialMap(session.user?.uid)

    // 2. Analizar coincidencias
    const exactMatches = gscRows.filter(r => r.keys[0].toLowerCase() === keyword.toLowerCase())
    const relatedMatches = gscRows.filter(r => r.keys[0].toLowerCase() !== keyword.toLowerCase())

    let bestMatch = exactMatches.length > 0 ? exactMatches[0] : (relatedMatches.length > 0 ? relatedMatches[0] : null)

    if (bestMatch && bestMatch.impressions > 5) {
       // Buscar si ya existe este post asociado en WP
       const pageUrl = bestMatch.keys[1]
       const matchingPost = editorialMap.find(
          p => p.url === pageUrl || pageUrl.includes(`/${p.slug}/`) || pageUrl.endsWith(`/${p.slug}`)
       )

       return NextResponse.json({
         success: true,
         hasWarning: true,
         warningData: {
           query: bestMatch.keys[0],
           page: pageUrl,
           impressions: bestMatch.impressions,
           clicks: bestMatch.clicks,
           position: bestMatch.position,
           matchingPost: matchingPost || null
         }
       })
    }

    return NextResponse.json({ success: true, hasWarning: false })
  } catch (error) {
    console.error('API GSC Check Error:', error)
    return NextResponse.json({ success: true, hasWarning: false }) // Fail open
  }
}
