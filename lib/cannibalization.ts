import { getAllPosts, getCategories } from '@/lib/wordpress'
import { EditorialMapItem, ConflictMatch, ConflictAnalysis, ConflictLevel, RecommendedAction } from '@/types/content'

// Helper to calculate Jaccard Similarity between two strings
function getJaccardSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 1
  if (!str1 || !str2) return 0
  
  const tokens1 = new Set(str1.toLowerCase().trim().split(/\s+/))
  const tokens2 = new Set(str2.toLowerCase().trim().split(/\s+/))
  
  if (tokens1.size === 0 && tokens2.size === 0) return 0
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)))
  const union = new Set([...tokens1, ...tokens2])
  
  return intersection.size / union.size
}

export async function buildEditorialMap(userId?: string): Promise<EditorialMapItem[]> {
  const [posts, categories] = await Promise.all([
    getAllPosts('any', userId),
    getCategories(userId)
  ])

  const categoryMap = new Map(categories.map(c => [c.id, c.name]))

  return posts.map(post => {
    const mainCategory = post.categories && post.categories.length > 0
      ? categoryMap.get(post.categories[0]) || 'Sin categoría'
      : 'Sin categoría'

    // Extract keyword if stored in meta, otherwise defaults to empty
    // Fallback: try to guess from title
    const keywordPrincipal = post.meta?.['_keyword_principal'] 
      || post.title.rendered

    return {
      id: post.id,
      title: post.title.rendered,
      slug: post.slug,
      url: post.link,
      status: post.status,
      keywordPrincipal: keywordPrincipal as string,
      categoria: mainCategory,
      // Extracted if meta is present
      intencionBusqueda: post.meta?.['_intencion_busqueda'] || undefined,
    }
  })
}

export async function analyzeConflicts(
  keyword: string,
  title: string,
  slug: string,
  intent?: string,
  category?: string
): Promise<ConflictAnalysis> {
  const map = await buildEditorialMap()
  const matches: ConflictMatch[] = []

  for (const item of map) {
    let score = 0
    const reasons: string[] = []

    // 1. Coincidencia de slug (25%)
    const slugSimilarity = getJaccardSimilarity(slug, item.slug)
    if (slugSimilarity > 0.5) {
       score += slugSimilarity * 25
       reasons.push(`Slug muy similar (${Math.round(slugSimilarity * 100)}% coincidencia)`)
    }

    // 2. Coincidencia de título (25%)
    const titleSimilarity = getJaccardSimilarity(title, item.title)
    if (titleSimilarity > 0.4) {
       score += titleSimilarity * 25
       reasons.push(`Título similar (${Math.round(titleSimilarity * 100)}% coincidencia)`)
    }

    // 3. Coincidencia de keyword (25%)
    const kwSimilarity = getJaccardSimilarity(keyword, item.keywordPrincipal)
    if (kwSimilarity > 0.6) {
       score += kwSimilarity * 25
       reasons.push(`Keyword principal o título muy cercano (${Math.round(kwSimilarity * 100)}% coincidencia)`)
    }

    // 4. Misma categoría + intención (25%)
    if (category && item.categoria && category.toLowerCase() === item.categoria.toLowerCase()) {
      score += 15
      reasons.push('Pertenece a la misma categoría')
      
      if (intent && item.intencionBusqueda && intent.toLowerCase() === item.intencionBusqueda.toLowerCase()) {
         score += 10
         reasons.push('Comparte la misma intención de búsqueda')
      }
    }

    // Cap the score at 100
    score = Math.min(score, 100)

    if (score >= 20) { // Only record significant matches
      matches.push({
        post: item,
        score: Math.round(score),
        reasons
      })
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score)

  // Determine highest overlap
  const highestScore = matches.length > 0 ? matches[0].score : 0
  let level: ConflictLevel = 'bajo'
  if (highestScore >= 60) level = 'alto'
  else if (highestScore >= 30) level = 'medio'

  let recommendedAction: RecommendedAction = 'crear-nuevo'
  if (level === 'alto') {
    recommendedAction = 'actualizar-existente'
  } else if (level === 'medio') {
    recommendedAction = 'revisar-manual'
  }

  return { level, matches: matches.slice(0, 5), recommendedAction } // Return top 5
}
