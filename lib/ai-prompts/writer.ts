import { WriterInput, ProjectContext } from '@/types/strategy'

function formatProjectContext(projectContext?: ProjectContext) {
  if (!projectContext) return 'No se proporcionó contexto de proyecto.'
  return [
    `- Proyecto: ${projectContext.name}`,
    `- Dominio: ${projectContext.domain}`,
    projectContext.country ? `- País objetivo: ${projectContext.country}` : null,
    projectContext.cms ? `- CMS: ${projectContext.cms}` : null,
    projectContext.primaryGoal ? `- Objetivo principal: ${projectContext.primaryGoal}` : null,
  ].filter(Boolean).join('\n')
}

export function buildWriterPrompt({ strategy, tone = 'profesional pero accesible', projectContext }: WriterInput) {
  return `
Actúa como redactor SEO senior.

Redacta un artículo en HTML limpio con base en la estrategia editorial que se detalla a continuación.

Estrategia Editorial a seguir:
- Título SEO: "${strategy.seoTitle}"
- Keyword principal: "${strategy.primaryKeyword}"
- Intención a cubrir: "${strategy.refinedIntent}"
- Entidades a incluir obligatoriamente: ${strategy.entitiesToCover.join(', ')}
- Contexto de proyecto:
${formatProjectContext(projectContext)}

Estructura requerida (Usa estas etiquetas exactas):
${strategy.outline.map(o => `<${o.type}> ${o.label} (Enfoque: ${o.focus})`).join('\n')}

${strategy.faqs.length > 0 ? `FAQs a responder:\n${strategy.faqs.map(f => `- ${f.question} (Respuesta base: ${f.answerSnippet})`).join('\n')}` : ''}

Objetivo:
Crear una pieza útil, clara, escaneable, bien estructurada y alineada con la intención de búsqueda, evitando redundancia, relleno y repeticiones innecesarias.

Debes:
* mantener un tono ${tone}
* respetar la keyword principal sin sobreoptimizar
* integrar keywords secundarias de forma natural (${strategy.secondaryKeywords.join(', ')})
* responder dudas reales del usuario
* construir subtítulos útiles
* mantener coherencia con la categoría y rama temática
* facilitar futuros enlaces internos
* cerrar con una conclusión y CTA claros

Requisitos Técnicos:
* HTML limpio (solo usa h2, h3, p, ul, li, strong, a). NO uses h1 en el cuerpo.
* introducción clara
* desarrollo profundo pero concreto
* sección FAQ si fue incluida en la estrategia
* sin tono robótico
* sin frases vacías
* sin contenido genérico

Devuelve OBLIGATORIAMENTE UN JSON (NO uses markdown fuera del JSON) con esta estructura:
{
  "title": "El título final (sin comillas dobles internas)",
  "metaDescription": "Una meta description atractiva (max 155 cars)",
  "slug": "slug-limpio-sin-stopwords",
  "excerpt": "Un breve resumen para WordPress",
  "htmlContent": "Todo el HTML generado, minificado o usando secuencias de escape válidas",
  "finalCategory": "${strategy.suggestedCategory.name}",
  "faqSection": ${strategy.faqs.length > 0 ? 'true' : 'false'},
  "cta": "Llamado a la acción final"
}
`
}
