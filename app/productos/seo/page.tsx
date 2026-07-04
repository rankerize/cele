import { Metadata } from 'next'
import SeoClient from './SeoClient'

export const metadata: Metadata = {
  title: 'Rankerize SEO & GEO | Piloto Automático Orgánico y SGE',
  description: 'Automatiza tu estrategia de contenidos para Google Tradicional y AI-Search (Generative Engine Optimization).',
}

export default function SeoProductPage() {
  return <SeoClient />
}
