export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { findOrCreateCategory } from '@/lib/wordpress'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El nombre de la categoría es obligatorio.' },
        { status: 400 }
      )
    }

    const result = await findOrCreateCategory(name.trim())

    return NextResponse.json({
      success: true,
      data: result.category,
      created: result.created,
      message: result.created ? 'Categoría creada con éxito.' : 'La categoría ya existía.',
    })
  } catch (error: any) {
    console.error('Error creando categoría:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error desconocido al crear la categoría' },
      { status: 500 }
    )
  }
}
