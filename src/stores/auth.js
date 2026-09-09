import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import { supabase } from '@/api/supabase'

export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  const isReady = ref(false)
  const isSignedIn = computed(() => session.value !== null)

  function setSession(user) {
    session.value = user ? authApi.mapUser(user) : null
  }

  async function signUp(fields) {
    session.value = await authApi.signUp(fields)
  }

  async function signIn(fields) {
    session.value = await authApi.signIn(fields)
  }

  async function signOut() {
    await authApi.signOut()
  }

  const ready = supabase.auth
    .getSession()
    .then(({ data }) => setSession(data.session?.user ?? null))
    .catch(() => setSession(null))
    .finally(() => {
      isReady.value = true
    })

  supabase.auth.onAuthStateChange((_event, authSession) => setSession(authSession?.user ?? null))

  return { session, isReady, ready, isSignedIn, signUp, signIn, signOut }
})
