export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { generateContent } from '@/lib/ai'
import { ContentFormSchema } from '@/lib/validations'
import { getProjectById } from '@/lib/services/projects'
import { ProjectContext } from '@/types/strategy'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = ContentFormSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos del formulario inválidos',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    let projectContext: ProjectContext | undefined
    if (parsed.data.projectId) {
      const project = await getProjectById(parsed.data.projectId)
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

    const generatedContent = await generateContent(parsed.data, session.user?.uid, projectContext)

    return NextResponse.json({
      success: true,
      data: generatedContent,
    })
  } catch (error) {
    console.error('Error generando contenido:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: `Error al generar contenido: ${message}` },
      { status: 500 }
    )
  }
}
