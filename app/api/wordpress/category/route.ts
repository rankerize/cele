export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { findOrCreateCategory } from '@/lib/wordpress'
import { z } from 'zod'

const Schema = z.object({
  name: z.string().min(1, 'El nombre de la categoría es obligatorio'),
})

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = Schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Nombre de categoría inválido' },
        { status: 400 }
      )
    }

    const { category, created } = await findOrCreateCategory(parsed.data.name)

    return NextResponse.json({
      success: true,
      data: { category, created },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
