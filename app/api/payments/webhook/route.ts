export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getAdminFirestore } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    if (!topic || !id) {
      // Intentar leer el body
      const body = await req.json().catch(() => null)
      if (!body) return NextResponse.json({ success: true }, { status: 200 })
    }

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
    if (!MP_ACCESS_TOKEN) {
      throw new Error("MP_ACCESS_TOKEN not configured")
    }

    // Sólo procesamos notificaciones de tipo "payment" (las suscripciones también emiten payments cuando se cobran)
    if (topic === 'payment' && id) {
      const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN, options: { timeout: 5000 } })
      const payment = new Payment(client)
      const paymentData = await payment.get({ id })

      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference
        if (userId) {
          const db = getAdminFirestore()
          const creditsRef = db.collection('users').doc(userId).collection('credits').doc('balance')
          
          await db.runTransaction(async (transaction) => {
            const docSnap = await transaction.get(creditsRef)
            let currentBalance = 0
            let wordsGenerated = 0

            if (docSnap.exists) {
              const data = docSnap.data()
              currentBalance = data?.balance ?? 0
              wordsGenerated = data?.wordsGenerated ?? 0
            }

            // Sumar 5000 créditos
            transaction.set(creditsRef, {
              balance: currentBalance + 5000,
              wordsGenerated: wordsGenerated,
              lastUpdated: new Date().toISOString()
            }, { merge: true })
            
            // También podemos marcar al usuario como 'PRO' en el perfil si queríamos.
            const userRef = db.collection('users').doc(userId)
            transaction.set(userRef, { planId: 'pro' }, { merge: true })
          })

          console.log(`[Webhook MP] Pago aprobado. 5000 créditos sumados al usuario ${userId}`)
        }
      }
    }

    // Mercado Pago requiere un status 200 rápido
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error: any) {
    console.error('[MP Webhook Error]:', error)
    // Devolver 200 igual para que MP no siga reintentando infinitamente si es error interno validado
    return NextResponse.json({ success: false, error: error.message }, { status: 200 })
  }
}
