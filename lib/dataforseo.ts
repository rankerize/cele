/**
 * lib/dataforseo.ts — Cliente DataForSEO para Rankerize Flow
 *
 * SEGURIDAD: Server-side only. Las credenciales NUNCA llegan al cliente.
 * AUTH: Basic Auth (login:password en base64)
 * BASE URL: https://api.dataforseo.com/v3
 *
 * APIs usadas:
 *  - Keywords Data → Google Ads: volumen de búsqueda exacto
 *  - DataForSEO Labs: ideas de keywords, keywords relacionadas
 */

const BASE_URL = 'https://api.dataforseo.com/v3'

// ── Auth client ──────────────────────────────────────────────────────────────
function getAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD

  if (!login || !password) {
    throw new Error(
      'DataForSEO no configurado. Agrega DATAFORSEO_LOGIN y DATAFORSEO_PASSWORD en tus variables de entorno.'
    )
  }

  const encoded = Buffer.from(`${login}:${password}`).toString('base64')
  return `Basic ${encoded}`
}

async function dfsRequest<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`DataForSEO error ${res.status}: ${res.statusText}`)
  }

  const json = await res.json()

  // DataForSEO devuelve errores dentro del cuerpo con status_code
  if (json.status_code && json.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${json.status_message || 'Error desconocido'}`)
  }

  return json as T
}

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface KeywordVolumeResult {
  keyword: string
  searchVolume: number       // búsquedas mensuales exactas
  cpc: number               // costo por clic en Google Ads (USD)
  competition: number       // 0–1 (0=baja, 1=alta)
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  trend: number[]           // 12 meses de volumen histórico
  monthlySearches: { year: number; month: number; searches: number }[]
}

export interface KeywordIdeaResult {
  keyword: string
  searchVolume: number
  cpc: number
  competition: number
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  keywordDifficulty: number  // 0–100 (100 = imposible rankear)
  searchIntent: 'informational' | 'navigational' | 'commercial' | 'transactional' | null
}

// ── 1. Volumen de búsqueda para keywords específicas ─────────────────────────
/**
 * Devuelve volumen exacto, CPC y tendencia para una lista de keywords.
 * Usa: /keywords_data/google_ads/search_volume/live
 * Costo: ~$0.05 por 1,000 keywords
 *
 * @param keywords - lista de keywords a analizar (max 700 por llamada)
 * @param locationCode - código de país (2724=México, 2724=Colombia, 2724=España→2724)
 *   → España: 2724, México: 2484, Colombia: 2170, Argentina: 2032
 * @param languageCode - 'es', 'en', etc.
 */
export async function getKeywordsVolume(
  keywords: string[],
  locationCode = 2724, // España por defecto
  languageCode = 'es'
): Promise<KeywordVolumeResult[]> {
  if (keywords.length === 0) return []

  // DataForSEO acepta hasta 700 keywords por batch — paginar si es necesario
  const batchSize = 700
  const results: KeywordVolumeResult[] = []

  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize)

    const response = await dfsRequest<DataForSEOResponse>('/keywords_data/google_ads/search_volume/live', [
      {
        keywords: batch,
        location_code: locationCode,
        language_code: languageCode,
        include_serp_info: false,
      },
    ])

    const tasks = response.tasks || []
    for (const task of tasks) {
      const items = task.result || []
      for (const item of items) {
        results.push({
          keyword: item.keyword,
          searchVolume: item.search_volume ?? 0,
          cpc: item.cpc ?? 0,
          competition: item.competition ?? 0,
          competitionLevel: mapCompetition(item.competition_level),
          trend: (item.monthly_searches || []).map((m: MonthlySearch) => m.search_volume ?? 0).reverse(),
          monthlySearches: (item.monthly_searches || []).map((m: MonthlySearch) => ({
            year: m.year,
            month: m.month,
            searches: m.search_volume ?? 0,
          })),
        })
      }
    }
  }

  return results
}

// ── 2. Ideas de keywords desde una keyword semilla ───────────────────────────
/**
 * Genera ideas de keywords relacionadas, con volumen y dificultad.
 * Usa: /dataforseo_labs/google/keyword_ideas/live
 * Costo: ~$0.25 por 1,000 keywords devueltas
 *
 * @param seedKeyword - keyword de partida (ej: "mejorar SEO WordPress")
 * @param locationCode - código de país
 * @param languageCode - 'es', 'en'
 * @param limit - número de ideas a devolver (max 1000)
 */
export async function getKeywordIdeas(
  seedKeyword: string,
  locationCode = 2724,
  languageCode = 'es',
  limit = 50
): Promise<KeywordIdeaResult[]> {
  const response = await dfsRequest<DataForSEOResponse>('/dataforseo_labs/google/keyword_ideas/live', [
    {
      keywords: [seedKeyword],
      location_code: locationCode,
      language_code: languageCode,
      limit,
      include_serp_info: false,
      filters: [
        ['search_volume', '>', 10], // Filtra keywords sin volumen relevante
      ],
      order_by: ['keyword_info.search_volume,desc'],
    },
  ])

  const items = response.tasks?.[0]?.result || []

  return items.map((item: DFSKeywordIdeaItem) => ({
    keyword: item.keyword,
    searchVolume: item.keyword_info?.search_volume ?? 0,
    cpc: item.keyword_info?.cpc ?? 0,
    competition: item.keyword_info?.competition ?? 0,
    competitionLevel: mapCompetition(item.keyword_info?.competition_level),
    keywordDifficulty: item.keyword_properties?.keyword_difficulty ?? 0,
    searchIntent: item.search_intent_info?.main_intent ?? null,
  }))
}

// ── 3. Keywords relacionadas para una keyword objetivo ──────────────────────
/**
 * Devuelve las keywords que se usan en las páginas que ya ranquean
 * para la keyword objetivo.
 * Usa: /dataforseo_labs/google/related_keywords/live
 * Costo: ~$0.25 por tarea
 */
export async function getRelatedKeywords(
  keyword: string,
  locationCode = 2724,
  languageCode = 'es',
  limit = 20
): Promise<KeywordIdeaResult[]> {
  const response = await dfsRequest<DataForSEOResponse>('/dataforseo_labs/google/related_keywords/live', [
    {
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      limit,
      depth: 2, // 2 niveles de relacionadas
    },
  ])

  const items = response.tasks?.[0]?.result || []

  return items.map((item: DFSRelatedItem) => ({
    keyword: item.keyword_data?.keyword ?? '',
    searchVolume: item.keyword_data?.keyword_info?.search_volume ?? 0,
    cpc: item.keyword_data?.keyword_info?.cpc ?? 0,
    competition: item.keyword_data?.keyword_info?.competition ?? 0,
    competitionLevel: mapCompetition(item.keyword_data?.keyword_info?.competition_level),
    keywordDifficulty: item.keyword_data?.keyword_properties?.keyword_difficulty ?? 0,
    searchIntent: item.keyword_data?.search_intent_info?.main_intent ?? null,
  }))
}

// ── 4. Mapa de códigos de país usados en Rankerize ──────────────────────────
export const COUNTRY_CODES: Record<string, number> = {
  'España': 2724,
  'Mexico': 2484,
  'México': 2484,
  'Colombia': 2170,
  'Argentina': 2032,
  'Chile': 2152,
  'Peru': 2604,
  'Perú': 2604,
  'Venezuela': 2862,
  'Ecuador': 2218,
  'Estados Unidos': 2840,
  'USA': 2840,
}

export function getLocationCode(country: string): number {
  const code = COUNTRY_CODES[country]
  if (code) return code

  // Búsqueda parcial (case insensitive)
  for (const [key, value] of Object.entries(COUNTRY_CODES)) {
    if (key.toLowerCase().includes(country.toLowerCase()) ||
        country.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  return 2724 // España por defecto
}

// ── Tipos internos de la API ─────────────────────────────────────────────────
interface MonthlySearch {
  year: number
  month: number
  search_volume: number | null
}

interface DFSKeywordIdeaItem {
  keyword: string
  keyword_info?: {
    search_volume?: number
    cpc?: number
    competition?: number
    competition_level?: string | null
  }
  keyword_properties?: {
    keyword_difficulty?: number
  }
  search_intent_info?: {
    main_intent?: 'informational' | 'navigational' | 'commercial' | 'transactional' | null
  }
}

interface DFSRelatedItem {
  keyword_data?: {
    keyword: string
    keyword_info?: {
      search_volume?: number
      cpc?: number
      competition?: number
      competition_level?: string | null
    }
    keyword_properties?: {
      keyword_difficulty?: number
    }
    search_intent_info?: {
      main_intent?: 'informational' | 'navigational' | 'commercial' | 'transactional' | null
    }
  }
}

interface DataForSEOResponse {
  status_code?: number
  status_message?: string
  tasks?: Array<{
    result?: any[]
  }>
}

function mapCompetition(level: string | null | undefined): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (!level) return 'MEDIUM'
  const upper = level.toUpperCase()
  if (upper === 'LOW') return 'LOW'
  if (upper === 'HIGH') return 'HIGH'
  return 'MEDIUM'
}
