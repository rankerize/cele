export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/google-auth'

export async function GET(request: Request) {
  // Cloud Run usa 0.0.0.0:8080 internamente — x-forwarded-host tiene el dominio público
  const host = (request.headers as Headers).get('x-forwarded-host') || (request.headers as Headers).get('host') || 'flow.rankerize.com'
  const proto = (request.headers as Headers).get('x-forwarded-proto') || 'https'
  const base = `${proto}://${host}`

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  try {
    const url = getGoogleAuthUrl(host, projectId || undefined)
    console.log('[Auth/Google] Redirecting to Google OAuth →', url.substring(0, 80))

    // Firebase CDN converts NextResponse.redirect (307) to HTTP 200,
    // which browsers don't follow. Workaround: return a 200 HTML page
    // with a JS redirect that browsers WILL execute.
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=${url}" />
  <title>Redirigiendo a Google...</title>
</head>
<body>
  <script>window.location.replace(${JSON.stringify(url)})</script>
  <p>Redirigiendo... <a href="${url}">Haz clic aquí si no te redirige.</a></p>
</body>
</html>`

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
        'Pragma': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[Auth/Google] Error generando URL de OAuth:', err)
    return NextResponse.redirect(`${base}/login?error=oauth_config`)
  }
}
