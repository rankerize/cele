export const dynamic = 'force-dynamic'

// ─── Action Center API — GET (list) + POST (create) ─────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { getActions, createAction } from '@/lib/action-center'
import { ActionFilters } from '@/types/action'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const filters: ActionFilters = {
      type: (searchParams.get('type') as ActionFilters['type']) || 'all',
      status: (searchParams.get('status') as ActionFilters['status']) || 'all',
      priority: (searchParams.get('priority') as ActionFilters['priority']) || 'all',
      source: (searchParams.get('source') as ActionFilters['source']) || 'all',
      search: searchParams.get('search') || undefined,
    }

    const actions = await getActions(filters)

    return NextResponse.json({ success: true, data: actions, total: actions.length })
  } catch (error) {
    console.error('[Action Center GET]', error)
    return NextResponse.json({ success: false, error: 'Error al obtener acciones' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.type || !body.priority || !body.reason || !body.sourceModule) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: type, priority, reason, sourceModule' },
        { status: 400 }
      )
    }

    const action = await createAction(body)

    return NextResponse.json({ success: true, data: action }, { status: 201 })
  } catch (error) {
    console.error('[Action Center POST]', error)
    return NextResponse.json({ success: false, error: 'Error al crear acción' }, { status: 500 })
  }
}
