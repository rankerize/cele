export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { writeEditorialContent } from '@/lib/ai'
import { WriterInput, ProjectContext } from '@/types/strategy'
import { getProjectById } from '@/lib/services/projects'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const userId = session.user?.uid || ''
    const { checkUserWallet } = await import('@/lib/firebase-admin')
    const hasCredits = await checkUserWallet(userId)
    if (!hasCredits) {
      return NextResponse.json({ success: false, error: 'No tienes créditos suficientes. Por favor, recarga tu cuenta.' }, { status: 402 })
    }

    const body = await request.json() as WriterInput & { projectId?: string }
    
    if (!body.strategy || !body.strategy.seoTitle || !body.strategy.outline) {
      return NextResponse.json({ success: false, error: 'La estrategia editorial provista es inválida' }, { status: 400 })
    }

    let projectContext: ProjectContext | undefined = body.projectContext
    if (body.projectId) {
      const project = await getProjectById(body.projectId)
      if (!project || project.userId !== session.user?.uid) {
        return NextResponse.json({ success: false, error: 'Proyecto no encontrado' }, { status: 404 })
      }
      projectContext = {
        projectId: project.id,
        name: project.name,
        domain: project.domain,
        country: project.country,
        cms: project.cms,
        primaryGoal: project.primaryGoal,
        gscSiteUrl: project.gscSiteUrl,
        wpUrl: project.wpUrl,
      }
    }

    const draft = await writeEditorialContent({ ...body, projectContext }, userId)

    return NextResponse.json({ success: true, data: draft })
  } catch (error) {
    console.error('Write Content error:', error)
    const message = error instanceof Error ? error.message : 'Error al redactar el borrador'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
