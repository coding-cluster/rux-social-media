import { onUnmounted } from 'vue'
import { gsap } from './index'

export function useHangReveal(scopeEl) {
  let ctx
  let played = false

  function play() {
    if (played || !scopeEl.value) return
    played = true

    ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      const line = scopeEl.value.querySelector('[data-datum-line]')
      const rows = Array.from(scopeEl.value.querySelectorAll('[data-post-row]')).slice(0, 2)

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline()
        if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.5, transformOrigin: 'left center' })
        if (rows.length) tl.from(rows, { y: 24, opacity: 0, duration: 0.45, stagger: 0.09 }, line ? '-=0.15' : 0)
      })

      mm.add('(prefers-reduced-motion: reduce)', () => {
        if (line) gsap.set(line, { scaleX: 1 })
        if (rows.length) gsap.set(rows, { y: 0, opacity: 1 })
      })
    }, scopeEl.value)
  }

  onUnmounted(() => ctx?.revert())

  return { play }
}
