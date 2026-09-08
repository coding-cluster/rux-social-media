<script setup>
import { ref, onMounted } from 'vue'
import { getFeed } from '@/api/posts'
import MasonryGrid from '@/components/post/MasonryGrid.vue'
import PostExpandOverlay from '@/components/post/PostExpandOverlay.vue'

const posts = ref([])
const loading = ref(true)
const nextCursor = ref(null)
const loadingMore = ref(false)
const expandedPost = ref(null)

onMounted(async () => {
  const page = await getFeed()
  posts.value = page.posts
  nextCursor.value = page.nextCursor
  loading.value = false
})

async function loadMore() {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  const page = await getFeed({ cursor: nextCursor.value })
  posts.value.push(...page.posts)
  nextCursor.value = page.nextCursor
  loadingMore.value = false
}
</script>

<template>
  <main class="mx-auto max-w-[1400px] px-6 py-12">
    <p v-if="loading" class="text-sm text-graphite/60">Loading…</p>
    <p v-else-if="!posts.length" class="text-lg font-expanded font-semibold">
      Nothing on the wall yet. Follow someone, or hang the first thing.
    </p>
    <MasonryGrid v-else :posts="posts" @select="expandedPost = $event" />
    <button
      v-if="nextCursor"
      class="mt-16 text-sm font-medium hover:text-umber disabled:opacity-50"
      :disabled="loadingMore"
      @click="loadMore"
    >
      {{ loadingMore ? 'Loading…' : 'Show more' }}
    </button>

    <PostExpandOverlay v-if="expandedPost" :post="expandedPost" @close="expandedPost = null" />
  </main>
</template>
