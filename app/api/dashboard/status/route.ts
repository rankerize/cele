export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import fs from 'fs'
import path from 'path'
import { getProjectById } from '@/lib/services/projects'

function readFileConfig(filePath: string): Record<string, string> {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    }
  } catch {}
  return {}
}

function calcHealthScore(
  hasWP: boolean,
  hasGSC: boolean,
  hasAI: boolean,
  cannibCount: number,
  strikingCount: number,
  uncategorizedCount: number
): number {
  let score = 0

  // Integraciones (base: 30 puntos)
  if (hasWP) score += 10
  if (hasGSC) score += 10
  if (hasAI) score += 10

  // Si no hay GSC, el resto no podemos evaluarlo con datos
  if (!hasGSC) return score

  // Posicionamiento (30 puntos base, se resta si hay problemas)
  score += 30
  if (cannibCount > 5) score -= 15
  else if (cannibCount > 2) score -= 8
  else if (cannibCount > 0) score -= 3

  // Oportunidades aprovechadas (20 puntos base)
  score += 20
  if (strikingCount > 15) score -= 5 // Muchas oportunidades desaprovechadas
  else if (strikingCount > 5) score -= 2

  // Arquitectura del contenido (20 puntos base)
  score += 20
  if (uncategorizedCount > 10) score -= 10
  else if (uncategorizedCount > 3) score -= 5
  else if (uncategorizedCount > 0) score -= 2

  return Math.max(0, Math.min(100, score))
}

export async function GET(req: Request) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  let hasWordPress = false
  let hasAI = false
  let hasGSC = false
  let aiProvider = 'gemini'
  let gscSiteUrl = null

  if (projectId) {
    const project = await getProjectById(projectId)
    if (project) {
      hasWordPress = !!project.wpUrl
      hasAI = !!project.aiApiKey
      hasGSC = !!(session.googleTokens?.access_token && project.gscSiteUrl)
      aiProvider = project.aiProvider || 'gemini'
      gscSiteUrl = project.gscSiteUrl as any
    }
  } else {
    // Legacy fallback to local files if no projectId
    const AI_CONFIG_FILE = path.join(process.cwd(), '.ai-config.json')
    const WP_CONFIG_FILE = path.join(process.cwd(), '.wp-config.json')
    
    const wpConfig = readFileConfig(WP_CONFIG_FILE)
    const aiConfig = readFileConfig(AI_CONFIG_FILE)

    hasWordPress = !!(wpConfig.apiUrl || process.env.WORDPRESS_API_URL)
    hasAI = !!(aiConfig.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)
    hasGSC = !!(session.googleTokens?.access_token && session.gscSiteUrl)
    aiProvider = aiConfig.provider || 'gemini'
    gscSiteUrl = session.gscSiteUrl || null
  }

  // Read hasWooCommerce flag from local settings (dev) or treat as false if not set
  let hasEcommerce = false
  try {
    const LOCAL_SETTINGS_FILE = path.join(process.cwd(), '.local-settings.json')
    if (fs.existsSync(LOCAL_SETTINGS_FILE) && session.user?.uid) {
      const localData = JSON.parse(fs.readFileSync(LOCAL_SETTINGS_FILE, 'utf-8'))
      hasEcommerce = localData?.[session.user.uid]?.wordpress?.hasWooCommerce === true
    }
  } catch {}
  // Also check Firestore if available
  if (!hasEcommerce && session.user?.uid) {
    try {
      const { getAdminFirestore } = await import('@/lib/firebase-admin')
      const db = getAdminFirestore()
      const snap = await db.collection('users').doc(session.user.uid).collection('settings').doc('wordpress').get()
      if (snap.exists) hasEcommerce = snap.data()?.hasWooCommerce === true
    } catch {}
  }

  // If GSC connected, fetch quick metrics to compute alerts
  let cannibalizationCount = 0
  let strikingDistanceCount = 0
  let uncategorizedCount = 0

  if (hasGSC) {
    try {
      // We can quickly get the analyze data from our own API handler
      const { getSearchAnalytics, classifyOpportunities } = await import('@/lib/gsc')
      const { buildEditorialMap } = await import('@/lib/cannibalization')

      const today = new Date()
      const end = new Date(today)
      end.setDate(end.getDate() - 3)
      const start = new Date(end)
      start.setDate(start.getDate() - 30)

      const startDate = start.toISOString().split('T')[0]
      const endDate = end.toISOString().split('T')[0]

      const [gscRows, editorialMap] = await Promise.all([
        getSearchAnalytics(session.googleTokens!, session.gscSiteUrl!, startDate, endDate),
        buildEditorialMap(session.user?.uid)
      ])

      const { opportunities, cannibalizations } = classifyOpportunities(gscRows, editorialMap)

      cannibalizationCount = cannibalizations.length
      strikingDistanceCount = opportunities.filter(o => o.type === 'striking_distance').length
      uncategorizedCount = opportunities.filter(o => o.type === 'orphaned').length
    } catch (e) {
      console.warn('Dashboard status: could not fetch GSC data', e)
    }
  }

  const healthScore = calcHealthScore(
    hasWordPress,
    hasGSC,
    hasAI,
    cannibalizationCount,
    strikingDistanceCount,
    uncategorizedCount
  )

  const alerts: Array<{ type: string; count: number; route: string; label: string; severity: 'high' | 'medium' | 'low' }> = []

  if (cannibalizationCount > 0) {
    alerts.push({
      type: 'cannibalization',
      count: cannibalizationCount,
      route: '/dashboard/seo',
      label: `${cannibalizationCount} ${cannibalizationCount === 1 ? 'canibalización' : 'canibalizaciones'} detectada${cannibalizationCount > 1 ? 's' : ''}`,
      severity: 'high'
    })
  }

  if (strikingDistanceCount > 0) {
    alerts.push({
      type: 'striking_distance',
      count: strikingDistanceCount,
      route: '/dashboard/improve',
      label: `${strikingDistanceCount} keyword${strikingDistanceCount > 1 ? 's' : ''} en posición 4-20 sin optimizar`,
      severity: 'medium'
    })
  }

  if (uncategorizedCount > 0) {
    alerts.push({
      type: 'orphaned',
      count: uncategorizedCount,
      route: '/dashboard/create',
      label: `${uncategorizedCount} oportunidad${uncategorizedCount > 1 ? 'es' : ''} de contenido nuevo sin atacar`,
      severity: 'low'
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      integrations: {
        wordpress: hasWordPress,
        gsc: hasGSC,
        ai: hasAI,
        aiProvider,
        gscSiteUrl: gscSiteUrl,
        hasEcommerce,
      },
      healthScore,
      alerts,
    }
  })
}
