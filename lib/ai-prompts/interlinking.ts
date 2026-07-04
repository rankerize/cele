import { TargetPageData, SourcePageData } from '@/types/interlinking'

export function buildPrioritizeTargetPrompt(target: TargetPageData): string {
  return `Actúa como un estratega SEO senior especializado en arquitectura de enlazado interno.

Tu tarea es analizar si una URL objetivo merece ser reforzada con enlaces internos basados en su rendimiento y contexto.

# URL Objetivo
- URL: ${target.url}
- Título: ${target.title}
- Categoría: ${target.category || 'N/A'}
- Posición Media (GSC): ${target.position.toFixed(1)}
- Impresiones: ${target.impressions}
- Clics: ${target.clicks}
- CTR: ${(target.ctr * 100).toFixed(2)}%

# Reglas
- Recomienda "shouldStrengthen": true SI LA URL TIENE más de 50 impresiones y la posición está entre 4 y 20 (striking distance), o si es "orphaned" (pocos enlaces).
- Asigna un "opportunityLevel" (high/medium/low) según el impacto potencial.
- Justifica tu respuesta en "reasoning" con argumentos editoriales y de datos reales.

Devuelve UNICAMENTE un JSON válido con esta estructura:
{
  "targetUrl": "${target.url}",
  "shouldStrengthen": boolean,
  "opportunityLevel": "high" | "medium" | "low",
  "reasoning": "Explicación detallada"
}`
}

export function buildRecommendSourcesPrompt(
  target: TargetPageData,
  sources: SourcePageData[]
): string {
  const sourcesContext = sources.map(s => `
ID: ${s.id}
URL: ${s.url}
Título: ${s.title}
Categoría: ${s.category || 'N/A'}
Extracto: ${s.excerpt || 'N/A'}`).join('\n')

  return `Actúa como un estratega SEO senior especializado en enlazado interno.

Tienes una URL Objetivo que necesita refuerzo y una lista de posibles páginas fuente.
Debes seleccionar desde cuáles páginas fuente conviene enlazar.

# URL Objetivo
- URL: ${target.url}
- Título: ${target.title}
- Categoría: ${target.category || 'N/A'}

# Páginas Fuente Disponibles:
${sourcesContext}

# Reglas de Selección
- Prioriza fuentes de la misma categoría o alta similitud semántica.
- Descarta fuentes sin relación temática (agrega a "pagesToAvoid").
- Genera advertencias ("warnings") si sospechas riesgo de canibalización.

Devuelve UNICAMENTE un JSON válido con esta estructura:
{
  "recommendedSourcePages": [
    {
      "sourceId": number,
      "sourceUrl": "url de la fuente",
      "sourceTitle": "título",
      "thematicRelation": "Por qué se relacionan",
      "confidence": "high" | "medium" | "low",
      "reason": "Por qué es buena idea enlazar desde aquí",
      "warnings": ["Posible advertencia"]
    }
  ],
  "pagesToAvoid": [
    { "sourceUrl": "url", "reason": "Motivo de descarte" }
  ],
  "generalWarnings": []
}`
}

export function buildSuggestAnchorsPrompt(
  targetUrl: string,
  targetTitle: string,
  sourceUrl: string,
  sourceTitle: string,
  sourceContent?: string
): string {
  return `Actúa como un redactor SEO y experto en Interlinking.

Tu tarea es proponer textos ancla (anchors) naturales para enlazar una página A (Fuente) hacia una página B (Objetivo).

# Página Fuente (A)
- Título: ${sourceTitle}
- URL: ${sourceUrl}

# Página Objetivo (B)
- Título: ${targetTitle}
- URL: ${targetUrl}

# Reglas para Anchors
- Deben ser naturales y no forzados.
- Variados (exact match, partial match, context match).
- Evita el sobre-optimización (no repitas exactamente el titulo siempre).

Devuelve UNICAMENTE un JSON válido con esta estructura:
{
  "recommendedAnchorTexts": ["anchor 1", "anchor 2", "anchor 3"],
  "recommendedPlacement": "Dónde sería ideal incluir el link (ej: 'en la introducción', 'en la sección de conclusiones', etc.)",
  "reason": "Por qué estos anchors funcionan bien"
}`
}
