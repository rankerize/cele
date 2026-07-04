import { google } from 'googleapis'
import { getOAuth2Client } from './google-auth'
import { GscSite, GscDataRow, GscKeywordOpportunity, GscCannibalizationRisk } from '@/types/gsc'
import { EditorialMapItem } from '@/types/content'
import { SessionData } from './auth'

function getGscClient(sessionTokens: NonNullable<SessionData['googleTokens']>) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials(sessionTokens)
  return google.searchconsole({ version: 'v1', auth: oauth2Client })
}

export async function getGscSites(sessionTokens: NonNullable<SessionData['googleTokens']>): Promise<GscSite[]> {
  const gsc = getGscClient(sessionTokens)
  const response = await gsc.sites.list()
  return (response.data.siteEntry || []) as GscSite[]
}

export async function getSearchAnalytics(
  sessionTokens: NonNullable<SessionData['googleTokens']>,
  siteUrl: string,
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
  dimensions: string[] = ['query', 'page'],
  rowLimit: number = 2000,
  filters?: {dimension: string, expression: string}[] 
): Promise<GscDataRow[]> {
  const gsc = getGscClient(sessionTokens)
  
  const requestBody: any = {
    startDate,
    endDate,
    dimensions,
    rowLimit,
  }

  if (filters && filters.length > 0) {
     requestBody.dimensionFilterGroups = [{
        filters: filters.map(f => ({
           dimension: f.dimension,
           operator: 'contains', // keeping it simple for now
           expression: f.expression
        }))
     }]
  }

  const response = await gsc.searchanalytics.query({
    siteUrl,
    requestBody
  })

  return (response.data.rows || []) as GscDataRow[]
}

export function classifyOpportunities(
  gscRows: GscDataRow[],
  editorialMap: EditorialMapItem[]
): {
  opportunities: GscKeywordOpportunity[]
  cannibalizations: GscCannibalizationRisk[]
} {
  const opportunities: GscKeywordOpportunity[] = []
  
  // Agrupar por query para encontrar canibalizaciones
  const queryMap = new Map<string, GscDataRow[]>()

  for (const row of gscRows) {
    if (!row.keys || row.keys.length < 2) continue
    const query = row.keys[0]
    
    if (!queryMap.has(query)) queryMap.set(query, [])
    queryMap.get(query)!.push(row)
  }

  const cannibalizations: GscCannibalizationRisk[] = []

  for (const [query, rows] of Array.from(queryMap.entries())) {
    // Buscar posts de WP que coincidan con las URLs rankeando
    const mappedRows = rows.map(r => {
      const pageUrl = r.keys[1]
      // Try to find matching post in editorial map by URL or slug
      const matchingPost = editorialMap.find(
        p => p.url === pageUrl || 
             pageUrl.includes(`/${p.slug}/`) || 
             pageUrl.endsWith(`/${p.slug}`)
      )
      return { row: r, matchingPost }
    })

    // Detección de canibalización: más de 1 URL con impresiones consistentes > 10
    const competingRows = mappedRows.filter(m => m.row.impressions > 10)
    
    if (competingRows.length > 1) {
      cannibalizations.push({
        query,
        competingPages: competingRows.map(m => ({
          url: m.row.keys[1],
          clicks: m.row.clicks,
          impressions: m.row.impressions,
          ctr: m.row.ctr,
          position: m.row.position,
          post: m.matchingPost
        })),
        totalImpressions: competingRows.reduce((sum, m) => sum + m.row.impressions, 0)
      })
    }

    // Clasificar filas individuales
    for (const m of mappedRows) {
      const r = m.row
      const pageUrl = r.keys[1]
      let type: GscKeywordOpportunity['type'] = 'ok'
      const reasons: string[] = []

      // Thresholds heurísticos
      if (!m.matchingPost) {
         type = 'orphaned'
         reasons.push('URL indexada en GSC pero sin match directo en WP detectado')
      } else if (r.position >= 4 && r.position <= 20) {
         type = 'striking_distance'
         reasons.push(`Posición ${Math.round(r.position)}. A un paso del Top 3 (striking distance).`)
      } else if (r.impressions > 100 && r.ctr < 0.02) {
         type = 'low_ctr'
         reasons.push(`Alto volumen de impresiones pero sólo ${Math.round(r.ctr * 100)}% CTR.`)
      } else {
         type = 'ok'
         reasons.push('Rendimiento estándar o bueno')
      }

      opportunities.push({
        query,
        page: pageUrl,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
        type,
        reasons,
        postsRelacionados: m.matchingPost ? [m.matchingPost] : undefined
      })
    }
  }

  // Sort opportunities by impressions desc
  opportunities.sort((a, b) => b.impressions - a.impressions)
  cannibalizations.sort((a, b) => b.totalImpressions - a.totalImpressions)

  return { opportunities, cannibalizations }
}
