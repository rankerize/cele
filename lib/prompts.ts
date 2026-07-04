import { ContentFormData } from '@/types/content'
import { ProjectContext } from '@/types/strategy'

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

export function buildContentPrompt(form: ContentFormData, projectContext?: ProjectContext): string {
  return `Eres un experto en SEO y marketing de contenidos. Tu tarea es generar contenido optimizado para SEO en español.

## Datos del contenido a generar

## Contexto de proyecto
${formatProjectContext(projectContext)}

- **Nicho**: ${form.nicho}
- **Keyword principal**: ${form.keywordPrincipal}
- **País / mercado objetivo**: ${form.paisMercado}
- **Intención de búsqueda**: ${form.intencionBusqueda}
- **Tipo de pieza**: ${form.tipoPieza}
- **CTA final**: ${form.ctaFinal}
- **Tono del contenido**: ${form.tono}
- **Longitud aproximada**: ${form.longitudAproximada} palabras
${form.categoriaDeseada ? `- **Categoría deseada**: ${form.categoriaDeseada}` : ''}

## Instrucciones

Genera un response JSON **válido y completo** con exactamente esta estructura. No añadas texto fuera del JSON.

\`\`\`json
{
  "intencionRefinada": "descripción refinada de la intención de búsqueda del usuario",
  "keywordsSecundarias": ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9", "kw10"],
  "titleSEO": "Título SEO optimizado (máx 60 caracteres) con la keyword principal",
  "metaDescription": "Meta descripción (máx 155 caracteres) persuasiva y con la keyword",
  "estructuraH1": "H1 principal del artículo",
  "estructuraH2": ["H2 sección 1", "H2 sección 2", "H2 sección 3", "H2 sección 4", "H2 sección 5"],
  "estructuraH3": ["H3 subsección 1.1", "H3 subsección 1.2", "H3 subsección 2.1", "H3 subsección 2.2"],
  "preguntasFrecuentes": [
    {"pregunta": "Pregunta 1?", "respuesta": "Respuesta detallada 1"},
    {"pregunta": "Pregunta 2?", "respuesta": "Respuesta detallada 2"},
    {"pregunta": "Pregunta 3?", "respuesta": "Respuesta detallada 3"},
    {"pregunta": "Pregunta 4?", "respuesta": "Respuesta detallada 4"},
    {"pregunta": "Pregunta 5?", "respuesta": "Respuesta detallada 5"}
  ],
  "borrador": "<article>HTML limpio y bien estructurado del artículo completo en español. Usa etiquetas h1, h2, h3, p, ul, li, strong. Incluye el CTA al final. Mínimo ${form.longitudAproximada} palabras.</article>",
  "slugSugerido": "slug-url-amigable-con-keyword",
  "categoriaSugerida": "${form.categoriaDeseada || 'categoría sugerida basada en el nicho'}",
  "fuentes": ["URL o nombre de fuente confiable 1", "URL o nombre de fuente confiable 2", "URL o nombre de fuente confiable 3"]
}
\`\`\`

Genera contenido de alta calidad, natural y listo para publicar.`
}

