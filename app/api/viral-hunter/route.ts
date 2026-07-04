export const dynamic = 'force-dynamic'

/**
 * app/api/viral-hunter/route.ts
 *
 * Motor: OpenAI GPT-4o-mini (tarea de análisis rápido)
 * Seguridad: Server-side only — OPENAI_API_KEY nunca llega al cliente.
 * Créditos: Deduce 1 crédito en Firestore tras cada análisis exitoso.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { buildViralHunterPrompt, ViralHunterInput, ViralHunterResult } from '@/lib/ai-prompts/viral-hunter'
import OpenAI from 'openai'

// GPT-4o-mini: suficiente para análisis de tendencias y JSON estructurado
const MODEL = 'gpt-4o-mini'

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no configurada en el servidor.')
  }
  return new OpenAI({ apiKey })
}

async function deductCredit(userId: string): Promise<void> {
  try {
    const { getAdminFirestore } = await import('@/lib/firebase-admin')
    const { FieldValue } = await import('firebase-admin/firestore')
    const db = getAdminFirestore()
    await db.collection('users').doc(userId).set(
      { credits: FieldValue.increment(-1), updatedAt: new Date().toISOString() },
      { merge: true }
    )
  } catch (err) {
    console.warn('[Credits] Error al deducir crédito en viral-hunter:', err)
  }
}

function parseViralResult(text: string): ViralHunterResult {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonString = jsonMatch ? jsonMatch[1] : text.trim()
  try {
    return JSON.parse(jsonString) as ViralHunterResult
  } catch {
    return JSON.parse(text.trim()) as ViralHunterResult
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json() as ViralHunterInput
  const { niche, country, language = 'es' } = body

  if (!niche?.trim() || !country?.trim()) {
    return NextResponse.json(
      { error: 'Los campos "nicho" y "país" son requeridos.' },
      { status: 400 }
    )
  }

  try {
    const openai = getOpenAI()
    const prompt = buildViralHunterPrompt({ niche: niche.trim(), country: country.trim(), language })

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Eres un analista experto en tendencias digitales para el mercado hispanoamericano. Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const text = response.choices[0].message.content || ''
    const parsed = parseViralResult(text)

    if (!parsed.timestampAnalisis) {
      parsed.timestampAnalisis = new Date().toISOString()
    }

    // ✅ Deducir 1 crédito tras respuesta exitosa
    if (session.user?.uid) {
      await deductCredit(session.user.uid)
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[ViralHunter] Error al analizar tendencias:', err)
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al analizar tendencias: ${message}` }, { status: 500 })
  }
}
