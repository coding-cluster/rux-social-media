<script setup>
import { ref, onMounted } from 'vue'
import { getFeed } from '@/api/posts'
import MasonryGrid from '@/components/post/MasonryGrid.vue'
import PostExpandOverlay from '@/components/post/PostExpandOverlay.vue'
import LoadingMark from '@/components/ui/LoadingMark.vue'
import NotesBar from '@/components/notes/NotesBar.vue'
import { t } from '@/i18n'

const posts = ref([])
const loading = ref(true)
const nextCursor = ref(null)
const loadingMore = ref(false)
const expandedPost = ref(null)

function updatePostInFeed(updatedPost) {
  const index = posts.value.findIndex((post) => post.id === updatedPost.id)
  if (index !== -1) posts.value[index] = { ...posts.value[index], ...updatedPost }
}

function removePostFromFeed(postId) {
  posts.value = posts.value.filter((post) => post.id !== postId)
  expandedPost.value = null
}

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
    <NotesBar />
    <LoadingMark v-if="loading" />
    <p v-else-if="!posts.length" class="text-lg font-expanded font-semibold">
      {{ t('feedEmpty') }}
    </p>
    <MasonryGrid v-else :posts="posts" @select="expandedPost = $event" @updated="updatePostInFeed" />
    <button
      v-if="nextCursor"
      type="button"
      class="mx-auto mt-16 flex w-fit items-center rounded-full bg-umber px-5 py-2.5 text-sm font-medium text-wall transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
      :disabled="loadingMore"
      @click="loadMore"
    >
      {{ loadingMore ? t('loading') : t('showMore') }}
    </button>

    <PostExpandOverlay
      v-if="expandedPost"
      :post="expandedPost"
      @close="expandedPost = null"
      @updated="updatePostInFeed"
      @deleted="removePostFromFeed"
    />
  </main>
</template>
