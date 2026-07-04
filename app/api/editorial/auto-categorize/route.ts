export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { autoCategorizeContent } from '@/lib/ai'
import { getCategories } from '@/lib/wordpress'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { posts } = await request.json()
    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ success: false, error: 'Lista de posts inválida' }, { status: 400 })
    }

    const categories = await getCategories(session.user?.uid)
    const categoryNames = categories.map(c => c.name)

    const results = await autoCategorizeContent(posts, categoryNames)

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
