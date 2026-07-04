import AdsClient from './AdsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rankerize Ads | Campañas IA Efectivas',
  description: 'Optimizador de Pauta IA. Lanza campañas automáticas desde $50. Creación de estrategia y anuncios de Meta Ads y Google Ads en solo 1 minuto.',
}

export default function AdsPage() {
  return <AdsClient />
}
