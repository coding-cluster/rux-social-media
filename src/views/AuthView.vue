<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { t } from '@/i18n'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const mode = ref('signin')
const email = ref('')
const password = ref('')
const handle = ref('')
const displayName = ref('')
const error = ref('')
const submitting = ref(false)
const showPassword = ref(false)

function toggleMode() {
  mode.value = mode.value === 'signup' ? 'signin' : 'signup'
  error.value = ''
}

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    if (mode.value === 'signup') {
      await auth.signUp({ email: email.value, password: password.value, handle: handle.value, displayName: displayName.value })
    } else {
      await auth.signIn({ email: email.value, password: password.value })
    }
    router.push(route.query.next || { name: 'feed' })
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

const inputClass =
  'w-full rounded-full bg-wall-deep px-5 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-umber'
</script>

<template>
  <main class="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-8">
    <div class="grid w-full max-w-[1100px] overflow-hidden rounded-[32px] bg-mount shadow-2xl md:grid-cols-2">
      <div class="flex flex-col justify-center gap-8 px-10 py-12 md:px-14">
        <RouterLink
          to="/"
          class="w-fit rounded-full border border-graphite/20 px-4 py-1.5 font-expanded text-sm tracking-[0.2em] lowercase"
        >
          rux
        </RouterLink>

        <div class="flex flex-col gap-1">
          <h1 class="text-xl font-expanded font-semibold tracking-[-0.02em]">
            {{ mode === 'signup' ? t('createAccount') : t('welcomeBack') }}
          </h1>
          <p class="text-sm text-graphite/60">
            {{ mode === 'signup' ? t('signUpSubtitle') : t('signInSubtitle') }}
          </p>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <template v-if="mode === 'signup'">
            <label class="flex flex-col gap-2">
              <span class="text-xs font-medium text-graphite/60">{{ t('displayName') }}</span>
              <input v-model="displayName" type="text" required :class="inputClass" />
            </label>
            <label class="flex flex-col gap-2">
              <span class="text-xs font-medium text-graphite/60">{{ t('handle') }}</span>
              <input v-model="handle" type="text" required pattern="[a-z0-9_]{3,20}" :class="inputClass" />
            </label>
          </template>

          <label class="flex flex-col gap-2">
            <span class="text-xs font-medium text-graphite/60">{{ t('email') }}</span>
            <input v-model="email" type="email" required autocomplete="email" :class="inputClass" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-xs font-medium text-graphite/60">{{ t('password') }}</span>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                minlength="6"
                autocomplete="current-password"
                :class="[inputClass, 'pr-12']"
              />
              <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-graphite/50 hover:text-graphite"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
                  <path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" />
                  <path d="M3 3l18 18" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                  <path d="M22 12c-2.4 4 -5.4 6 -10 6c-4.6 0 -7.6 -2 -10 -6c2.4 -4 5.4 -6 10 -6c4.6 0 7.6 2 10 6" />
                </svg>
              </button>
            </div>
          </label>

          <p v-if="error" class="text-sm text-umber">{{ error }}</p>

          <button
            type="submit"
            class="mt-2 rounded-full bg-umber py-3 text-sm font-medium text-wall transition hover:brightness-110 disabled:opacity-50"
            :disabled="submitting"
          >
            {{ submitting ? t('pleaseWait') : mode === 'signup' ? t('createAccount') : t('signIn') }}
          </button>
        </form>

        <button type="button" class="w-fit text-sm font-medium hover:text-umber" @click="toggleMode">
          {{ mode === 'signup' ? t('haveAccount') : t('newHere') }}
        </button>
      </div>

      <div class="relative hidden md:block">
        <div class="absolute inset-0 overflow-hidden bg-graphite">
          <img :src="mode === 'signup' ? '/demo-feed/alfredo-signup.webp' : '/demo-feed/alfredo-login.webp'" alt="" class="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl" aria-hidden="true" />
          <img :src="mode === 'signup' ? '/demo-feed/alfredo-signup.webp' : '/demo-feed/alfredo-login.webp'" alt="Alfredo Olivas" class="relative z-10 h-full w-full object-contain" />
        </div>

        <RouterLink
          to="/"
          class="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-wall/90 text-graphite shadow transition hover:bg-wall"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
          </svg>
        </RouterLink>

        <div class="absolute left-6 top-8 z-20 flex w-fit flex-col gap-2 rounded-2xl border border-white/35 bg-white/20 px-4 py-3 text-wall shadow-[0_12px_35px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-2xl backdrop-saturate-150">
          <p class="text-sm font-medium">jamie_walks</p>
          <p class="text-xs text-wall/75">just hung a new photo</p>
        </div>

        <div class="absolute bottom-8 left-6 right-6 z-20 flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-graphite/55 px-5 py-4 text-wall shadow-[0_16px_40px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl backdrop-saturate-150">
          <div>
            <p class="text-sm font-medium">The wall keeps growing</p>
            <p class="text-xs text-wall/60">1,204 photos hung this week</p>
          </div>
          <div class="flex -space-x-2">
            <img
              v-for="n in 3"
              :key="n"
              :src="`https://picsum.photos/seed/rux-auth-avatar-${n}/64/64`"
              class="h-8 w-8 rounded-full border-2 border-graphite object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
