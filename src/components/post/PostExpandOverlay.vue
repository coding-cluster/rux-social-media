<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { toggleLike } from '@/api/posts'
import { useMark } from '@/motion/useMark'

const props = defineProps({ post: { type: Object, required: true } })
const emit = defineEmits(['close'])

// local copy so optimistic like-toggling doesn't mutate the feed list's post object directly
const post = ref({ ...props.post })
const markRef = ref(null)
const playMark = useMark(markRef)

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

async function onLike() {
  const before = { likedByMe: post.value.likedByMe, likeCount: post.value.likeCount }
  post.value.likedByMe = !before.likedByMe
  post.value.likeCount += post.value.likedByMe ? 1 : -1
  playMark(post.value.likedByMe)
  try {
    await toggleLike(post.value.id)
  } catch {
    post.value.likedByMe = before.likedByMe
    post.value.likeCount = before.likeCount
    playMark(post.value.likedByMe)
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-graphite/60 p-6" @click.self="emit('close')">
    <div class="flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-y-auto rounded-3xl bg-mount shadow-2xl">
      <img
        :src="post.imagePath"
        :alt="post.caption || `Photo by ${post.authorHandle}`"
        class="max-h-[55vh] w-full rounded-t-3xl object-cover"
      />
      <div class="flex flex-col gap-3 p-6">
        <div class="flex items-center gap-3">
          <img
            v-if="post.authorAvatarPath"
            :src="post.authorAvatarPath"
            :alt="post.authorDisplayName"
            class="h-8 w-8 rounded-full object-cover"
          />
          <RouterLink
            :to="{ name: 'profile', params: { handle: post.authorHandle } }"
            class="text-sm font-medium hover:text-umber"
          >
            {{ post.authorDisplayName }}
          </RouterLink>
        </div>
        <p v-if="post.caption" class="text-md italic leading-[1.55] text-graphite">{{ post.caption }}</p>
        <button
          class="flex w-fit items-center gap-2 text-xs font-medium tracking-[0.05em]"
          :class="post.likedByMe ? 'text-umber' : 'text-graphite/60 hover:text-graphite'"
          @click="onLike"
        >
          <span
            ref="markRef"
            class="inline-block h-[6px] w-[6px] bg-umber"
            :style="{ transform: post.likedByMe ? 'scale(1)' : 'scale(0)' }"
          />
          {{ post.likedByMe ? 'Liked' : 'Like' }} · {{ post.likeCount }}
        </button>
      </div>
    </div>
  </div>
</template>
