'use client'

import { useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useGSAP, gsap } from '@/lib/animations'

export default function PageTransition({
  children,
}: {
  children: React.ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useGSAP(
    () => {
      // Premium Modern Transition: Blur + Scale + Fade Up
      gsap.from(containerRef.current, {
        opacity: 0,
        y: 24,
        scale: 0.98,
        filter: 'blur(12px)',
        duration: 0.6,
        ease: 'power3.out',
        clearProps: 'all',
      })
    },
    { scope: containerRef, dependencies: [pathname] }
  )

  return (
    <div ref={containerRef} className="will-change-transform">
      {children}
    </div>
  )
}
