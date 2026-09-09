<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getProfileByHandle } from '@/api/profiles'
import { getFollowCounts } from '@/api/follows'
import { getPostsByHandle } from '@/api/posts'
import MasonryGrid from '@/components/post/MasonryGrid.vue'
import PostExpandOverlay from '@/components/post/PostExpandOverlay.vue'
import LoadingMark from '@/components/ui/LoadingMark.vue'
import { t } from '@/i18n'

const props = defineProps({ handle: String })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const profile = ref(null)
const posts = ref([])
const loading = ref(true)
const expandedPost = ref(null)
const followerCount = ref(0)
const followingCount = ref(0)
const totalLikes = computed(() => posts.value.reduce((total, post) => total + post.likeCount, 0))
const totalComments = computed(() => posts.value.reduce((total, post) => total + post.commentCount, 0))

function updatePostInProfile(updatedPost) {
  const index = posts.value.findIndex((post) => post.id === updatedPost.id)
  if (index !== -1) posts.value[index] = { ...posts.value[index], ...updatedPost }
}

function removePostFromProfile(postId) {
  posts.value = posts.value.filter((post) => post.id !== postId)
  expandedPost.value = null
}

async function load() {
  loading.value = true
  profile.value = await getProfileByHandle(props.handle)
  if (profile.value) {
    const [profilePosts, followCounts] = await Promise.all([
      getPostsByHandle(props.handle),
      getFollowCounts(profile.value.id),
    ])
    posts.value = profilePosts
    followerCount.value = followCounts.followers
    followingCount.value = followCounts.following
  } else {
    posts.value = []
    followerCount.value = 0
    followingCount.value = 0
  }
  loading.value = false

  const openId = route.query.post
  if (openId) {
    const match = posts.value.find((post) => post.id === openId)
    if (match) expandedPost.value = match
    router.replace({ query: {} })
  }
}

onMounted(load)
watch(() => props.handle, load)
</script>

<template>
  <main class="mx-auto max-w-[1180px] px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16">
    <LoadingMark v-if="loading" />
    <p v-else-if="!profile" class="text-lg font-expanded font-semibold">{{ t('noProfile') }}</p>

    <template v-else>
      <header class="mx-auto flex max-w-[620px] flex-col items-center text-center">
        <img
          v-if="profile.avatarPath"
          :src="profile.avatarPath"
          :alt="profile.displayName"
          class="h-24 w-24 rounded-full object-cover ring-4 ring-mount sm:h-28 sm:w-28"
        />
        <div v-else class="flex h-24 w-24 items-center justify-center rounded-full bg-umber text-3xl font-expanded text-wall ring-4 ring-mount sm:h-28 sm:w-28">
          {{ profile.displayName.charAt(0).toUpperCase() }}
        </div>

        <h1 class="mt-5 text-2xl font-expanded font-semibold tracking-[-0.035em] sm:text-3xl">{{ profile.displayName }}</h1>
        <p class="mt-1 text-sm text-graphite/50">@{{ profile.handle }}</p>
        <p v-if="profile.bio" class="mt-4 max-w-[44ch] text-[15px] leading-6 text-graphite/70">{{ profile.bio }}</p>
        <RouterLink
          v-if="auth.isSignedIn && auth.session.userId !== profile.id"
          :to="{ name: 'messages', query: { to: profile.handle } }"
          class="mt-5 rounded-full bg-umber px-4 py-2 text-xs font-medium text-wall transition hover:brightness-110"
        >
          {{ t('sendMessage') }}
        </RouterLink>

        <div class="mt-7 flex flex-wrap items-center justify-center divide-x divide-graphite/15 text-center">
          <div class="px-3 sm:px-5">
            <p class="text-lg font-expanded font-semibold">{{ posts.length }}</p>
            <p class="mt-1 text-[10px] uppercase tracking-[0.12em] text-graphite/50">{{ t('posts') }}</p>
          </div>
          <div class="px-3 sm:px-5">
            <p class="text-lg font-expanded font-semibold">{{ followerCount }}</p>
            <p class="mt-1 text-[10px] uppercase tracking-[0.12em] text-graphite/50">{{ t('followers') }}</p>
          </div>
          <div class="px-3 sm:px-5">
            <p class="text-lg font-expanded font-semibold">{{ followingCount }}</p>
            <p class="mt-1 text-[10px] uppercase tracking-[0.12em] text-graphite/50">{{ t('followingCount') }}</p>
          </div>
          <div class="px-3 sm:px-5">
            <p class="text-lg font-expanded font-semibold">{{ totalLikes }}</p>
            <p class="mt-1 text-[10px] uppercase tracking-[0.12em] text-graphite/50">{{ t('likes') }}</p>
          </div>
          <div class="px-3 sm:px-5">
            <p class="text-lg font-expanded font-semibold">{{ totalComments }}</p>
            <p class="mt-1 text-[10px] uppercase tracking-[0.12em] text-graphite/50">{{ t('comments') }}</p>
          </div>
        </div>
      </header>

      <section class="mt-14">
        <div class="mb-6 flex items-center justify-between border-b border-graphite/10 pb-3">
          <h2 class="text-sm font-medium">{{ t('posts') }}</h2>
          <span class="text-xs text-graphite/50">{{ posts.length }}</span>
        </div>
        <p v-if="!posts.length" class="py-10 text-center text-sm text-graphite/60">{{ t('nothingHungYet') }}</p>
        <MasonryGrid v-else :posts="posts" @select="expandedPost = $event" />
      </section>
    </template>

    <PostExpandOverlay
      v-if="expandedPost"
      :post="expandedPost"
      @close="expandedPost = null"
      @updated="updatePostInProfile"
      @deleted="removePostFromProfile"
    />
  </main>
</template>
