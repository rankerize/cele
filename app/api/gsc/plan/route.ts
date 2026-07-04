export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { generateSeoAuditPlan } from '@/lib/ai'

export async function POST(req: Request) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { siteUrl, metrics } = body

    if (!siteUrl || !metrics) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 })
    }

    const plan = await generateSeoAuditPlan(siteUrl, metrics)

    return NextResponse.json({ success: true, plan })

  } catch (error) {
    console.error('API /api/gsc/plan error:', error)
    const msg = error instanceof Error ? error.message : 'Error al generar el plan SEO'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
