export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getOAuth2Client } from '@/lib/google-auth'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'flow.rankerize.com'
  const isLocal = host.includes('localhost')
  const proto = request.headers.get('x-forwarded-proto') || (isLocal ? 'http' : 'https')
  const baseUrl = `${proto}://${host}`

  console.log(`[OAuth Callback] host=${host} proto=${proto}`)

  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_denied`)
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=no_code`)
  }

  try {
    const oauth2Client = getOAuth2Client(host)
    const { tokens } = await oauth2Client.getToken(code)
    console.log('[OAuth Callback] Tokens recibidos ✓')

    oauth2Client.setCredentials(tokens)
    const oauth2 = (await import('googleapis')).google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: profile } = await oauth2.userinfo.get()
    console.log(`[OAuth Callback] Perfil: ${profile.email} uid=${profile.id}`)

    const session = await getIronSession<SessionData>(cookies(), sessionOptions)

    session.isLoggedIn = true
    session.loginAt = new Date().toISOString()
    session.user = {
      uid:         profile.id          ?? '',
      email:       profile.email       ?? null,
      displayName: profile.name        ?? null,
      photoURL:    profile.picture     ?? null,
    }
    session.googleTokens = {
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope:         tokens.scope,
      token_type:    tokens.token_type,
      expiry_date:   tokens.expiry_date,
    }

    await session.save()
    console.log(`[OAuth Callback] Sesión guardada para ${profile.email} ✓`)

    // ── User Provisioning ──────────────────────────────────────────────────
    try {
      const { getAdminFirestore } = await import('@/lib/firebase-admin')
      const db = getAdminFirestore()
      const uid = profile.id ?? ''

      if (uid) {
        const userRef = db.collection('users').doc(uid)
        const userSnap = await userRef.get()

        const userDataToUpdate: any = {
          lastLoginAt: new Date().toISOString()
        }

        // Si Google devuelve un refresh token, lo actualizamos en Firestore para uso offline
        if (tokens.refresh_token) {
          userDataToUpdate.googleRefreshToken = tokens.refresh_token
        }
        
        // Guardar o actualizar el Access Token para operaciones inmediatas
        if (tokens.access_token) {
           userDataToUpdate.googleAccessToken = tokens.access_token
           userDataToUpdate.googleTokenExpiry = tokens.expiry_date
        }

        if (!userSnap.exists) {
          await userRef.set({
            uid,
            email:       profile.email    ?? null,
            displayName: profile.name     ?? null,
            photoURL:    profile.picture  ?? null,
            role:        'user',
            activeModules: ['seo'],
            createdAt:   new Date().toISOString(),
            ...userDataToUpdate
          })
          console.log(`[OAuth Callback] Nuevo usuario creado: ${uid}`)
        } else {
          await userRef.update(userDataToUpdate).catch(() => {})
        }

        // Setup initial credits for new users (solo 50 créditos iniciales)
        const creditRef = userRef.collection('credits').doc('balance')
        const creditSnap = await creditRef.get()
        if (!creditSnap.exists) {
          await creditRef.set({
            balance: 50,
            wordsGenerated: 0,
            updatedAt: new Date().toISOString()
          })
        }
      }
    } catch (provisionErr) {
      console.warn('[OAuth Callback] Provisioning (non-fatal):', (provisionErr as Error).message?.slice(0, 80))
    }

    // Redirigimos a dashboard o dashboard/settings dependiendo si ya tiene GSC o no.
    if (state) {
      console.log(`[OAuth Callback] Redirecting to project: ${state}`)
      return NextResponse.redirect(`${baseUrl}/dashboard/${state}/settings?connected=true`)
    }

    return NextResponse.redirect(`${baseUrl}/dashboard/settings?connected=true`)

  } catch (err) {
    console.error('[OAuth Callback] Error:', err)
    return NextResponse.redirect(`${baseUrl}/login?error=token_exchange`)
  }
}
