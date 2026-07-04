export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { analyzeConflicts } from '@/lib/cannibalization'
import { AnalyzeConflictSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = AnalyzeConflictSchema.safeParse(body)

    if (!parsed.success) {
       return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data
    const analysis = await analyzeConflicts(
      data.keywordPrincipal,
      data.title,
      data.slug,
      data.intencionBusqueda,
      data.categoria
    )

    return NextResponse.json({ success: true, data: analysis })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
