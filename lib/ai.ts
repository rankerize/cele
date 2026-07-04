/**
 * lib/ai.ts — Motor de IA Rankerize Flow
 *
 * Provider: OpenAI (GPT-4o / GPT-4o-mini)
 * ─────────────────────────────────────────
 * • GPT-4o-mini → tareas rápidas: Viral Hunter, análisis, categorización, anchors
 * • GPT-4o      → redacción long-form: posts, estrategia, auditoría SEO
 *
 * SEGURIDAD: Este archivo SOLO corre en el servidor (Next.js API Routes / Edge).
 *            La OPENAI_API_KEY jamás llega al cliente.
 *
 * CRÉDITOS: Cada llamada exitosa a OpenAI descuenta 1 crédito en
 *           Firestore → users/{uid}/credits
 */

import OpenAI from 'openai'
import {
  ContentFormData,
  ContentIdea,
  GeneratedContent,
  ImprovementSuggestion,
  AutoCategorizeResult,
  InternalLinkSuggestion,
  BatchPlanItem,
} from '@/types/content'
import { EditorialStrategyInput, EditorialStrategyOutput, WriterInput, WriterOutput, ProjectContext } from '@/types/strategy'
import {
  buildContentPrompt,
  buildIdeasPrompt,
  buildImprovementPrompt,
  buildAutoCategorizationPrompt,
  buildInternalLinkingPrompt,
  buildBatchPlanPrompt,
  buildSeoAuditPrompt,
} from '@/lib/prompts'
import { buildStrategistPrompt } from '@/lib/ai-prompts/strategist'
import { buildWriterPrompt } from '@/lib/ai-prompts/writer'
import {
  buildPrioritizeTargetPrompt,
  buildRecommendSourcesPrompt,
  buildSuggestAnchorsPrompt,
} from '@/lib/ai-prompts/interlinking'
import {
  TargetPageData,
  SourcePageData,
  TargetPrioritizationResult,
  RecommendationResult,
  AnchorSuggestion,
} from '@/types/interlinking'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// ── Modelos ────────────────────────────────────────────────────────────────
/** Tareas rápidas: análisis, categorización, viral hunter, anchors */
const MODEL_FAST = 'gpt-4o-mini'
/** Long-form: redacción de posts, estrategia editorial, auditoría SEO */
const MODEL_SMART = 'gpt-4o'

// ── Cliente OpenAI (server-side singleton) ─────────────────────────────────
function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY no configurada. Agrégala en Firebase Hosting → Environment variables.'
    )
  }
  return new OpenAI({ apiKey })
}

// ── Deducción de créditos ──────────────────────────────────────────────────
/**
 * Descuenta 1 crédito al usuario en Firestore en la subcolección correspondiente.
 * Si el usuario no tiene documento de créditos, lo salta temporalmente.
 * Nunca lanza excepción — fallo silencioso para no bloquear la respuesta.
 */
async function deductCredit(userId?: string): Promise<void> {
  if (!userId) return
  try {
    const db = getAdminFirestore()
    const ref = db.collection('users').doc(userId).collection('credits').doc('balance')
    await ref.set(
      { balance: FieldValue.increment(-1), updatedAt: new Date().toISOString() },
      { merge: true }
    )
  } catch (err) {
    console.warn('[Credits] Error al deducir crédito:', err)
  }
}

// ── Parser de JSON seguro ──────────────────────────────────────────────────
function parseJSON<T>(text: string): T {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonString = jsonMatch ? jsonMatch[1] : text.trim()
  try {
    return JSON.parse(jsonString) as T
  } catch {
    try {
      return JSON.parse(text.trim()) as T
    } catch {
      // Log técnico solo en servidor, nunca exponer al usuario
      console.error('[AI] Error de parseo JSON. Respuesta cruda:', text.substring(0, 300))
      throw new Error('PARSE_ERROR')  // código interno neutro
    }
  }
}

