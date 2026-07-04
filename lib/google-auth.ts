import { google } from 'googleapis'

function getRedirectUri(requestHost?: string): string {
  // 0. Si recibimos el host dinámico desde la request (la opción más robusta)
  if (requestHost) {
    const proto = requestHost.includes('localhost') ? 'http' : 'https'
    return `${proto}://${requestHost}/api/auth/google/callback`
  }
  // 1. Variable de entorno explícita (siempre tiene prioridad)
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI
  }
  // 2. Detección automática según VERCEL_URL o NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    return `${appUrl}/api/auth/google/callback`
  }
  // 3. Fallback local
  return 'http://localhost:1015/api/auth/google/callback'
}

export function getOAuth2Client(requestHost?: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri(requestHost)
  )
}

// Generates the URL to which the user should be redirected to start the OAuth flow.
// Includes GSC + Analytics + profile scopes so login = GSC authorization in one shot.
export function getGoogleAuthUrl(requestHost?: string, state?: string) {
  const oauth2Client = getOAuth2Client(requestHost)
  
  const scopes = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/webmasters.readonly', // Access to Google Search Console
    'https://www.googleapis.com/auth/analytics.readonly',   // Access to Google Analytics
  ]

  const options: any = {
    access_type: 'offline', // Requires refresh token
    scope: scopes,
    prompt: 'consent', // Force to always get refresh_token
  }

  if (state) {
    options.state = state
  }

  return oauth2Client.generateAuthUrl(options)
}
