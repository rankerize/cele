import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Demo pública: keep the experience frictionless and avoid auth-only routes.
  if (pathname === '/hub') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // In demo mode, let everything else render normally.
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Aplica el middleware a todo EXCEPTO:
     * - Archivos estáticos de Next.js (_next/static, _next/image)
     * - Imágenes, iconos y assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.ico|.*\\.woff2?).*)',
  ],
}
