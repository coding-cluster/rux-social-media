<script setup>
import { ref, onMounted, watch } from 'vue'
import { getProfileByHandle } from '@/api/profiles'
import { getPostsByHandle } from '@/api/posts'

const props = defineProps({ handle: String })
const profile = ref(null)
const posts = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  profile.value = await getProfileByHandle(props.handle)
  posts.value = profile.value ? await getPostsByHandle(props.handle) : []
  loading.value = false
}

onMounted(load)
watch(() => props.handle, load)
</script>

<template>
  <main class="max-w-[980px] mx-auto px-6 py-12">
    <p v-if="loading" class="text-sm text-graphite/60">Loading…</p>
    <p v-else-if="!profile" class="text-lg font-expanded font-semibold">No one's hung anything under that name.</p>
    <template v-else>
      <header class="mb-12 flex flex-col gap-1">
        <h1 class="text-lg font-expanded font-semibold tracking-[-0.02em]">{{ profile.displayName }}</h1>
        <p v-if="profile.bio" class="italic text-md text-graphite/80 max-w-[62ch]">{{ profile.bio }}</p>
        <p class="text-xs tracking-[0.05em] text-graphite/60 mt-1">{{ posts.length }} posts</p>
      </header>

      <p v-if="!posts.length" class="text-sm text-graphite/60">Nothing hung yet.</p>
      <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-2">
        <RouterLink
          v-for="post in posts"
          :key="post.id"
          :to="{ name: 'post', params: { id: post.id } }"
          class="relative bg-mount aspect-square block"
          :data-flip-id="post.id"
        >
          <img
            :src="post.imagePath"
            :width="post.imageWidth"
            :height="post.imageHeight"
            :alt="post.caption || `Photo by ${post.authorHandle}`"
            class="absolute inset-0 w-full h-full object-cover"
          />
        </RouterLink>
      </div>
    </template>
  </main>
</template>
