export const dynamic = 'force-dynamic'

// ─── Action Center API — GET (detail) + PATCH (update status) ───────────────
import { NextRequest, NextResponse } from 'next/server'
import { getActionById, updateActionStatus } from '@/lib/action-center'
import { ActionStatusUpdate } from '@/types/action'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const action = await getActionById(params.id)
    if (!action) {
      return NextResponse.json({ success: false, error: 'Acción no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: action })
  } catch (error) {
    console.error('[Action Detail GET]', error)
    return NextResponse.json({ success: false, error: 'Error al obtener acción' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    if (!body.status) {
      return NextResponse.json({ success: false, error: 'El campo status es requerido' }, { status: 400 })
    }

    const update: ActionStatusUpdate = {
      status: body.status,
      by: body.by || 'usuario',
      note: body.note,
      result: body.result,
      error: body.error,
    }

    const updated = await updateActionStatus(params.id, update)
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Acción no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[Action Detail PATCH]', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar acción' }, { status: 500 })
  }
}
