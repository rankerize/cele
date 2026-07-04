export interface ViralHunterInput {
  niche: string       // Ej: "Belleza", "Fitness", "Tecnología"
  country: string     // Ej: "Colombia", "México", "España"
  language: string    // Ej: "es", "en"
}

export interface ViralTerm {
  termino: string
  puntuacionViralidad: number        // 0–100
  razonTendencia: string             // Ej: "Trend de Skinimalism en TikTok"
  plataformaOrigen: string           // Ej: "TikTok", "Google Trends", "Instagram", "YouTube"
  tipoMovimiento: 'Breakout' | 'Creciendo' | 'Pico Viral' | 'Estacional'
  nicho: string
  keywordsSugeridas: string[]        // Keywords SEO derivadas del término viral
  ideaDeContenido: string            // Idea concreta de artículo o video
  urgencia: 'Alta' | 'Media' | 'Baja' // Cuánto tiempo tiene el creador antes de que baje
  paisFoco: string
}

export interface ViralHunterResult {
  terminosVirales: ViralTerm[]
  resumenMercado: string
  mejorOportunidad: string
  timestampAnalisis: string
}

/**
 * buildViralHunterPrompt
 *
 * Genera un prompt reactivo al niche y país del usuario.
 * La IA simulará ser un analista de tendencias experto en Google Trends Breakout,
 * TikTok trends, e Instagram Reels para el mercado latinoamericano/hispano.
 *
 * Un término "Breakout" en Google Trends es aquel que ha crecido más de +5000%
 * en un corto período — indica viralidad real e inminente.
 */
export function buildViralHunterPrompt(input: ViralHunterInput): string {
  const { niche, country, language } = input

  return `
Actúas como un analista de tendencias digitales experto en Google Trends (modo Breakout), TikTok Trends, Instagram Reels y YouTube Shorts para el mercado hispano.

## Tu tarea
Detectar los términos con mayor potencial viral del nicho "${niche}" en el país "${country}" (idioma: ${language}).

Enfócate en términos con comportamiento **Breakout** (crecimiento superior al +5000% en Google Trends reciente) o que estén en fase de explosión en redes sociales. Estos son términos que un creador de contenido debe cubrir AHORA antes de que saturen.

## Contexto del análisis
- **Nicho**: "${niche}"
- **País objetivo**: "${country}"
- **Idioma**: "${language}"
- **Fecha de análisis**: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}

## Reglas de puntuación de viralidad (0–100)
- **90–100**: Breakout real. Aparece en TikTok + Google Trends + Búsquedas masivas. Actuar HOY.
- **70–89**: Creciendo rápido. Ventana de 1–2 semanas antes de saturarse.
- **50–69**: Tendencia establecida pero aún con espacio para entrar.
- **20–49**: Tendencia media. Persiste pero ya hay mucha competencia.
- **0–19**: Bajando. Solo si el sitio ya tiene autoridad en ese término.

## Tipos de movimiento
- **Breakout**: Crecimiento explosivo +5000% desde la semana pasada
- **Creciendo**: Crecimiento sostenido +50–200% en las últimas 4 semanas
- **Pico Viral**: Llegó al máximo, hay 3–5 días antes de que baje
- **Estacional**: Patrón recurrente anual (ej: "regalos navidad" en diciembre)

## Para el nicho "${niche}" en ${country}, detecta específicamente:
${getNicheContextHints(niche)}

## Formato de respuesta
Devuelve ÚNICAMENTE UN JSON VÁLIDO (sin markdown, sin texto adicional) con esta estructura exacta:

{
  "terminosVirales": [
    {
      "termino": "string — el término viral exacto como lo buscaría el usuario",
      "puntuacionViralidad": number (0-100),
      "razonTendencia": "string — causa específica de la viralidad, ej: 'Trend de Skinimalism en TikTok', 'Desafío viral en Instagram Reels', 'Google Trends Breakout +8000% en 7 días'",
      "plataformaOrigen": "string — donde nació: TikTok | Google Trends | Instagram | YouTube | Twitter/X | Pinterest",
      "tipoMovimiento": "Breakout | Creciendo | Pico Viral | Estacional",
      "nicho": "${niche}",
      "keywordsSugeridas": ["string — keyword SEO long-tail derivada del término"],
      "ideaDeContenido": "string — idea concreta de artículo o video, ej: '10 productos de skinimalism que arrasan en TikTok 2025'",
      "urgencia": "Alta | Media | Baja",
      "paisFoco": "${country}"
    }
  ],
  "resumenMercado": "string — análisis de 2-3 frases del momento actual del nicho ${niche} en ${country}",
  "mejorOportunidad": "string — el término con mayor potencial combinado de tráfico + baja competencia + alta urgencia",
  "timestampAnalisis": "${new Date().toISOString()}"
}

Devuelve exactamente 6 términos virales ordenados de mayor a menor puntuaciónViralidad.
`.trim()
}

