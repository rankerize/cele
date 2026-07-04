export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getGaProperties } from '@/lib/ga'
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
    const properties = await getGaProperties(session.googleTokens)
    let currentPropertyId = session.gaPropertyId

    if (projectId) {
      const { getAdminFirestore } = await import('@/lib/firebase-admin')
      const db = getAdminFirestore()
      const projectSnap = await db.collection('projects').doc(projectId).get()
      if (projectSnap.exists) {
        currentPropertyId = projectSnap.data()?.gaPropertyId || ''
      }
    }

    return NextResponse.json({ success: true, data: properties, currentPropertyId })
  } catch (error) {
    console.error('Error fetching GA properties:', error)
    const message = error instanceof Error ? error.message : 'Error al obtener propiedades GA'
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
    if (!body.propertyId) throw new Error('propertyId no provisto')
    
    session.gaPropertyId = body.propertyId
    await session.save()

    if (body.projectId) {
      await updateProject(body.projectId, { gaPropertyId: body.propertyId })
    }

    return NextResponse.json({ success: true, propertyId: session.gaPropertyId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al guardar propiedad'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
