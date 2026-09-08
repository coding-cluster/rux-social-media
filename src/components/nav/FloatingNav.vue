<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { gsap, prefersReducedMotion } from '@/motion'
import { i18n, t, toggleLocale } from '@/i18n'

const auth = useAuthStore()
const postBtn = ref(null)
const langKnob = ref(null)

const KNOB_TRAVEL = 28 // track (56px) minus its own padding (4px each side) minus knob width (20px)

// xPercent/yPercent replace the Tailwind translate-1/2 centering so GSAP owns
// the whole transform — otherwise animating `scale` would wipe out the centering.
onMounted(() => {
  gsap.set(postBtn.value.$el, { xPercent: -50, yPercent: -50 })
  gsap.set(langKnob.value, { x: i18n.locale === 'es' ? KNOB_TRAVEL : 0 })
})

function onPostHover(scale) {
  if (prefersReducedMotion()) return
  gsap.to(postBtn.value.$el, { scale, duration: 0.25, ease: 'back.out(2)' })
}

function onToggleLocale() {
  const knob = langKnob.value
  const movingToEs = i18n.locale === 'en'

  if (prefersReducedMotion()) {
    toggleLocale()
    gsap.set(knob, { x: movingToEs ? KNOB_TRAVEL : 0 })
    return
  }

  // slide the knob across while it squashes and un-squashes, flipping the
  // EN/ES label at the midpoint so the letters change mid-squeeze
  const tl = gsap.timeline()
  tl.to(knob, { x: movingToEs ? KNOB_TRAVEL : 0, duration: 0.3, ease: 'back.out(2)' }, 0)
  tl.to(knob, { scaleX: 0.55, duration: 0.12, ease: 'power2.in' }, 0)
  tl.call(() => toggleLocale(), null, 0.12)
  tl.to(knob, { scaleX: 1, duration: 0.18, ease: 'back.out(3)' }, 0.12)
}
</script>

<template>
  <div class="sticky top-4 z-50 flex justify-center px-4">
    <nav
      class="relative flex w-[600px] items-center justify-between gap-3 rounded-full border border-white/15 bg-graphite/45 px-5 py-3 text-wall shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl backdrop-saturate-150"
    >
      <RouterLink to="/" class="font-expanded text-lg tracking-[0.2em] lowercase">rux</RouterLink>

      <RouterLink
        ref="postBtn"
        :to="auth.isSignedIn ? { name: 'compose' } : { name: 'auth' }"
        class="absolute left-1/2 top-1/2 flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-2xl border border-white/25 bg-[#f0e6d2]/85 text-graphite shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:brightness-95"
        @mouseenter="onPostHover(1.15)"
        @mouseleave="onPostHover(1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
          <path d="M12 5l0 14" />
          <path d="M5 12l14 0" />
        </svg>
        <span class="text-[13px] font-medium leading-none">{{ t('post') }}</span>
      </RouterLink>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="relative flex h-7 w-14 shrink-0 items-center rounded-full bg-wall/25 px-1"
          :aria-label="i18n.locale === 'en' ? 'Switch to Spanish' : 'Switch to English'"
          @click="onToggleLocale"
        >
          <span
            ref="langKnob"
            class="flex h-5 w-5 items-center justify-center rounded-full bg-wall text-[9px] font-semibold text-graphite"
          >
            {{ i18n.locale.toUpperCase() }}
          </span>
        </button>

        <RouterLink
          v-if="auth.isSignedIn"
          :to="{ name: 'profile', params: { handle: auth.session.handle } }"
          class="flex items-center gap-1.5 rounded-full bg-wall px-3.5 py-2 text-sm font-medium text-graphite transition hover:brightness-95"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5" aria-hidden="true">
            <circle cx="10" cy="6.5" r="3.5" />
            <path d="M2.5 18a7.5 7.5 0 0 1 15 0" />
          </svg>
          {{ t('profile') }}
        </RouterLink>
        <RouterLink
          v-else
          :to="{ name: 'auth' }"
          class="rounded-full bg-wall px-4 py-2 text-sm font-medium text-graphite transition hover:brightness-95"
        >
          {{ t('signIn') }}
        </RouterLink>
      </div>
    </nav>
  </div>
</template>
