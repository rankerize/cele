export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)

  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { uid, email } = session.user
  
  // Tasa de cambio estática aproximada (1 USD = 3900 COP)
  // El plan cuesta 20 USD = 78,000 COP
  const TRANSACTION_AMOUNT_COP = 78000

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
  if (!MP_ACCESS_TOKEN) {
    console.error("MP_ACCESS_TOKEN no está configurado.")
    return NextResponse.json({ error: 'Configuración de pagos incompleta' }, { status: 500 })
  }

  try {
    // Para suscripciones recurrentes llamamos directamente a la API de Preapproval
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: 'Plan Pro - Rankerize Flow (5000 Créditos)',
        external_reference: uid,
        payer_email: email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: TRANSACTION_AMOUNT_COP,
          currency_id: 'COP'
        },
        back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?mp_status=approved`,
        status: 'pending'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Error Mercado Pago Preapproval:", data)
      throw new Error(data.message || 'Error al crear la suscripción en MP')
    }

    return NextResponse.json({
      success: true,
      init_point: data.init_point
    })

  } catch (error: any) {
    console.error('[MP Subscription Error]:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
