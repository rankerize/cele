import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register globally once
gsap.registerPlugin(useGSAP, ScrollTrigger)

// ─── Global defaults ─────────────────────────────────────────────────────────
gsap.defaults({
  ease: 'power2.out',
  duration: 0.45,
})

// ─── Named eases ─────────────────────────────────────────────────────────────
export const EASES = {
  smooth: 'power2.out',
  bounce: 'back.out(1.4)',
  elastic: 'elastic.out(1, 0.5)',
  sharp: 'expo.out',
} as const

// ─── Duration presets ────────────────────────────────────────────────────────
export const DUR = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.65,
} as const

// ─── Reusable animation presets ──────────────────────────────────────────────

/** Fade + slide up — Option C style */
export function fadeSlideUp(
  targets: gsap.TweenTarget,
  vars?: gsap.TweenVars
) {
  return gsap.from(targets, {
    opacity: 0,
    y: 18,
    duration: DUR.normal,
    ease: EASES.smooth,
    clearProps: 'transform,opacity',
    ...vars,
  })
}

/** Stagger a list of items */
export function staggerFadeUp(
  targets: gsap.TweenTarget,
  stagger = 0.07,
  vars?: gsap.TweenVars
) {
  return gsap.from(targets, {
    opacity: 0,
    y: 22,
    duration: DUR.normal,
    ease: EASES.smooth,
    stagger,
    clearProps: 'transform,opacity',
    ...vars,
  })
}

/** Slide in from left */
export function slideInLeft(
  targets: gsap.TweenTarget,
  vars?: gsap.TweenVars
) {
  return gsap.from(targets, {
    opacity: 0,
    x: -30,
    duration: DUR.slow,
    ease: EASES.sharp,
    clearProps: 'transform,opacity',
    ...vars,
  })
}

/** Scale pop on enter */
export function scalePop(
  targets: gsap.TweenTarget,
  vars?: gsap.TweenVars
) {
  return gsap.from(targets, {
    opacity: 0,
    scale: 0.94,
    duration: DUR.normal,
    ease: EASES.bounce,
    clearProps: 'transform,opacity',
    ...vars,
  })
}

export { gsap, useGSAP }
