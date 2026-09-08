<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProfileByHandle } from '@/api/profiles'
import { getPostsByHandle } from '@/api/posts'
import MasonryGrid from '@/components/post/MasonryGrid.vue'
import PostExpandOverlay from '@/components/post/PostExpandOverlay.vue'
import { t } from '@/i18n'

const props = defineProps({ handle: String })
const route = useRoute()
const router = useRouter()
const profile = ref(null)
const posts = ref([])
const loading = ref(true)
const expandedPost = ref(null)

async function load() {
  loading.value = true
  profile.value = await getProfileByHandle(props.handle)
  posts.value = profile.value ? await getPostsByHandle(props.handle) : []
  loading.value = false

  // freshly hung post: land here with its card already expanded, then drop the
  // query so a refresh or back-nav doesn't reopen it
  const openId = route.query.post
  if (openId) {
    const match = posts.value.find((p) => p.id === openId)
    if (match) expandedPost.value = match
    router.replace({ query: {} })
  }
}

onMounted(load)
watch(() => props.handle, load)
</script>

<template>
  <main class="mx-auto max-w-[1400px] px-6 py-12">
    <p v-if="loading" class="text-sm text-graphite/60">{{ t('loading') }}</p>
    <p v-else-if="!profile" class="text-lg font-expanded font-semibold">{{ t('noProfile') }}</p>
    <template v-else>
      <header class="mb-12 flex flex-col gap-1">
        <h1 class="text-lg font-expanded font-semibold tracking-[-0.02em]">{{ profile.displayName }}</h1>
        <p v-if="profile.bio" class="italic text-md text-graphite/80 max-w-[62ch]">{{ profile.bio }}</p>
        <p class="text-xs tracking-[0.05em] text-graphite/60 mt-1">{{ posts.length }} {{ t('posts') }}</p>
      </header>

      <p v-if="!posts.length" class="text-sm text-graphite/60">{{ t('nothingHungYet') }}</p>
      <MasonryGrid v-else :posts="posts" @select="expandedPost = $event" />
    </template>

    <PostExpandOverlay v-if="expandedPost" :post="expandedPost" @close="expandedPost = null" />
  </main>
</template>