// ── Helper para llamadas OpenAI ────────────────────────────────────────────
async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  model: string
): Promise<string> {
  const openai = getOpenAI()
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })
  return response.choices[0].message.content || ''
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIONES PÚBLICAS DE IA
// ════════════════════════════════════════════════════════════════════════════

// ── 1. Generación de contenido (GPT-4o → long-form) ───────────────────────
export async function generateContent(
  formData: ContentFormData,
  userId?: string,
  projectContext?: ProjectContext
): Promise<GeneratedContent> {
  const prompt = buildContentPrompt(formData, projectContext)
  const text = await callOpenAI(
    'Eres una experta redactora SEO especializada en contenido en español. Responde SOLO con JSON válido.',
    prompt,
    MODEL_SMART
  )
  await deductCredit(userId)
  return parseJSON<GeneratedContent>(text)
}

// ── 2. Mejora de contenido (GPT-4o-mini → análisis) ───────────────────────
export async function analyzeContentForImprovement(
  currentContent: string,
  currentTitle: string,
  keyword?: string,
  category?: string,
  userId?: string
): Promise<ImprovementSuggestion> {
  const prompt = buildImprovementPrompt(currentContent, currentTitle, keyword, category)
  const text = await callOpenAI(
    'Eres un consultor experto en SEO y auditoría de contenidos. Responde SOLO con JSON válido.',
    prompt,
    MODEL_FAST
  )
  await deductCredit(userId)
  return parseJSON<ImprovementSuggestion>(text)
}

// ── 3. Auto-categorización (GPT-4o-mini → análisis rápido) ────────────────
export async function autoCategorizeContent(
  posts: { id: number; title: string; excerpt?: string }[],
  existingCategories: string[],
  userId?: string
): Promise<AutoCategorizeResult[]> {
  const prompt = buildAutoCategorizationPrompt(posts, existingCategories)
  const text = await callOpenAI(
    'Eres un experto en taxonomía SEO y categorización de contenidos. Responde SOLO con JSON válido.',
    prompt,
    MODEL_FAST
  )
  await deductCredit(userId)
  const parsed = parseJSON<{ results: AutoCategorizeResult[] }>(text)
  return parsed.results || []
}

// ── 4. Ideas de contenido (GPT-4o-mini → análisis) ────────────────────────
export async function generateContentIdeas(
  topic: string,
  existingTitles?: string[],
  userId?: string
): Promise<ContentIdea[]> {
  const prompt = buildIdeasPrompt(topic, existingTitles)
  const text = await callOpenAI(
    'Eres un estratega de contenidos SEO experto. Responde SOLO con JSON válido.',
    prompt,
    MODEL_FAST
  )
  await deductCredit(userId)
  const parsed = parseJSON<{ ideas: ContentIdea[] }>(text)
  return parsed.ideas || []
}

// ── 5. Internal links (GPT-4o-mini → análisis semántico) ──────────────────
export async function suggestInternalLinks(
  content: string,
  availablePosts: { title: string; url: string; keywordPrincipal?: string }[],
  userId?: string
): Promise<InternalLinkSuggestion[]> {
  const prompt = buildInternalLinkingPrompt(content, availablePosts)
  const text = await callOpenAI(
    'Eres un experto en SEO On-Page y enlazado interno. Responde SOLO con JSON válido.',
    prompt,
    MODEL_FAST
  )
  await deductCredit(userId)
  const parsed = parseJSON<{ suggestions: InternalLinkSuggestion[] }>(text)
  return parsed.suggestions || []
}

// ── 6. Batch plan (GPT-4o → estrategia) ──────────────────────────────────
export async function generateBatchPlan(
  nicho: string,
  numArticles: number,
  existingKeywords: string[],
  gscQueries: string[],
  userId?: string
): Promise<BatchPlanItem[]> {
  const prompt = buildBatchPlanPrompt(nicho, numArticles, existingKeywords, gscQueries)
  const text = await callOpenAI(
    'Eres un estratega SEO experto. Responde SOLO con JSON válido.',
    prompt,
    MODEL_SMART
  )
  await deductCredit(userId)
  const parsed = parseJSON<{ items: BatchPlanItem[] }>(text)
  return parsed.items || []
}

