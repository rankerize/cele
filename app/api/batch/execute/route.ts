export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { generateContent } from '@/lib/ai'
import { createPost, findOrCreateCategory } from '@/lib/wordpress'
import { generateId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  // ✅ FIX: extraer userId para pasarlo a todos los servicios
  const userId = session.user.uid

  const { checkUserWallet } = await import('@/lib/firebase-admin')
  const hasCredits = await checkUserWallet(userId)
  if (!hasCredits) {
    return NextResponse.json({ success: false, error: 'No tienes créditos suficientes. Por favor, recarga tu cuenta.' }, { status: 402 })
  }

  // ✅ FIX: verificar OPENAI_API_KEY antes de empezar (evita error genérico)
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'OPENAI_API_KEY no configurada en el servidor. Agrégala en Firebase → Hosting → Environment variables.' },
      { status: 500 }
    )
  }

  try {
    const data = await request.json()
    const { 
      nicho, paisMercado, tipoPieza, ctaFinal, tono, longitudAproximada, 
      item // BatchPlanItem
    } = data

    if (!item || !item.keyword || !item.title) {
       return NextResponse.json({ success: false, error: 'Faltan datos del artículo a generar' }, { status: 400 })
    }

    const formData = {
       nicho,
       paisMercado,
       tipoPieza,
       ctaFinal,
       tono,
       longitudAproximada,
       keywordPrincipal: item.keyword,
       intencionBusqueda: item.intencionBusqueda,
       categoriaDeseada: item.categoriaDeseada,
       _angle: item.angle
    }

    const effectiveFormData = {
       ...formData,
       nicho: `Nicho: ${nicho} | Ángulo de este artículo: ${item.angle}`
    }

    // ✅ FIX 1: pasar userId → descuenta créditos correctamente
    const content = await generateContent(effectiveFormData, userId)

    // 2. Resolve Category in WP
    let catId: number | undefined
    if (content.categoriaSugerida || formData.categoriaDeseada) {
       try {
           // ✅ FIX 2: pasar userId → lee credenciales WP del usuario de Firestore
           const catResult = await findOrCreateCategory(
             content.categoriaSugerida || formData.categoriaDeseada!,
             userId
           )
           catId = catResult.category.id
       } catch (err) {
           console.error("Error resolviendo categoría para el lote", err)
       }
    }

    // 3. Publish to WP
    let wpUrl = ''
    let wpPostId: number | undefined
    try {
        const postMeta: Record<string, string> = {
            '_keyword_principal': formData.keywordPrincipal,
            '_yoast_wpseo_title': content.titleSEO,
            '_seo_title': content.titleSEO,
            '_yoast_wpseo_metadesc': content.metaDescription,
            '_meta_description': content.metaDescription,
        }

        // ✅ FIX 3: pasar userId → lee credenciales WP del usuario de Firestore
        const wpResult = await createPost({
            title: content.titleSEO,
            content: content.borrador.replace('<article>', '').replace('</article>', ''),
            status: 'publish',
            slug: content.slugSugerido,
            categories: catId ? [catId] : [],
            meta: postMeta
        }, userId)
        wpUrl = wpResult.link
        wpPostId = wpResult.id   // ← guardar para la respuesta
    } catch (wpErr) {
        throw new Error(`Error subiendo a WordPress: ${wpErr instanceof Error ? wpErr.message : 'Desconocido'}`)
    }

    // 4. Save to history
    try {
        const protocol = request.headers.get('x-forwarded-proto') || 'http'
        const host = request.headers.get('host')
        const baseUrl = `${protocol}://${host}`

        const historyPayload = {
            id: generateId(),
            createdAt: new Date().toISOString(),
            type: 'batch',
            status: 'sent',
            formData,
            generatedContent: content,
            wordpressPostUrl: wpUrl,
            categoryName: content.categoriaSugerida || formData.categoriaDeseada || '',
        }

        const histRes = await fetch(`${baseUrl}/api/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(historyPayload)
        })
        if (!histRes.ok) {
            const errBody = await histRes.text()
            console.warn('Historial: respuesta no OK:', histRes.status, errBody)
        }
    } catch (histErr) {
        console.warn('El artículo se publicó pero no se guardó en el historial:', histErr)
    }

    return NextResponse.json({
        success: true,
        postId: wpPostId,   // ← necesario para el auto-interlinking
        postUrl: wpUrl,
        contentGenerated: content
    })

  } catch (error) {
    console.error('Batch Execute API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno ejecutando lote' },
      { status: 500 }
    )
  }
}
