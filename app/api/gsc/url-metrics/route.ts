export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getSearchAnalytics } from '@/lib/gsc'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn || !session.googleTokens || !session.gscSiteUrl) {
    return NextResponse.json({ success: true, data: [] })
  }

  try {
    const { url } = await request.json()
    if (!url) return NextResponse.json({ success: true, data: [] })

    const end = new Date()
    end.setDate(end.getDate() - 3)
    const start = new Date(end)
    start.setDate(start.getDate() - 30)

    // Solo traemos dimensiones 'query' para agrupar
    const rows = await getSearchAnalytics(
       session.googleTokens, 
       session.gscSiteUrl, 
       start.toISOString().split('T')[0], 
       end.toISOString().split('T')[0], 
       ['query'], 
       20, 
       // Clean up URL to relative or just exact match depending on GSC property
       // Or better, just match contains with the slug
       [{ dimension: 'page', expression: url }]
    )

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error('API GSC URL Metrics Error:', error)
    return NextResponse.json({ success: true, data: [] }) 
  }
}
