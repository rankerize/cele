export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { MercadoPagoConfig, Preference } from 'mercadopago'

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)

  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { uid } = session.user
  
  // Tasa de cambio estática aproximada (1 USD = 3900 COP)
  // El paquete "Recarga Extra" asume $20 USD = 78,000 COP
  const TRANSACTION_AMOUNT_COP = 78000

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
  if (!MP_ACCESS_TOKEN) {
    console.error("MP_ACCESS_TOKEN no está configurado.")
    return NextResponse.json({ error: 'Configuración de pagos incompleta' }, { status: 500 })
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN, options: { timeout: 5000 } })
    const preference = new Preference(client)

    const response = await preference.create({
      body: {
        items: [
          {
            id: 'extra_credits',
            title: 'Recarga Extra (5000 Créditos) - Rankerize Flow',
            quantity: 1,
            unit_price: TRANSACTION_AMOUNT_COP,
            currency_id: 'COP',
          }
        ],
        external_reference: uid,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?mp_status=approved_extra`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?mp_status=failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?mp_status=pending`,
        },
        auto_return: 'approved'
      }
    })

    return NextResponse.json({
      success: true,
      init_point: response.init_point
    })

  } catch (error: any) {
    console.error('[MP Preference Error]:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
