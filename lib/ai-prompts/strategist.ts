import { EditorialStrategyInput, ProjectContext } from '@/types/strategy'

function formatProjectContext(projectContext?: ProjectContext) {
  if (!projectContext) return 'No se proporcionó contexto de proyecto.'
  return [
    `- Proyecto: ${projectContext.name}`,
    `- Dominio: ${projectContext.domain}`,
    projectContext.country ? `- País objetivo: ${projectContext.country}` : null,
    projectContext.cms ? `- CMS: ${projectContext.cms}` : null,
    projectContext.primaryGoal ? `- Objetivo principal: ${projectContext.primaryGoal}` : null,
    projectContext.gscSiteUrl ? `- Search Console: ${projectContext.gscSiteUrl}` : null,
    projectContext.wpUrl ? `- WordPress/CMS URL: ${projectContext.wpUrl}` : null,
  ].filter(Boolean).join('\n')
}

export function buildStrategistPrompt(input: EditorialStrategyInput, categories: { id: number, name: string }[], projectContext?: ProjectContext) {
  const catsList = categories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')

  return `
Actúa como estratega SEO senior y arquitecto de contenido.

Debes construir el plan editorial de una pieza de contenido que sea útil, no redundante y alineada con la arquitectura temática del sitio.

Contexto de entrada:
* keyword principal (objetivo): "${input.keyword}"
* país: "${input.country}"
* nicho: "${input.niche}"
* intención sugerida: "${input.intent}"
* categoría sugerida inicial: "${input.suggestedCategory || 'Ninguna'}"
* rama temática: "${input.thematicBranch || 'Generica'}"
* decisión editorial tomada previamente: "${input.editorialDecision || 'CREATE'}"
* contexto de proyecto:
${formatProjectContext(projectContext)}

Contexto del sitio (Evita duplicar esto):
* Posibles contenidos existentes relacionados: ${input.existingRelatedPosts || 'Ninguno detectado'}
* Categorías de WordPress existentes (Usa una de estas IDs o sugiere una nueva):
${catsList || 'No hay categorías existentes.'}
${input.gscData ? `* Datos de Search Console (queries reales): ${input.gscData}` : ''}

Tu tarea:
1. refinar la intención real
2. proponer keywords secundarias semánticas
3. definir la categoría más adecuada (usando una ID existente si aplica, o {isNew:true} si se necesita crear)
4. proponer title SEO
5. proponer meta description
6. proponer slug limpio
7. construir estructura H1, H2 y H3
8. proponer FAQs útiles
9. sugerir entidades, subtemas y ángulos que ayuden a posicionar mejor sin canibalizar
10. sugerir posibles enlaces internos

Reglas:
* evita repetir enfoques ya cubiertos
* no crees estructuras redundantes
* piensa en cobertura temática, claridad y valor real
* prioriza utilidad, intención y diferenciación

Devuelve OBLIGATORIAMENTE UN JSON (NO uses markdown fuera del JSON) con la siguiente estructura exacta:
{
  "refinedIntent": "string",
  "primaryKeyword": "string",
  "secondaryKeywords": ["string"],
  "suggestedCategory": { "id": number | null, "name": "string", "isNew": boolean },
  "thematicBranch": "string",
  "seoTitle": "string",
  "metaDescription": "string",
  "slug": "string",
  "outline": [
    { "label": "string", "type": "H1" | "H2" | "H3", "focus": "string" }
  ],
  "faqs": [
    { "question": "string", "answerSnippet": "string" }
  ],
  "entitiesToCover": ["string"],
  "internalLinkSuggestions": [
    { "url": "string", "anchor": "string", "reason": "string" }
  ],
  "editorialNotes": "string"
}
`
}
