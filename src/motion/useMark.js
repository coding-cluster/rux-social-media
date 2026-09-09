import { gsap, prefersReducedMotion } from './index'

export function useMark(el) {
  return function play(active) {
    const node = el.value ?? el
    if (!node) return

    if (prefersReducedMotion()) {
      gsap.set(node, { scale: active ? 1 : 0 })
      return
    }

    if (active) gsap.fromTo(node, { scale: 0 }, { scale: 1, duration: 0.25, ease: 'back.out(3)' })
    else gsap.to(node, { scale: 0, duration: 0.2, ease: 'power2.in' })
  }
}
