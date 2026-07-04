/**
 * lib/woocommerce-ai.ts
 * Prompts e integración IA para el módulo ecommerce-engine.
 * Genera optimizaciones SEO de productos WooCommerce usando el mismo
 * proveedor configurado en lib/ai.ts (Gemini / OpenAI).
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { WCProduct, WCUpdateProductPayload } from '@/types/woocommerce'

// Reutilizamos el mismo helper de config que lib/ai.ts
type AIProvider = 'gemini' | 'openai'
interface AIConfig { provider: AIProvider; apiKey: string; model?: string }

async function getAIConfig(userId?: string): Promise<AIConfig> {
  if (userId) {
    try {
      const { getAdminFirestore } = await import('@/lib/firebase-admin')
      const db = getAdminFirestore()
      const snap = await db.collection('users').doc(userId).collection('settings').doc('ai').get()
      if (snap.exists) {
        const data = snap.data()!
        if (data.apiKey) {
          return { provider: (data.provider as AIProvider) || 'gemini', apiKey: data.apiKey, model: data.model }
        }
      }
    } catch (e) {
      console.warn('Firestore AI config read failed:', e)
    }
  }
  const provider: AIProvider = (process.env.AI_PROVIDER as AIProvider) || 'gemini'
  const apiKey = provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Configuración de IA incompleta.')
  return { provider, apiKey }
}

function parseJSON<T>(text: string): T {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonString = jsonMatch ? jsonMatch[1] : text.trim()
  try { return JSON.parse(jsonString) as T }
  catch { return JSON.parse(text.trim()) as T }
}

/** Builds the optimization prompt for an e-commerce product */
function buildProductOptimizationPrompt(product: WCProduct): string {
  const imagesList = product.images
    .map((img) => `  - id: ${img.id}, src: ${img.src}, alt actual: "${img.alt || '(vacío)'}"`)
    .join('\n')

  return `Eres un experto en SEO para tiendas WooCommerce. Debes optimizar los metadatos de este producto para mejorar su posicionamiento en buscadores.

## Producto actual
- **ID**: ${product.id}
- **Nombre actual**: ${product.name}
- **Descripción corta**: ${product.short_description || '(vacía)'}
- **Descripción larga**: ${product.description ? product.description.substring(0, 400) + '…' : '(vacía)'}
- **SKU**: ${product.sku || 'N/A'}
- **Imágenes** (${product.images.length}):
${imagesList || '  (sin imágenes)'}

## Tu tarea
Devuelve ÚNICAMENTE un JSON válido con esta estructura:
\`\`\`json
{
  "name": "Nombre SEO optimizado del producto",
  "short_description": "Descripción corta optimizada (máx 160 caracteres, incluye keyword principal)",
  "description": "Descripción larga optimizada en HTML básico con párrafos y listas de características",
  "images": [
    { "id": <número>, "alt": "Texto ALT descriptivo y optimizado para SEO" }
  ]
}
\`\`\`

Reglas:
1. El nombre debe incluir la keyword principal y ser descriptivo.
2. Cada texto ALT debe describir la imagen específica y referenciar el producto.
3. Si el producto no tiene imágenes, devuelve "images": [].
4. No inventes datos que no puedas inferir del nombre/descripción actual.
5. Responde SOLO el JSON, sin explicaciones adicionales.`
}

/**
 * Llama a la IA configurada y devuelve el payload de actualización para WooCommerce.
 */
export async function generateProductOptimization(
  product: WCProduct,
  userId?: string
): Promise<WCUpdateProductPayload> {
  const { provider, apiKey, model: configModel } = await getAIConfig(userId)
  const prompt = buildProductOptimizationPrompt(product)

  interface AIOptimizationResponse {
    name?: string
    short_description?: string
    description?: string
    images?: { id: number; alt: string }[]
  }

  let parsed: AIOptimizationResponse

  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: configModel || 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    parsed = parseJSON<AIOptimizationResponse>(result.response.text())
  } else {
    const openai = new OpenAI({ apiKey })
    const response = await openai.chat.completions.create({
      model: configModel || 'gpt-4o',
      messages: [
        { role: 'system', content: 'Eres un experto en SEO para tiendas WooCommerce.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    })
    parsed = JSON.parse(response.choices[0].message.content || '{}') as AIOptimizationResponse
  }

  return {
    name: parsed.name,
    description: parsed.description,
    short_description: parsed.short_description,
    images: parsed.images?.map((img) => ({ id: img.id, alt: img.alt })),
  }
}
