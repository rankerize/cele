export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { generateContentIdeas } from '@/lib/ai'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { topic, existingTitles } = await request.json()

    if (!topic) {
      return NextResponse.json({ success: false, error: 'El tema es requerido' }, { status: 400 })
    }

    const ideas = await generateContentIdeas(topic, existingTitles)

    return NextResponse.json({
      success: true,
      data: ideas,
    })
  } catch (error) {
    console.error('Error generando ideas:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: `Error al generar ideas: ${message}` },
      { status: 500 }
    )
  }
}
