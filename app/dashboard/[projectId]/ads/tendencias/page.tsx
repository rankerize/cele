import ComingSoonTrends from '@/components/tendencias/ComingSoonTrends'

export const metadata = {
  title: 'Tendencias Ads · Rankerize App',
  description: 'Encuentra contenido viral y formatos de alta conversión.',
}

export default function TendenciasAdsPage() {
  return (
    <ComingSoonTrends
      title="Tendencias Ads 🔥"
      description="El Viral Hunter para Meta Ads y Google está en fase beta. Muy pronto podrás detectar formatos virales en TikTok y Reels, y utilizar la IA para adaptarlos a tu negocio con guiones de alta conversión."
      BadgeText="Fase Beta Cerrada"
    />
  )
}
