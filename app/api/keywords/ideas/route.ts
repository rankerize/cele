export const dynamic = 'force-dynamic'

/**
 * app/api/keywords/ideas/route.ts
 *
 * Endpoint: POST /api/keywords/ideas
 * Body: { keyword: string, country?: string, language?: string, limit?: number }
 * Devuelve ideas de keywords relacionadas con volumen, CPC y dificultad.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getKeywordIdeas, getRelatedKeywords, getLocationCode } from '@/lib/dataforseo'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const {
      keyword,
      country = 'España',
      language = 'es',
      limit = 30,
      mode = 'ideas', // 'ideas' | 'related'
    } = await request.json()

    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Proporciona una keyword de búsqueda.' },
        { status: 400 }
      )
    }

    const locationCode = getLocationCode(country)
    const clampedLimit = Math.min(Math.max(limit, 5), 100)

    let data
    if (mode === 'related') {
      data = await getRelatedKeywords(keyword.trim(), locationCode, language, clampedLimit)
    } else {
      data = await getKeywordIdeas(keyword.trim(), locationCode, language, clampedLimit)
    }

    return NextResponse.json({ success: true, data, count: data.length, seedKeyword: keyword })
  } catch (error) {
    console.error('[keywords/ideas] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
