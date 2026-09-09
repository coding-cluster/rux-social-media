<script setup>
import { computed, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '@/motion'
import { toggleLike, toggleSaved, toggleRepost } from '@/api/posts'
import { useAuthStore } from '@/stores/auth'
import { t } from '@/i18n'
import { isDemoPost, toggleDemoLike, toggleDemoSaved, toggleDemoRepost } from '@/mocks/demoInteractions'

const props = defineProps({ post: { type: Object, required: true } })
const emit = defineEmits(['select', 'updated'])
const auth = useAuthStore()

const cardRef = ref(null)
const post = ref({ ...props.post })
const busyAction = ref('')
const isRemotePost = computed(() => /^[0-9a-f-]{36}$/i.test(post.value.id))
const isLocalDemoPost = computed(() => isDemoPost(post.value.id))

watch(() => props.post, (nextPost) => {
  post.value = { ...post.value, ...nextPost }
}, { deep: true })

function press(scale) {
  if (prefersReducedMotion()) return
  gsap.to(cardRef.value, { scale, duration: 0.2, ease: 'power2.out' })
}

function canUseAction() {
  return (isLocalDemoPost.value || auth.isSignedIn) && !busyAction.value
}

async function onLike() {
  if (!canUseAction()) return
  const before = { likedByMe: post.value.likedByMe, likeCount: post.value.likeCount }
  busyAction.value = 'like'
  try {
    if (isLocalDemoPost.value) {
      post.value = toggleDemoLike(post.value)
    } else if (isRemotePost.value) {
      post.value.likedByMe = !before.likedByMe
      post.value.likeCount += post.value.likedByMe ? 1 : -1
      const result = await toggleLike(post.value.id)
      post.value = { ...post.value, ...result }
    }
    emit('updated', post.value)
  } catch {
    post.value = { ...post.value, ...before }
  } finally {
    busyAction.value = ''
  }
}

async function onSave() {
  if (!canUseAction()) return
  const before = post.value.savedByMe
  busyAction.value = 'save'
  try {
    if (isLocalDemoPost.value) {
      post.value = toggleDemoSaved(post.value)
    } else if (isRemotePost.value) {
      post.value.savedByMe = !before
      const result = await toggleSaved(post.value.id)
      post.value = { ...post.value, ...result }
    }
    emit('updated', post.value)
  } catch {
    post.value.savedByMe = before
  } finally {
    busyAction.value = ''
  }
}

async function onRepost() {
  if (!canUseAction()) return
  const before = { repostedByMe: post.value.repostedByMe, repostCount: post.value.repostCount }
  busyAction.value = 'repost'
  try {
    if (isLocalDemoPost.value) {
      post.value = toggleDemoRepost(post.value)
    } else if (isRemotePost.value) {
      post.value.repostedByMe = !before.repostedByMe
      post.value.repostCount += post.value.repostedByMe ? 1 : -1
      const result = await toggleRepost(post.value.id)
      post.value = { ...post.value, ...result }
    }
    emit('updated', post.value)
  } catch {
    post.value = { ...post.value, ...before }
  } finally {
    busyAction.value = ''
  }
}
</script>

<template>
  <div
    ref="cardRef"
    class="w-full"
  >
    <button
      type="button"
      class="block w-full overflow-hidden rounded-2xl bg-mount transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-umber"
      @click="emit('select', post)"
      @pointerdown="press(0.94)"
      @pointerup="press(1)"
      @pointerleave="press(1)"
    >
      <img
        :src="post.imagePath"
        :width="post.imageWidth"
        :height="post.imageHeight"
        :alt="post.caption || `Photo by ${post.authorHandle}`"
        class="block h-auto w-full"
        loading="lazy"
      />
    </button>
    <div class="mt-2 flex h-8 items-center justify-between gap-1 px-1 text-graphite/60">
      <button
        type="button"
        class="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium transition hover:text-umber disabled:cursor-not-allowed disabled:opacity-40"
        :class="post.likedByMe ? 'text-umber' : ''"
        :aria-label="post.likedByMe ? t('liked') : t('like')"
        :disabled="(!isLocalDemoPost && !auth.isSignedIn) || busyAction"
        @click.stop="onLike"
      >
        <svg viewBox="0 0 24 24" :fill="post.likedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4 shrink-0">
          <path d="M20.8 8.7c0 5.4-8.8 10.2-8.8 10.2S3.2 14.1 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" />
        </svg>
        <span>{{ post.likeCount }}</span>
      </button>

      <button
        type="button"
        class="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium transition hover:text-graphite"
        :aria-label="t('comments')"
        @click.stop="emit('select', post)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4 shrink-0">
          <path d="M20 11.5a7.5 7.5 0 0 1-7.8 7.5 8.2 8.2 0 0 1-3.4-.7L4 20l1.7-4.1A7.3 7.3 0 0 1 4.5 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />
        </svg>
        <span>{{ post.commentCount }}</span>
      </button>

      <button
        type="button"
        class="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium transition hover:text-graphite disabled:cursor-not-allowed disabled:opacity-40"
        :class="post.repostedByMe ? 'text-umber' : ''"
        :aria-label="post.repostedByMe ? t('reposted') : t('repost')"
        :disabled="(!isLocalDemoPost && !auth.isSignedIn) || busyAction"
        @click.stop="onRepost"
      >
        <svg viewBox="0 0 24 24" :fill="post.repostedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4 shrink-0">
          <path d="M17 3l4 4-4 4" />
          <path d="M3 11V9a2 2 0 0 1 2-2h16" />
          <path d="M7 21l-4-4 4-4" />
          <path d="M21 13v2a2 2 0 0 1-2 2H3" />
        </svg>
        <span>{{ post.repostCount }}</span>
      </button>

      <button
        type="button"
        class="inline-flex items-center text-[11px] font-medium transition hover:text-graphite disabled:cursor-not-allowed disabled:opacity-40"
        :class="post.savedByMe ? 'text-umber' : ''"
        :aria-label="post.savedByMe ? t('saved') : t('save')"
        :disabled="(!isLocalDemoPost && !auth.isSignedIn) || busyAction"
        @click.stop="onSave"
      >
        <svg viewBox="0 0 24 24" :fill="post.savedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4">
          <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z" />
        </svg>
      </button>
    </div>
  </div>
</template>
