import { SessionOptions } from 'iron-session'

export interface SessionData {
  isLoggedIn: boolean
  loginAt?: string
  googleTokens?: {
    access_token?: string | null
    refresh_token?: string | null
    scope?: string
    token_type?: string | null
    expiry_date?: number | null
  }
  gscSiteUrl?: string
  gaPropertyId?: string
  user?: {
    uid: string
    email: string | null
    displayName: string | null
    photoURL: string | null
  }
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'fallback-secret-change-in-production-32chars!!',
  cookieName: '__session',
  cookieOptions: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24,  // 24 horas
    path:     '/',            // disponible en toda la app
  },
}

export function verifyPassword(inputPassword: string): boolean {
  const correctPassword = process.env.DASHBOARD_PASSWORD
  if (!correctPassword) {
    console.warn('DASHBOARD_PASSWORD no está configurada.')
    return false
  }
  return inputPassword === correctPassword
}
