import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'

const SESSION_KEY = 'rux-session-v1'

export const useAuthStore = defineStore('auth', () => {
  const session = ref(readStoredSession())
  const isSignedIn = computed(() => session.value !== null)

  function readStoredSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function persistSession() {
    try {
      if (session.value) localStorage.setItem(SESSION_KEY, JSON.stringify(session.value))
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      // storage unavailable — session just won't survive a reload
    }
  }

  async function signUp(fields) {
    session.value = await authApi.signUp(fields)
    persistSession()
  }

  async function signIn(fields) {
    session.value = await authApi.signIn(fields)
    persistSession()
  }

  function signOut() {
    session.value = null
    persistSession()
  }

  return { session, isSignedIn, signUp, signIn, signOut }
})