/**
 * Da contexto específico según el nicho para hacer el prompt más preciso.
 * La IA sabe en qué formatos, comunidades y plataformas buscar.
 */
function getNicheContextHints(niche: string): string {
  const nicheLC = niche.toLowerCase().trim()

  const hints: Record<string, string> = {
    belleza: `
- Busca en TikTok términos con hashtag #skincare, #makeuptutorial, #skintok en español
- Detecta micro-tendencias de skincare como "Skinimalism", "Glass Skin", "Skin Cycling"
- Analiza productos virales de marcas como CeraVe, The Ordinary, Bubble Skincare
- Detecta rutinas virales de K-Beauty adaptadas al mercado latino
- Busca tendencias de maquillaje de temporada (blush placement, editorial makeup, etc)`,

    fitness: `
- Monitorea TikTok FitTok: tendencias de entrenamiento en casa, gym aesthetic, "What I Eat In A Day"
- Detecta dietas virales: Carnivore, 75 Hard, Ayuno Intermitente, Zone Diet
- Busca equipamiento fitness viral: bandas de resistencia, kettlebells, platos de proteína
- Analiza atletas/influencers virales en LatAm que están generando tendencia
- Detecta suplementos que están en pico de búsqueda (creatina, colágeno, proteína)`,

    tecnología: `
- Monitorea lanzamientos de productos Apple, Samsung, Google que generan búsqueda explosiva
- Detecta IA tools virales emergentes en el mercado hispano
- Busca "review de" + productos recientes con Breakout en google
- Analiza términos de videojuegos virales: nuevos lanzamientos, actualizaciones, torneos
- Detecta aplicaciones que están creciendo en downloads en LatAm`,

    gastronomia: `
- Detecta recetas virales de TikTok adaptadas al paladar latino (ejemplo: "Sopa de Tortilla TikTok")
- Busca tendencias food: Birria, Smash Burgers, Espresso Tonic, Iced Coffee regional
- Analiza restaurantes o platillos que están generando buzz en Instagram en el país
- Detecta dietas y estilos alimenticios en auge: vegano, keto, mediterráneo
- Busca ingredientes de temporada que están on-trend`,

    moda: `
- Detecta micro-tendencias de TikTok FashionTok: "quiet luxury", "balletcore", "mob wife aesthetic"
- Busca términos relacionados con marcas de moda accesible viral: Shein, Zara, Primark
- Analiza tendencias de temporada: colores Pantone, estilos de temporada
- Detecta búsquedas de "outfit" + tendencia viral actual
- Monitorea influencers de moda en LatAm y qué están usando`,

    viajes: `
- Detecta destinos Breakout en búsqueda: lugares virales en TikTok Travel
- Busca "turismo de lujo accesible", hostels virales, experiencias únicas
- Analiza temporadas de viaje y picos de búsqueda (Semana Santa, Navidad, vacaciones)
- Detecta aerolíneas o rutas con nuevas ofertas que están generando tráfico
- Monitorea tendencias: "slow travel", "workation", "digital nomad" en español`,

    finanzas: `
- Detecta términos de inversión viral en LatAm: criptos, acciones, ETFs, fondos
- Busca "cómo ganar dinero online" + modalidad viral del momento
- Analiza términos de ahorro en países con inflación alta
- Detecta apps fintech que están creciendo en descargas
- Monitorea términos de educación financiera en auge: "libertad financiera", "FIRE movement"`,

    marketing: `
- Detecta nuevas funciones virales de plataformas: TikTok Shop, Instagram Broadcast, LinkedIn newsletters
- Busca tendencias de IA en marketing: prompts, automatización, herramientas
- Analiza estrategias que están dando resultados virales: UGC, micro-influencers, dark social
- Detecta cambios de algoritmo recientes que están creando oportunidades
- Monitorea términos de email marketing, SEO y paid media en crecimiento`,
  }

  // Buscar coincidencia parcial en el nicho ingresado
  for (const [key, hint] of Object.entries(hints)) {
    if (nicheLC.includes(key) || key.includes(nicheLC)) {
      return hint.trim()
    }
  }

  // Fallback genérico para nichos no mapeados
  return `
- Busca los hashtags más virales relacionados con "${niche}" en TikTok y Instagram en español
- Detecta creadores de contenido en este nicho que están teniendo pico de visibilidad
- Analiza productos o servicios de "${niche}" que están en Breakout en Google Trends España/LatAm
- Identifica eventos, noticias o controversias recientes en "${niche}" que generan búsqueda
- Detecta sub-nichos emergentes dentro de "${niche}" que aún tienen baja competencia`
}
