export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getGscSites } from '@/lib/gsc'
import { updateProject } from '@/lib/services/projects'

export async function GET(req: Request) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn || !session.googleTokens) {
    return NextResponse.json({ success: false, error: 'No autorizado con Google' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  try {
    const sites = await getGscSites(session.googleTokens)
    let currentSiteUrl = session.gscSiteUrl

    if (projectId) {
      const { getAdminFirestore } = await import('@/lib/firebase-admin')
      const db = getAdminFirestore()
      const projectSnap = await db.collection('projects').doc(projectId).get()
      if (projectSnap.exists) {
        currentSiteUrl = projectSnap.data()?.gscSiteUrl || ''
      }
    }

    return NextResponse.json({ success: true, data: sites, currentSiteUrl })
  } catch (error) {
    console.error('Error fetching GSC sites:', error)
    const message = error instanceof Error ? error.message : 'Error al obtener sitios GSC'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    if (!body.siteUrl) throw new Error('siteUrl no provisto')
    
    session.gscSiteUrl = body.siteUrl
    await session.save()

    if (body.projectId) {
      await updateProject(body.projectId, { gscSiteUrl: body.siteUrl })
    }

    return NextResponse.json({ success: true, siteUrl: session.gscSiteUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al guardar sitio'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
