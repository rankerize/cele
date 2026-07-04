import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { createProject, getUserProjects } from '@/lib/services/projects'

export async function GET() {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  const userId = session.user?.uid

  if (!session.isLoggedIn || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const projects = await getUserProjects(userId)
    return NextResponse.json({ success: true, projects })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  const userId = session.user?.uid

  if (!session.isLoggedIn || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, domain, country = null, cms = null, primaryGoal = null } = await request.json()

    if (!name || !domain) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const project = await createProject({
      userId,
      name,
      domain,
      country,
      cms,
      primaryGoal,
      gscSiteUrl: null,
      wpUrl: null,
    })

    return NextResponse.json({ success: true, project })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
