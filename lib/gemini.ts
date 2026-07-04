import { GoogleGenerativeAI } from '@google/generative-ai'
import { ContentFormData, GeneratedContent, ImprovementSuggestion, AutoCategorizeResult } from '@/types/content'
import { buildContentPrompt, buildImprovementPrompt, buildAutoCategorizationPrompt } from '@/lib/prompts'
import fs from 'fs'
import path from 'path'

const AI_CONFIG_FILE = path.join(process.cwd(), '.ai-config.json')

function getAIConfig(): { apiKey: string; model: string } {
  try {
    if (fs.existsSync(AI_CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(AI_CONFIG_FILE, 'utf-8'))
      return { 
        apiKey: parsed.apiKey || process.env.GEMINI_API_KEY || '',
        model: parsed.model || 'gemini-1.5-flash'
      }
    }
  } catch {}
  return {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-1.5-flash'
  }
}

function getGeminiClient(): { genAI: GoogleGenerativeAI; modelName: string } {
  const config = getAIConfig()
  if (!config.apiKey) {
    throw new Error('La clave de API de Gemini no está configurada. Ve a Ajustes > Configuración.')
  }
  return {
    genAI: new GoogleGenerativeAI(config.apiKey),
    modelName: config.model
  }
}

export async function generateContentWithGemini(
  formData: ContentFormData
): Promise<GeneratedContent> {
  const { genAI, modelName } = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: modelName })

  const prompt = buildContentPrompt(formData)

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()

  // Extraer JSON del response (puede venir dentro de ```json ... ```)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonString = jsonMatch ? jsonMatch[1] : text.trim()

  try {
    const parsed = JSON.parse(jsonString) as GeneratedContent
    return parsed
  } catch {
    // Intentar parsear directamente si no había codeblock
    try {
      const parsed = JSON.parse(text.trim()) as GeneratedContent
      return parsed
    } catch {
      throw new Error(
        'Gemini devolvió una respuesta que no se pudo parsear como JSON. Respuesta: ' +
          text.substring(0, 200)
      )
    }
  }
}

export async function analyzeContentForImprovement(
  currentContent: string,
  currentTitle: string,
  keyword?: string,
  category?: string
): Promise<ImprovementSuggestion> {
  const { genAI, modelName } = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: modelName })

  const prompt = buildImprovementPrompt(currentContent, currentTitle, keyword, category)
  const result = await model.generateContent(prompt)
  const text = result.response.text()

  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonString = jsonMatch ? jsonMatch[1] : text.trim()

  try {
    return JSON.parse(jsonString) as ImprovementSuggestion
  } catch {
    try {
      return JSON.parse(text.trim()) as ImprovementSuggestion
    } catch {
      throw new Error('No se pudo parsear como JSON la sugerencia de mejora.')
    }
  }
}

export async function autoCategorizeContent(
  posts: { id: number; title: string; excerpt?: string }[],
  existingCategories: string[]
): Promise<AutoCategorizeResult[]> {
  const { genAI, modelName } = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: modelName })

  const prompt = buildAutoCategorizationPrompt(posts, existingCategories)
  const result = await model.generateContent(prompt)
  const text = result.response.text()

  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonString = jsonMatch ? jsonMatch[1] : text.trim()

  try {
    const parsed = JSON.parse(jsonString) as { results: AutoCategorizeResult[] }
    return parsed.results || []
  } catch {
    try {
      const parsed = JSON.parse(text.trim()) as { results: AutoCategorizeResult[] }
      return parsed.results || []
    } catch {
      throw new Error('No se pudo parsear como JSON la sugerencia de auto-categorización.')
    }
  }
}