// ── 7. Estrategia Editorial (GPT-4o → razonamiento complejo) ──────────────
export async function generateEditorialStrategy(
  input: EditorialStrategyInput,
  categories: { id: number; name: string }[],
  userId?: string,
  projectContext?: ProjectContext
): Promise<EditorialStrategyOutput> {
  const prompt = buildStrategistPrompt(input, categories, projectContext)
  const text = await callOpenAI(
    'Eres un Estratega SEO Senior con 10 años de experiencia. Responde SOLO con JSON válido.',
    prompt,
    MODEL_SMART
  )
  await deductCredit(userId)
  return parseJSON<EditorialStrategyOutput>(text)
}

// ── 8. Redacción long-form (GPT-4o → escritura) ───────────────────────────
export async function writeEditorialContent(
  input: WriterInput,
  userId?: string
): Promise<WriterOutput> {
  const prompt = buildWriterPrompt(input)
  const text = await callOpenAI(
    'Eres un Redactor SEO Senior especializado en contenido de alto rendimiento en español. Responde SOLO con JSON válido.',
    prompt,
    MODEL_SMART
  )
  await deductCredit(userId)
  return parseJSON<WriterOutput>(text)
}

// ── 9. Auditoría SEO (GPT-4o → análisis profundo) ─────────────────────────
export async function generateSeoAuditPlan(
  siteUrl: string,
  metrics: {
    totalClicks: number
    topKeywords: Array<{ query: string; clicks: number; position: number }>
    cannibalizationCount: number
    opportunitiesCount: number
  },
  userId?: string
): Promise<import('@/types/gsc').SeoAuditPlan> {
  const prompt = buildSeoAuditPrompt(siteUrl, metrics)
  const text = await callOpenAI(
    'Eres un Consultor SEO Senior especializado en auditorías técnicas y de contenido. Responde SOLO con JSON válido.',
    prompt,
    MODEL_SMART
  )
  await deductCredit(userId)
  return parseJSON<import('@/types/gsc').SeoAuditPlan>(text)
}

// ── 10. Priorizar URL objetivo (GPT-4o-mini → análisis ligero) ─────────────
export async function prioritizeTargetUrl(
  target: TargetPageData,
  userId?: string
): Promise<TargetPrioritizationResult> {
  const prompt = buildPrioritizeTargetPrompt(target)
  const text = await callOpenAI(
    'Eres un estratega SEO Senior especializado en enlazado interno. Responde SOLO con JSON válido.',
    prompt,
    MODEL_FAST
  )
  await deductCredit(userId)
  return parseJSON<TargetPrioritizationResult>(text)
}

// ── 11. Recomendar páginas fuente (GPT-4o-mini → semántica) ────────────────
export async function recommendSourcePages(
  target: TargetPageData,
  sources: SourcePageData[],
  userId?: string
): Promise<RecommendationResult> {
  const prompt = buildRecommendSourcesPrompt(target, sources)
  const text = await callOpenAI(
    'Eres un estratega SEO Senior especializado en enlazado interno. Responde SOLO con JSON válido.',
    prompt,
    MODEL_FAST
  )
  await deductCredit(userId)
  return parseJSON<RecommendationResult>(text)
}

// ── 12. Sugerir anchors (GPT-4o-mini → creativo ligero) ─────────────────
export async function suggestAnchors(
  targetUrl: string,
  targetTitle: string,
  sourceUrl: string,
  sourceTitle: string,
  sourceContent?: string,
  userId?: string
): Promise<AnchorSuggestion> {
  const prompt = buildSuggestAnchorsPrompt(
    targetUrl,
    targetTitle,
    sourceUrl,
    sourceTitle,
    sourceContent
  )
  const text = await callOpenAI(
    'Eres un redactor SEO y experto en Interlinking. Responde SOLO con JSON válido.',
    prompt,
    MODEL_FAST
  )
  await deductCredit(userId)
  return parseJSON<AnchorSuggestion>(text)
}
