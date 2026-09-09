<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { searchPeople, toggleFollow } from '@/api/follows'
import LoadingMark from '@/components/ui/LoadingMark.vue'
import { t } from '@/i18n'

const auth = useAuthStore()
const query = ref('')
const results = ref([])
const loading = ref(false)
const error = ref('')
const pendingId = ref(null)
let searchTimer

function initials(profile) {
  return profile.displayName?.charAt(0)?.toUpperCase() || profile.handle.charAt(0).toUpperCase()
}

async function runSearch() {
  if (query.value.trim().length < 2) {
    results.value = []
    return
  }

  loading.value = true
  error.value = ''
  try {
    results.value = await searchPeople(query.value)
  } catch (searchError) {
    error.value = searchError.message
  } finally {
    loading.value = false
  }
}

watch(query, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(runSearch, 350)
})

async function onFollow(profile) {
  if (!auth.isSignedIn || pendingId.value) return
  pendingId.value = profile.id
  error.value = ''
  try {
    profile.followingByMe = await toggleFollow(profile.id)
  } catch (followError) {
    error.value = followError.message
  } finally {
    pendingId.value = null
  }
}

onBeforeUnmount(() => clearTimeout(searchTimer))
</script>

<template>
  <main class="mx-auto max-w-[900px] px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16">
    <header class="mb-8">
      <p class="text-[10px] font-medium uppercase tracking-[0.18em] text-graphite/45">{{ t('search') }}</p>
      <h1 class="mt-1 text-2xl font-expanded font-semibold tracking-[-0.035em] sm:text-3xl">{{ t('searchPeopleTitle') }}</h1>
      <p class="mt-2 text-sm text-graphite/60">{{ t('searchPeopleSubtitle') }}</p>
    </header>

    <input v-model="query" type="search" :placeholder="t('searchPeoplePlaceholder')" class="w-full rounded-full bg-mount px-5 py-3.5 text-sm outline-none shadow-sm placeholder:text-graphite/45 focus-visible:ring-2 focus-visible:ring-umber" />

    <p v-if="error" class="mt-4 text-sm text-umber">{{ error }}</p>
    <p v-else-if="query.trim().length < 2" class="mt-4 text-xs text-graphite/50">{{ t('searchPeopleHint') }}</p>
    <LoadingMark v-else-if="loading" />
    <p v-else-if="!results.length" class="mt-6 text-sm text-graphite/55">{{ t('noPeopleResults') }}</p>

    <div v-else class="mt-7 grid gap-3 sm:grid-cols-2">
      <article v-for="profile in results" :key="profile.id" class="flex items-center gap-3 rounded-2xl bg-mount p-4 shadow-sm">
        <RouterLink :to="{ name: 'profile', params: { handle: profile.handle } }" class="shrink-0">
          <img v-if="profile.avatarPath" :src="profile.avatarPath" :alt="profile.displayName" class="h-12 w-12 rounded-full object-cover" />
          <span v-else class="flex h-12 w-12 items-center justify-center rounded-full text-sm font-medium text-wall" :style="{ backgroundColor: profile.avatarColor || '#7a4a2a' }">{{ profile.avatarEmoji || initials(profile) }}</span>
        </RouterLink>
        <div class="min-w-0 flex-1">
          <RouterLink :to="{ name: 'profile', params: { handle: profile.handle } }" class="block truncate text-sm font-medium hover:text-umber">
            {{ profile.displayName }}
          </RouterLink>
          <p class="truncate text-xs text-graphite/50">@{{ profile.handle }}</p>
        </div>
        <button v-if="auth.isSignedIn" type="button" class="rounded-full px-3 py-2 text-xs font-medium transition" :class="profile.followingByMe ? 'bg-wall-deep text-graphite' : 'bg-umber text-wall hover:brightness-110'" :disabled="pendingId === profile.id" @click="onFollow(profile)">
          {{ profile.followingByMe ? t('following') : t('follow') }}
        </button>
        <RouterLink v-else :to="{ name: 'auth' }" class="rounded-full bg-umber px-3 py-2 text-xs font-medium text-wall">
          {{ t('follow') }}
        </RouterLink>
      </article>
    </div>
  </main>
</template>
