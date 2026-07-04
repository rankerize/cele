import type { Metadata } from 'next'
import { IBM_Plex_Sans, DM_Sans, Fragment_Mono } from 'next/font/google'
import './globals.css'

const fontPrimary = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-primary',
  display: 'swap',
})

const fontDisplay = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-display',
  display: 'swap',
})

const fontMono = Fragment_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Cele | Software con IA',
  description: 'Plataforma tipo Lovable, pero especializada en software con IA: automatización, contenido, arquitectura, interlinking y publicación automatizada.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${fontPrimary.variable} ${fontDisplay.variable} ${fontMono.variable}`}>
      <body className="font-sans text-slate-900 bg-surface-50 antialiased">{children}</body>
    </html>
  )
}
