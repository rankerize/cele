export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'

/**
 * POST /api/wordpress/test-connection
 * Prueba las credenciales pasadas en el body SIN guardarlas.
 * Esto permite testear ANTES de guardar, mejorando el UX.
 */
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  const { apiUrl, username, appPassword } = await req.json()

  if (!apiUrl || !username || !appPassword) {
    return NextResponse.json({
      success: false,
      error: 'Completa los 3 campos antes de probar la conexión.',
    }, { status: 400 })
  }

  try {
    // Normalizamos la URL por si el usuario no puso el endpoint completo
    const baseUrl = apiUrl.includes('/wp-json/wp/v2')
      ? apiUrl
      : `${apiUrl.replace(/\/$/, '')}/wp-json/wp/v2`

    const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64')

    const response = await fetch(`${baseUrl}/categories?per_page=5`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 segundos timeout
    })

    if (response.ok) {
      const data = await response.json()
      const count = Array.isArray(data) ? data.length : 0

      // Auto-detectar WooCommerce en el mismo request
      let hasWooCommerce = false
      try {
        const wcBase = baseUrl.replace('/wp-json/wp/v2', '')
        const wcRes = await fetch(`${wcBase}/wp-json/wc/v3`, {
          headers: { Authorization: `Basic ${credentials}` },
          signal: AbortSignal.timeout(5000),
        })
        hasWooCommerce = wcRes.ok || wcRes.status === 401 // 401 = WC existe pero le faltan permisos
      } catch { /* WooCommerce no instalado, silenciar */ }

      return NextResponse.json({
        success: true,
        message: `Conexión perfecta. Se detectaron ${count} categorías en tu WordPress.`,
        categoriesFound: count,
        normalizedUrl: baseUrl,
        hasWooCommerce,
      })
    }

    if (response.status === 401) {
      return NextResponse.json({
        success: false,
        error: 'Credenciales incorrectas (401). Verifica tu usuario y la Contraseña de Aplicación.',
        hint: 'La App Password se genera en: WordPress → Usuarios → Tu perfil → Contraseñas de aplicación',
      })
    }

    if (response.status === 403) {
      return NextResponse.json({
        success: false,
        error: 'Acceso denegado (403). La API REST de WordPress puede estar desactivada o bloqueada.',
        hint: 'Verifica que la API REST esté habilitada en tu hosting o plugin de seguridad.',
      })
    }

    return NextResponse.json({
      success: false,
      error: `Error del servidor WordPress: ${response.status} ${response.statusText}`,
      hint: 'Revisa que la URL sea correcta y que la API REST de WordPress esté activa.',
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'

    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({
        success: false,
        error: 'Tiempo de espera agotado. WordPress no respondió en 10 segundos.',
        hint: 'Verifica que la URL sea correcta y que el sitio esté en línea.',
      })
    }

    if (msg.includes('ENOTFOUND') || msg.includes('fetch failed')) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo encontrar el servidor WordPress. Revisa la URL.',
        hint: 'Asegúrate de incluir https:// y que el dominio sea correcto.',
      })
    }

    return NextResponse.json({
      success: false,
      error: `Error de conexión: ${msg}`,
      hint: 'Verifica que WordPress esté en línea y la URL sea correcta.',
    })
  }
}
