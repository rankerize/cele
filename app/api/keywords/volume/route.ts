export const dynamic = 'force-dynamic'

/**
 * app/api/keywords/volume/route.ts
 *
 * Endpoint: POST /api/keywords/volume
 * Body: { keywords: string[], country?: string, language?: string }
 * Devuelve volumen de búsqueda exacto para una lista de keywords.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getKeywordsVolume, getLocationCode } from '@/lib/dataforseo'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { keywords, country = 'España', language = 'es' } = await request.json()

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Proporciona al menos una keyword.' },
        { status: 400 }
      )
    }

    if (keywords.length > 700) {
      return NextResponse.json(
        { success: false, error: 'Máximo 700 keywords por solicitud.' },
        { status: 400 }
      )
    }

    const locationCode = getLocationCode(country)
    const results = await getKeywordsVolume(keywords, locationCode, language)

    return NextResponse.json({ success: true, data: results, count: results.length })
  } catch (error) {
    console.error('[keywords/volume] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
