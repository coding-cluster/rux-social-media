<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { getFeed } from '@/api/posts'
import PostRow from '@/components/post/PostRow.vue'
import { useHangReveal } from '@/motion/useHangReveal'
import { useAdvance } from '@/motion/useAdvance'

const posts = ref([])
const loading = ref(true)
const nextCursor = ref(null)
const loadingMore = ref(false)
const feedRef = ref(null)

const { play: playHang } = useHangReveal(feedRef)
const { registerNew: registerAdvance } = useAdvance(feedRef)

onMounted(async () => {
  const page = await getFeed()
  posts.value = page.posts
  nextCursor.value = page.nextCursor
  loading.value = false
  await nextTick()
  playHang()
  registerAdvance()
})

async function loadMore() {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  const page = await getFeed({ cursor: nextCursor.value })
  posts.value.push(...page.posts)
  nextCursor.value = page.nextCursor
  loadingMore.value = false
  await nextTick()
  registerAdvance()
}
</script>

<template>
  <main class="max-w-[980px] mx-auto px-6 py-12">
    <p v-if="loading" class="text-sm text-graphite/60">Loading…</p>
    <p v-else-if="!posts.length" class="text-lg font-expanded font-semibold">
      Nothing on the wall yet. Follow someone, or hang the first thing.
    </p>
    <div v-else ref="feedRef" class="flex flex-col gap-16">
      <PostRow v-for="(post, i) in posts" :key="post.id" :post="post" :draw-datum="i === 0" />
    </div>
    <button
      v-if="nextCursor"
      class="mt-16 text-sm font-medium hover:text-ultramarine disabled:opacity-50"
      :disabled="loadingMore"
      @click="loadMore"
    >
      {{ loadingMore ? 'Loading…' : 'Show more' }}
    </button>
  </main>
</template>