export function buildImprovementPrompt(
  currentContent: string,
  currentTitle: string,
  keyword?: string,
  category?: string
): string {
  return `Eres un experto consultor Senior en SEO y Arquitectura de Contenidos. Tu tarea es realizar una auditoría profunda de un artículo existente y transformarlo en una versión maestra optimizada.

## Datos del contenido actual
- **Título Actual**: ${currentTitle}
${keyword ? `- **Keyword Principal**: ${keyword}` : ''}
${category ? `- **Categoría WP**: ${category}` : ''}

- **Contenido actual (fragmento/completo)**: 
${currentContent.substring(0, 15000)}

## Objetivos del Proceso:
1. **Keyword Research**: Identificar keywords LSI y entidades relacionadas que falten.
2. **SEO Técnico**: Mejorar la estructura de encabezados (H1, H2, H3) y marcado semántico.
3. **Engagement**: Hacer el contenido más legible, persuasivo y valioso.
4. **Meta-Data**: Crear títulos SEO y descripciones que disparen el CTR.

## Instrucciones de Respuesta:
Devuelve un JSON estrictamente con la siguiente estructura (sin texto extra):

\`\`\`json
{
  "analisisSEO": "Análisis exhaustivo de debilidades (máx 60 palabras). Menciona canibalización, intención de búsqueda y lagunas de contenido.",
  "sugerenciasTitulo": ["3 opciones de títulos H1 optimizados"],
  "sugerenciasContenido": ["3 acciones clave que has aplicado en el nuevo contenido"],
  "nuevasKeywords": ["Lista de 5-8 keywords LSI integradas"],
  "faqsRecomendadas": [
    {"pregunta": "Pregunta FAQ?", "respuesta": "Respuesta optimizada"}
  ],
  "improvedTitle": "El mejor Título H1 sugerido",
  "improvedContent": "HTML COMPLETO Y REESCRITO DEL ARTÍCULO. Debe incluir H2, H3, negritas, listas y ser semánticamente rico. Mantén el valor original pero elévalo a nivel experto.",
  "improvedSeoTitle": "Título SEO (Title Tag) optimizado (máx 60 car.)",
  "improvedMetaDescription": "Meta descripción persuasiva con la keyword (máx 155 car.)",
  "improvedSlug": "url-amigable-optimizada",
  "scoreSEO": 85 (un número del 1 al 100 evaluando la versión anterior vs esta)
}
\`\`\`
Solo devuelve el JSON.`
}

export function buildAutoCategorizationPrompt(
  posts: { id: number; title: string; excerpt?: string }[],
  existingCategories: string[]
): string {
  return `Eres un experto en taxonomía SEO. Tu tarea es analizar una lista de artículos de blog (actualmente sin categoría) y asignarles la categoría más adecuada para organizar el contenido.

## Categorías existentes en el sitio:
${existingCategories.length > 0 ? existingCategories.map(c => `- ${c}`).join('\n') : "Ninguna (deberás proponer todas nuevas)"}

## Atrículos a categorizar:
${posts.map(p => `ID: ${p.id} | Título: ${p.title}`).join('\n')}

## Instrucciones
Analiza cada artículo. Si una "Categoría existente" encaja perfectamente con el tema del artículo, asígnala (isNewCategory: false).
Si ninguna categoría existente encaja, propón una NUEVA categoría corta y descriptiva (isNewCategory: true).

Devuelve un JSON estrictamente con este formato:
\`\`\`json
{
  "results": [
    {
      "postId": 123,
      "proposedCategory": "Nombre de la Categoría",
      "isNewCategory": true_o_false,
      "reason": "Breve justificación de la decisión"
    }
  ]
}
\`\`\`
Solo devuelve el JSON sin formato adicional.`
}

export function buildIdeasPrompt(topic: string, existingTitles?: string[]): string {
  return `Eres un estratega de contenidos SEO experto. Tu tarea es generar ideas de contenido que complementen el tema indicado pero que eviten la canibalización de keywords.

## Tema base / Keyword principal:
${topic}

${existingTitles && existingTitles.length > 0 ? `## Títulos que ya existen (EVITAR):
${existingTitles.map(t => `- ${t}`).join('\n')}
` : ''}

## Instrucciones estratégicas:
1. Genera **mínimo 5 ideas** de artículos únicas.
2. Cada idea debe atacar una **keyword long-tail** relacionada pero diferente al tema base.
3. No deben competir entre sí ni con el tema base por la misma intención de búsqueda.
4. El ángulo debe ser específico (ej: Guía para principiantes, Errores comunes, Comparativa técnica, Caso de éxito).

Devuelve un JSON con este formato:
\`\`\`json
{
  "ideas": [
    {
      "title": "Título sugerido del artículo",
      "keyword": "Keyword long-tail principal",
      "description": "Breve descripción de qué tratará (máx 20 palabras)",
      "angle": "Tipo de ángulo (ej: Educativo, Inspirador, etc.)",
      "longTails": ["keyword relacionada 1", "keyword relacionada 2", "keyword relacionada 3", "keyword relacionada 4"]
    }
  ]
}
\`\`\`
Solo devuelve el JSON sin formato adicional.`
}

