export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { generateBatchPlan } from '@/lib/ai'
import { getAllPosts } from '@/lib/wordpress'
import { getSearchAnalytics } from '@/lib/gsc'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { nicho, numArticles, useGscData } = await request.json()

    if (!nicho) {
      return NextResponse.json({ success: false, error: 'Nicho requerido' }, { status: 400 })
    }

    const count = parseInt(numArticles) || 5
    if (count < 1 || count > 20) {
      return NextResponse.json({ success: false, error: 'Número de artículos inválido (1-20)' }, { status: 400 })
    }

    // 1. Obtener keywords/títulos existentes de WordPress
    let existingKeywords: string[] = []
    try {
      const posts = await getAllPosts('publish', session.user?.uid)
      existingKeywords = posts.map(p => p.meta?.['_keyword_principal'] || p.title.rendered).filter(Boolean) as string[]
    } catch (e) {
      console.warn('No se pudo obtener posts recientes de WP para evitar repetición', e)
    }

    // 2. Obtener queries de GSC (si se solicita y está configurado)
    let gscQueries: string[] = []
    if (useGscData && session.googleTokens && session.gscSiteUrl) {
      try {
        const endDate = new Date()
        endDate.setDate(endDate.getDate() - 3) // Evitar datos frescos inestables
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - 90) // 3 meses de data
        
        const rows = await getSearchAnalytics(
          session.googleTokens,
          session.gscSiteUrl,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          ['query'], // Solo agrupamos por query para ver qué posiciona globalmente
          200 // Top 200 queries para enviar a la IA (limitamos por contexto)
        )
        // Sort by impressions and take strings
        gscQueries = rows
          .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
          .map(r => r.keys?.[0])
          .filter(Boolean) as string[]
      } catch (error) {
         console.error('Error al obtener datos de GSC para planificación:', error)
         // Continuaremos sin GSC si falla pero con un warning
      }
    }

    // 3. Generar el plan con la IA
    const planItems = await generateBatchPlan(nicho, count, existingKeywords, gscQueries)

    // Agregamos un ID a cada item a nivel backend para manejarlos fácilmente
    const itemsWithIds = planItems.map(item => ({
       ...item,
       id: Math.random().toString(36).substring(7),
       approved: true, // Por defecto vienen listos para ejecución
       status: 'pending' as const
    }))

    return NextResponse.json({
      success: true,
      data: itemsWithIds,
      meta: {
        gscQueriesUsed: gscQueries.length,
        wpKeywordsUsed: existingKeywords.length
      }
    })

  } catch (error) {
    console.error('API Error Batch Plan:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
