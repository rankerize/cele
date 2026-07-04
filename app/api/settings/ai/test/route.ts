export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/auth'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { provider, apiKey, model: reqModel } = await req.json()
    
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Falta la API Key' }, { status: 400 })
    }

    // Controlador de timeout de 20s
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      if (provider === 'gemini') {
        const geminiModel = reqModel || 'gemini-1.5-flash'
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: geminiModel })
        const result = await model.generateContent('Di "ok" en una sola palabra.')
        clearTimeout(timeoutId)
        
        const text = result.response.text()
        if (text) {
          return NextResponse.json({ 
            success: true, 
            message: `Google Gemini conectado correctamente ✓` 
          })
        }
      } else if (provider === 'openai') {
        const openaiModel = reqModel || 'gpt-5.4-nano'
        const openai = new OpenAI({ apiKey })
        const response = await openai.chat.completions.create({
          model: openaiModel,
          messages: [{ role: 'user', content: 'Say "ok" in one word.' }]
        })
        clearTimeout(timeoutId)
        
        if (response.choices[0].message.content) {
          return NextResponse.json({ 
            success: true, 
            message: `OpenAI (ChatGPT) conectado correctamente ✓` 
          })
        }
      }
    } catch (testErr) {
      clearTimeout(timeoutId)
      const msg = testErr instanceof Error ? testErr.message : 'Error desconocido'
      // Error de autenticación específico
      if (msg.includes('API_KEY_INVALID') || msg.includes('401') || msg.includes('invalid')) {
        return NextResponse.json({ 
          success: false, 
          error: 'API Key inválida. Verifica que la copiaste correctamente desde Google AI Studio.' 
        }, { status: 401 })
      }
      return NextResponse.json({ success: false, error: msg }, { status: 500 })
    }

    throw new Error('Respuesta vacía de la IA')
  } catch (error) {
    console.error('Error testing AI:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