export function buildInternalLinkingPrompt(
  content: string,
  availablePosts: { title: string; url: string; keywordPrincipal?: string }[]
): string {
  return `Eres un experto en SEO On-Page. Tu tarea es analizar un artículo y sugerir CINCO (5) inserciones de enlaces internos naturales hacia posts existentes de la web.

## Posts disponibles para enlazar:
${availablePosts.map(p => `- Título: "${p.title}" | URL: ${p.url} | Contexto: ${p.keywordPrincipal || 'N/A'}`).join('\n')}

## Contenido del artículo actual (HTML):
${content.substring(0, 15000)}

## Instrucciones Críticas:
1. Identifica un fragmento de texto (anchor text) en el contenido actual que tenga una relación semántica alta con uno de los posts disponibles.
2. El anchor text debe ser natural (pueden ser 2-5 palabras).
3. No sugieras enlaces hacia URL que ya estén enlazadas en el texto.
4. Devuelve exactamente este formato JSON.

\`\`\`json
{
  "suggestions": [
    {
      "anchorText": "frase exacta en el texto original",
      "suggestedUrl": "url_seleccionada_del_post",
      "postTitle": "título del post enlazado",
      "reason": "Por qué este enlace es relevante"
    }
  ]
}
\`\`\`
Solo devuelve el JSON.`
}

export function buildBatchPlanPrompt(
  nicho: string,
  numArticles: number,
  existingKeywords: string[],
  gscQueries: string[]
): string {
  const existingList = existingKeywords.length > 0 
    ? `\n## Keywords existentes en WordPress (NO REPETIR):\n${existingKeywords.map(k => `- ${k}`).join('\n')}`
    : ''

  const gscList = gscQueries.length > 0
    ? `\n## Queries que ya posicionan en Google Search Console (EVITAR CANIBALIZACIÓN):\n${gscQueries.slice(0, 100).map(q => `- ${q}`).join('\n')}`
    : ''

  return `Eres un estratega SEO experto encargado de planificar un cluster de contenido (lote de artículos).
Tu tarea es generar un plan de exactamente ${numArticles} artículos para el nicho: "${nicho}".

REGLA DE ORO AUTOMÁTICA (ANTI-CANIBALIZACIÓN):
Ningún artículo propuesto debe apuntar a la misma intención de búsqueda que otro artículo en el lote ni a las keywords que ya existen en la web.
${existingList}${gscList}

## Instrucciones estratégicas:
1. Genera exactamente ${numArticles} artículos relacionados al nicho.
2. Cada artículo debe tener una 'keyword' principal única y bien definida.
3. El 'angle' (ángulo estratégico) debe diferenciar por qué este artículo merece existir por separado.
4. Escoge la 'intencionBusqueda' adecuada: informativa, comercial, comparativa o transaccional.
5. Asigna una 'categoriaDeseada' lógica.
6. Analiza si la keyword sugerida tiene algún riesgo de canibalización con las keywords o queries existentes listadas arriba.
   - Si no hay riesgo, 'gscConflict' es false.
   - Si hay un ligero riesgo pero el ángulo es distinto, explica en 'gscConflictReason' por qué es seguro, pero mantén 'gscConflict' en false a menos que sea un riesgo alto directo. Si la keyword es casi idéntica a una query de GSC, cambia tu propuesta a otra keyword.

Devuelve un JSON estrictamente con este formato:
\`\`\`json
{
  "items": [
    {
      "keyword": "La keyword principal del artículo",
      "title": "Un título SEO atractivo (H1)",
      "angle": "El ángulo único del contenido (ej. Guía paso a paso, Comparativa, Conceptos básicos)",
      "intencionBusqueda": "informativa | comercial | comparativa | transaccional",
      "categoriaDeseada": "Categoría propuesta",
      "gscConflict": false,
      "gscConflictReason": "Opcional: Explicación de por qué se eligió esta keyword relacionada sin canibalizar"
    }
  ]
}
\`\`\`
Solo devuelve el JSON sin formato adicional.`
}

