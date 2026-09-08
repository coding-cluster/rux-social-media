import { onUnmounted } from 'vue'
import { gsap, ScrollTrigger } from './index'

// Scroll-in for everything below the fold. Uses ScrollTrigger.batch
// (never one trigger per post) so pagination can't leak hundreds of
// instances. Call `registerNew()` after the DOM updates with more rows
// (initial load past the first two, and every subsequent page append).
//
// The context is created on first use, not in onMounted: the feed
// container is behind a v-if and doesn't exist until the fetch resolves.
export function useAdvance(scopeEl) {
  let ctx
  const bound = new WeakSet()

  function registerNew() {
    if (!scopeEl.value) return
    if (!ctx) ctx = gsap.context(() => {}, scopeEl.value)

    const rows = Array.from(scopeEl.value.querySelectorAll('[data-post-row]'))
      .slice(2) // rows 0/1 are useHangReveal's, not Advance's
      .filter((el) => !bound.has(el))
    if (!rows.length) return
    rows.forEach((el) => bound.add(el))

    ctx.add(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(rows, { y: 16, opacity: 0 })
        ScrollTrigger.batch(rows, {
          start: 'top 88%',
          once: true,
          batchMax: 3,
          onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.45, stagger: 0.09 }),
        })
      })
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(rows, { y: 0, opacity: 1 })
      })
    })

    ScrollTrigger.refresh()
  }

  onUnmounted(() => ctx?.revert())

  return { registerNew }
}
