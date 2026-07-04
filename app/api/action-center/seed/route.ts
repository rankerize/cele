export const dynamic = 'force-dynamic'

// ─── Action Center Seed API — Consolida acciones desde módulos existentes ───
import { NextRequest, NextResponse } from 'next/server'
import { seedActionsFromModules } from '@/lib/action-center'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // Leer sesión para datos de GSC si están disponibles
    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

    let gscData: Parameters<typeof seedActionsFromModules>[0] | undefined
    let editorialData: Parameters<typeof seedActionsFromModules>[2] | undefined

    // Intentar obtener datos de GSC si hay sesión activa
    if (session.googleTokens?.access_token && session.gscSiteUrl) {
      try {
        const gscRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:1015'}/api/gsc/report`, {
          headers: { Cookie: req.headers.get('cookie') || '' },
        })
        if (gscRes.ok) {
          const gscJson = await gscRes.json()
          gscData = gscJson.data
        }
      } catch {
        // GSC no disponible, continuamos sin esos datos
      }
    }

    // Intentar obtener datos del mapa editorial desde WordPress
    try {
      const wpRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:1015'}/api/wordpress/editorial-map?limit=50`, {
        headers: { Cookie: req.headers.get('cookie') || '' },
      })
      if (wpRes.ok) {
        const wpJson = await wpRes.json()
        if (wpJson.success && wpJson.data) {
          editorialData = wpJson.data.map((item: {
            keywordPrincipal?: string
            url?: string
            categoria?: string
            ramaTematica?: string
            status?: string
          }) => ({
            keyword: item.keywordPrincipal,
            url: item.url,
            category: item.categoria,
            branch: item.ramaTematica,
            status: item.status,
          }))
        }
      }
    } catch {
      // Editorial map no disponible, continuamos
    }

    // También aceptar datos pasados directamente en el body (para uso programático)
    let bodyData: {
      gscData?: Parameters<typeof seedActionsFromModules>[0]
      canniData?: Parameters<typeof seedActionsFromModules>[1]
      editorialData?: Parameters<typeof seedActionsFromModules>[2]
    } = {}
    try {
      const text = await req.text()
      if (text) bodyData = JSON.parse(text)
    } catch {}

    const result = await seedActionsFromModules(
      bodyData.gscData ?? gscData,
      bodyData.canniData,
      bodyData.editorialData ?? editorialData
    )

    return NextResponse.json({
      success: true,
      message: `Seed completado: ${result.created} acciones creadas, ${result.skipped} omitidas`,
      data: result,
    })
  } catch (error) {
    console.error('[Action Center Seed]', error)
    return NextResponse.json({ success: false, error: 'Error en seed del Action Center' }, { status: 500 })
  }
}
