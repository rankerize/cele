import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/auth'

// ─── Admin Master Config ─────────────────────────────────────────────────────
const ADMIN_EMAIL = 'cesar.jimenez@rankerize.com'

// Prefijos que NUNCA deben ser bloqueados
const ALWAYS_ALLOW = [
  '/_next/',
  '/favicon',
  '/logo',
  '/login',
  '/api/',        // ← Las APIs manejan su propia auth internamente
]

// Rutas exclusivas del admin maestro
const ADMIN_ONLY = ['/dashboard/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect legacy /hub to dashboard
  if (pathname === '/hub') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 1. Bypass inmediato para todo lo que no necesita protección
  if (ALWAYS_ALLOW.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // 2. Solo aplica lógica para rutas /dashboard (protegidas)
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // 3. Leer sesión desde la request
  // IMPORTANTE: En middleware usamos (request, response) — no cookies() de next/headers
  let isLoggedIn = false
  let userUid    = ''
  let userEmail  = ''

  try {
    const tmpRes = NextResponse.next()
    const session = await getIronSession<SessionData>(request, tmpRes, sessionOptions)

    isLoggedIn = session.isLoggedIn === true && !!session.user?.uid
    userUid    = session.user?.uid   ?? ''
    userEmail  = session.user?.email ?? ''

    console.log(`[Middleware] ${pathname} | loggedIn=${isLoggedIn} uid=${userUid.slice(0, 8)} email=${userEmail}`)
  } catch (e) {
    console.warn(`[Middleware] Error reading session on ${pathname}:`, (e as Error).message?.slice(0, 80))
    isLoggedIn = false
  }

  // 4. No autenticado → /login
  if (!isLoggedIn) {
    const from = encodeURIComponent(pathname)
    const loginUrl = new URL(`/login?from=${from}`, request.url)
    console.log(`[Middleware] NOT logged in → redirect to ${loginUrl.pathname}`)
    return NextResponse.redirect(loginUrl)
  }

  // 5. Admin check
  const isMasterAdmin = userEmail === ADMIN_EMAIL

  if (ADMIN_ONLY.some(p => pathname.startsWith(p)) && !isMasterAdmin) {
    console.log(`[Middleware] Non-admin tried ${pathname} → redirect to /dashboard`)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 6. Adjuntar headers de identidad
  const response = NextResponse.next()
  if (isMasterAdmin) {
    response.headers.set('x-is-admin', '1')
    response.headers.set('x-admin-email', ADMIN_EMAIL)
  }
  response.headers.set('x-user-uid', userUid)

  return response
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
