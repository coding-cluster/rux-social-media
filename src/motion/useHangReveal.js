import { onUnmounted } from 'vue'
import { gsap } from './index'

// The one orchestrated page-load moment: the datum line draws left to
// right, then the first two mounts rise into position. Runs once, does
// not replay on scroll — see useAdvance for everything below the fold.
//
// Call `play()` yourself once the first page of posts has rendered —
// the composable can't know when your async fetch resolves. The context
// is created here rather than in onMounted for the same reason: the feed
// container is behind a v-if and doesn't exist until the fetch resolves.
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
