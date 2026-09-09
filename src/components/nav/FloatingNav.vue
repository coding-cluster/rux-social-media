<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { gsap, prefersReducedMotion } from '@/motion'
import { i18n, t, toggleLocale } from '@/i18n'

const auth = useAuthStore()
const postBtn = ref(null)
const langKnob = ref(null)
const menuRef = ref(null)
const menuOpen = ref(false)
const showSignOutConfirm = ref(false)
const signingOut = ref(false)
const signOutError = ref('')

const KNOB_TRAVEL = 28
onMounted(() => {
  gsap.set(postBtn.value.$el, { xPercent: -50, yPercent: -50 })
  gsap.set(langKnob.value, { x: i18n.locale === 'es' ? KNOB_TRAVEL : 0 })
  document.addEventListener('click', closeMenuOnOutsideClick)
})

onBeforeUnmount(() => document.removeEventListener('click', closeMenuOnOutsideClick))

function closeMenuOnOutsideClick(event) {
  if (menuRef.value && !menuRef.value.contains(event.target)) menuOpen.value = false
}

function requestSignOut() {
  menuOpen.value = false
  signOutError.value = ''
  showSignOutConfirm.value = true
}

async function confirmSignOut() {
  if (signingOut.value) return
  signingOut.value = true
  signOutError.value = ''
  try {
    await auth.signOut()
    showSignOutConfirm.value = false
  } catch (error) {
    signOutError.value = error.message
  } finally {
    signingOut.value = false
  }
}

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

  const tl = gsap.timeline()
  tl.to(knob, { x: movingToEs ? KNOB_TRAVEL : 0, duration: 0.3, ease: 'back.out(2)' }, 0)
  tl.to(knob, { scaleX: 0.55, duration: 0.12, ease: 'power2.in' }, 0)
  tl.call(() => toggleLocale(), null, 0.12)
  tl.to(knob, { scaleX: 1, duration: 0.18, ease: 'back.out(3)' }, 0.12)
}
</script>

<template>
  <div class="sticky top-4 z-50 flex min-w-0 justify-center px-3 sm:px-4">
    <nav
      class="relative flex w-full max-w-[600px] min-w-0 items-center justify-between gap-2 rounded-full border border-white/15 bg-graphite/45 px-3 py-2 text-wall shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl backdrop-saturate-150 sm:gap-3 sm:px-5 sm:py-3"
    >
      <RouterLink to="/" class="flex h-9 w-[64px] shrink-0 items-center sm:h-10 sm:w-[72px]" aria-label="Rux">
        <img src="/logo.png" alt="Rux" class="h-full w-full object-contain" />
      </RouterLink>

      <RouterLink
        ref="postBtn"
        :to="auth.isSignedIn ? { name: 'compose' } : { name: 'auth' }"
        class="absolute left-1/2 top-1/2 flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-white/25 bg-[#f0e6d2]/85 text-graphite shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:brightness-95 sm:h-16 sm:w-16 sm:rounded-2xl"
        @mouseenter="onPostHover(1.15)"
        @mouseleave="onPostHover(1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
          <path d="M12 5l0 14" />
          <path d="M5 12l14 0" />
        </svg>
        <span class="text-[11px] font-medium leading-none sm:text-[13px]">{{ t('post') }}</span>
      </RouterLink>

      <div class="flex min-w-0 items-center gap-1 sm:gap-2">
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

        <div ref="menuRef" class="relative">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-full bg-wall px-3 py-2 text-xs font-medium text-graphite transition hover:brightness-95 sm:px-3.5 sm:text-sm"
            :aria-label="t('menu')"
            :aria-expanded="menuOpen"
            @click.stop="menuOpen = !menuOpen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" class="h-4 w-4">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>

          <div
            v-if="menuOpen"
            class="absolute right-0 top-[calc(100%+12px)] z-20 flex w-52 flex-col rounded-2xl bg-mount p-2 text-graphite shadow-2xl"
          >
            <RouterLink
              to="/"
              class="rounded-xl px-3 py-2.5 text-sm transition hover:bg-wall-deep"
              @click="menuOpen = false"
            >
              {{ t('home') }}
            </RouterLink>

            <RouterLink
              :to="{ name: 'search' }"
              class="rounded-xl px-3 py-2.5 text-sm transition hover:bg-wall-deep"
              @click="menuOpen = false"
            >
              {{ t('search') }}
            </RouterLink>

            <RouterLink
              :to="{ name: 'messages' }"
              class="rounded-xl px-3 py-2.5 text-sm transition hover:bg-wall-deep"
              @click="menuOpen = false"
            >
              {{ t('messages') }}
            </RouterLink>

            <RouterLink
              :to="{ name: 'saved' }"
              class="rounded-xl px-3 py-2.5 text-sm transition hover:bg-wall-deep"
              @click="menuOpen = false"
            >
              {{ t('saved') }}
            </RouterLink>

            <RouterLink
              :to="{ name: 'reposts' }"
              class="rounded-xl px-3 py-2.5 text-sm transition hover:bg-wall-deep"
              @click="menuOpen = false"
            >
              {{ t('reposts') }}
            </RouterLink>

            <RouterLink
              v-if="auth.isSignedIn"
              :to="{ name: 'profile', params: { handle: auth.session.handle } }"
              class="rounded-xl px-3 py-2.5 text-sm transition hover:bg-wall-deep"
              @click="menuOpen = false"
            >
              {{ t('profile') }}
            </RouterLink>

            <button
              v-if="auth.isSignedIn"
              type="button"
              class="mt-1 border-t border-graphite/10 px-3 py-2.5 text-left text-sm text-umber transition hover:text-graphite"
              @click="requestSignOut"
            >
              {{ t('signOut') }}
            </button>
            <RouterLink
              v-else
              :to="{ name: 'auth' }"
              class="rounded-xl px-3 py-2.5 text-sm transition hover:bg-wall-deep"
              @click="menuOpen = false"
            >
              {{ t('signIn') }}
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <div
      v-if="showSignOutConfirm"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-graphite/45 p-5 backdrop-blur-sm"
      role="presentation"
      @click.self="showSignOutConfirm = false"
    >
      <div class="w-full max-w-[380px] rounded-3xl bg-mount p-6 text-graphite shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="sign-out-dialog-title">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-umber/10 text-umber">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
            <path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10" />
            <path d="M13 8l4 4-4 4M17 12H9" />
          </svg>
        </div>
        <h2 id="sign-out-dialog-title" class="mt-5 text-lg font-expanded font-semibold">{{ t('signOutTitle') }}</h2>
        <p class="mt-2 text-sm leading-6 text-graphite/65">{{ t('signOutBody') }}</p>
        <p v-if="signOutError" class="mt-3 text-sm text-umber">{{ signOutError }}</p>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="rounded-full bg-wall-deep px-4 py-2.5 text-sm font-medium transition hover:bg-graphite hover:text-wall" :disabled="signingOut" @click="showSignOutConfirm = false">
            {{ t('cancel') }}
          </button>
          <button type="button" class="rounded-full bg-umber px-4 py-2.5 text-sm font-medium text-wall transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50" :disabled="signingOut" @click="confirmSignOut">
            {{ signingOut ? t('pleaseWait') : t('confirmSignOut') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
