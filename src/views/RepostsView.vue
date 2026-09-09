<script setup>
import { ref, onMounted } from 'vue'
import { getRepostedPosts } from '@/api/posts'
import MasonryGrid from '@/components/post/MasonryGrid.vue'
import PostExpandOverlay from '@/components/post/PostExpandOverlay.vue'
import LoadingMark from '@/components/ui/LoadingMark.vue'
import { t } from '@/i18n'

const posts = ref([])
const loading = ref(true)
const expandedPost = ref(null)

async function loadReposts() {
  posts.value = await getRepostedPosts()
  loading.value = false
}

function closeOverlay() {
  expandedPost.value = null
  loadReposts()
}

onMounted(loadReposts)
</script>

<template>
  <main class="mx-auto max-w-[1400px] px-6 pb-10 pt-12 sm:pb-14 sm:pt-16">
    <LoadingMark v-if="loading" />
    <template v-else>
      <header class="mb-10 border-b border-graphite/10 pb-4">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-[0.18em] text-graphite/45">{{ t('collectionLabel') }}</p>
            <h1 class="mt-1 text-2xl font-expanded font-semibold tracking-[-0.035em] sm:text-3xl">{{ t('reposts') }}</h1>
          </div>
          <span class="shrink-0 text-xs text-graphite/50">{{ posts.length }} {{ t('posts') }}</span>
        </div>
      </header>

      <div v-if="!posts.length" class="flex min-h-64 flex-col items-center justify-center px-6 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-mount text-graphite/50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6" aria-hidden="true">
            <path d="M17 3l4 4-4 4" />
            <path d="M3 11V9a2 2 0 0 1 2-2h16" />
            <path d="M7 21l-4-4 4-4" />
            <path d="M21 13v2a2 2 0 0 1-2 2H3" />
          </svg>
        </div>
        <p class="mt-4 text-sm font-medium">{{ t('repostsEmpty') }}</p>
        <p class="mt-1 max-w-[32ch] text-xs leading-5 text-graphite/55">{{ t('repostsHint') }}</p>
        <RouterLink to="/" class="mt-5 rounded-full bg-umber px-4 py-2 text-xs font-medium text-wall transition hover:brightness-110">
          {{ t('home') }}
        </RouterLink>
      </div>
      <MasonryGrid v-else :posts="posts" @select="expandedPost = $event" />
    </template>

    <PostExpandOverlay
      v-if="expandedPost"
      :post="expandedPost"
      @close="closeOverlay"
      @updated="loadReposts"
      @deleted="loadReposts"
    />
  </main>
</template>
