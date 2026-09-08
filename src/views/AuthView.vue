<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const mode = ref('signin') // 'signin' | 'signup'
const email = ref('')
const password = ref('')
const handle = ref('')
const displayName = ref('')
const error = ref('')
const submitting = ref(false)

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

const inputClass = 'bg-wall-deep px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ultramarine'
</script>

<template>
  <main class="max-w-[360px] px-6 py-16 flex flex-col gap-8">
    <h1 class="text-2xl font-expanded font-semibold tracking-[-0.02em]">rux</h1>

    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <label class="flex flex-col gap-2">
        <span class="text-sm font-medium">Email</span>
        <input v-model="email" type="email" required autocomplete="email" :class="inputClass" />
      </label>
      <label class="flex flex-col gap-2">
        <span class="text-sm font-medium">Password</span>
        <input v-model="password" type="password" required minlength="6" autocomplete="current-password" :class="inputClass" />
      </label>
      <template v-if="mode === 'signup'">
        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium">Handle</span>
          <input v-model="handle" type="text" required pattern="[a-z0-9_]{3,20}" :class="inputClass" />
        </label>
        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium">Display name</span>
          <input v-model="displayName" type="text" required :class="inputClass" />
        </label>
      </template>

      <p v-if="error" class="text-sm text-ultramarine">{{ error }}</p>

      <button type="submit" class="w-fit px-4 py-2 bg-graphite text-wall text-sm font-medium disabled:opacity-50" :disabled="submitting">
        {{ mode === 'signup' ? 'Create account' : 'Sign in' }}
      </button>
    </form>

    <button type="button" class="w-fit text-sm font-medium hover:text-ultramarine" @click="mode = mode === 'signup' ? 'signin' : 'signup'">
      {{ mode === 'signup' ? 'Have an account? Sign in' : 'New here? Sign up' }}
    </button>
  </main>
</template>