export function buildSeoAuditPrompt(
  siteUrl: string,
  metrics: {
    totalClicks: number
    topKeywords: Array<{ query: string, clicks: number, position: number }>
    cannibalizationCount: number
    opportunitiesCount: number
  }
): string {
  return `Eres un Consultor SEO Senior y Estratega de Marketing Digital. Tu tarea es realizar una auditoría ejecutiva y proponer un plan de acción de 30 días para un sitio web basándote en un resumen de su salud orgánica (datos de Google Search Console).

## Datos del sitio
- **Sitio Web**: ${siteUrl}
- **Clics Totales (últ. 30 días aprox.)**: ${metrics.totalClicks}
- **Top Keywords**: ${metrics.topKeywords.map(k => `${k.query} (Clics: ${k.clicks}, Pos: ${Math.round(k.position)})`).join(', ')}
- **Riesgos de Canibalización Detectados**: ${metrics.cannibalizationCount}
- **Oportunidades de Contenido Detectadas**: ${metrics.opportunitiesCount}

## Instrucciones Críticas
1. **On-Page SEO**: Evalúa la salud del sitio basándote en los problemas típicos identificados. Considera las canibalizaciones orgánicas y su impacto técnico en el sitio.
2. **Off-Page SEO**: Dado que no tenemos datos de backlinks de herramientas como Ahrefs, basa el diagnóstico off-page en la huella de marca. ¿Hay búsquedas de palabras clave "brand" (de marca/sitio)? Si las Top Keywords son genéricas sin marca, sugiere estrategias de construcción de autoridad (link building, citaciones, PR digital).
3. **Plan de Acción a 30 días**: Crea un roadmap paso a paso de tareas críticas basadas en las oportunidades y riesgos (ej: resolver las ${metrics.cannibalizationCount} canibalizaciones, atacar las ${metrics.opportunitiesCount} oportunidades long-tail).

Devuelve exactamente este formato JSON:
\`\`\`json
{
  "onPage": {
    "score": 75,
    "diagnosis": "Un diagnóstico ejecutivo de 2 o 3 oraciones sobre el SEO técnico y calidad del contenido.",
    "recommendations": ["Recomendación 1 accionable", "Recomendación 2 accionable", "Recomendación 3 accionable"]
  },
  "offPage": {
    "score": 60,
    "brandAuthority": "Evaluación breve de la autoridad de marca (presencia de brand keywords vs non-brand keywords).",
    "diagnosis": "Diagnóstico de la autoridad del dominio y señales de popularidad.",
    "recommendations": ["Recomendación de Link Building estratégica", "Recomendación de PR o citaciones", "Estrategia social o de EEAT"]
  },
  "actionPlan": [
    {
       "week": "Semana 1",
       "title": "Auditoría Técnica y Canibalización",
       "tasks": ["Resolver ${metrics.cannibalizationCount} riesgos de canibalización apuntando URLs competitivas.", "Hacer X tarea crítica."]
    },
    {
       "week": "Semana 2",
       "title": "Quick Wins y Oportunidades",
       "tasks": ["Atacar las ${metrics.opportunitiesCount} oportunidades", "Mejorar CTR de X"]
    },
    {
       "week": "Semana 3",
       "title": "Creación de Nuevo Contenido",
       "tasks": ["Diseñar cluster de contenidos de apoyo", "Publicar artículos long-tail"]
    },
    {
       "week": "Semana 4",
       "title": "Autoridad Off-Page",
       "tasks": ["Campaña de Link Building inicial", "Mejora de perfiles sociales"]
    }
  ]
}
\`\`\`
Solo devuelve el JSON sin formato adicional ni markdown extra.`
}
