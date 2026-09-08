<script setup>
import { RouterView, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-wall text-graphite">
    <header class="h-16 flex items-center justify-between px-6 border-b border-graphite/15">
      <RouterLink to="/" class="font-expanded text-lg font-semibold tracking-[-0.02em]">rux</RouterLink>
      <nav class="flex items-center gap-6 text-sm font-medium">
        <template v-if="auth.isSignedIn">
          <RouterLink :to="{ name: 'profile', params: { handle: auth.session.handle } }" class="hover:text-ultramarine">you</RouterLink>
          <RouterLink :to="{ name: 'compose' }" class="hover:text-ultramarine">compose</RouterLink>
        </template>
        <RouterLink v-else :to="{ name: 'auth' }" class="hover:text-ultramarine">sign in</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
