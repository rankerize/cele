import { redirect } from 'next/navigation'

export default function AdsDashboardRedirect() {
  // Por ahora redirigiremos a la primera utilidad del módulo Ads
  redirect('/dashboard/ads/creatives')
}
