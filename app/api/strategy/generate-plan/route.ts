export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { generateEditorialStrategy } from '@/lib/ai'
import { getCategories, getPosts } from '@/lib/wordpress'
import { getProjectById } from '@/lib/services/projects'
import { EditorialStrategyInput, ProjectContext } from '@/types/strategy'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json() as Partial<EditorialStrategyInput> & { projectId?: string }
    
    if (!body.keyword || !body.niche || !body.intent || !body.country) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios (keyword, nicho, intención, país)' }, { status: 400 })
    }

    let projectContext: ProjectContext | undefined
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
      body.country = body.country || project.country || body.country
    }

    // 1. Obtener contexto de WordPress (Categorías existentes)
    let wpCategories: { id: number, name: string }[] = []
    try {
      const cats = await getCategories(session.user?.uid)
      wpCategories = cats.map(c => ({ id: c.id, name: c.name }))
    } catch (e) {
      console.error('No se pudieron cargar las categorías de WP', e)
    }

    // 2. Buscar posts relacionados para evitar canibalización base
    let relatedStr = body.existingRelatedPosts || ''
    if (!relatedStr) {
      try {
        const relatedPosts = await getPosts({ search: body.keyword, per_page: 5 }, session.user?.uid)
        if (relatedPosts.posts.length > 0) {
          relatedStr = relatedPosts.posts.map(p => `- ${p.title.rendered} (ID: ${p.id})`).join('\n')
        }
      } catch (e) {
        console.error('No se pudieron buscar posts relacionados en WP', e)
      }
    }

    const inputData: EditorialStrategyInput = {
      keyword: body.keyword,
      country: body.country,
      niche: body.niche,
      intent: body.intent,
      suggestedCategory: body.suggestedCategory,
      thematicBranch: body.thematicBranch,
      existingRelatedPosts: relatedStr,
      gscData: body.gscData, // Puede venir vacío en la Fase 1
      editorialDecision: body.editorialDecision || 'CREATE',
      projectContext
    }

    // 3. Generar la estrategia con IA
    const strategy = await generateEditorialStrategy(inputData, wpCategories, session.user?.uid, projectContext)

    return NextResponse.json({ success: true, data: strategy })
  } catch (error) {
    console.error('Generate Strategy Plan error:', error)
    const message = error instanceof Error ? error.message : 'Error al generar la estrategia editorial'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
