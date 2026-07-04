export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getProjectById } from '@/lib/services/projects'

export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const project = await getProjectById(params.projectId)

    if (!project || project.userId !== session.user.uid) {
      return NextResponse.json({ success: false, error: 'Proyecto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
