<script setup>
import { ref, onMounted } from 'vue'
import { getPost, toggleLike } from '@/api/posts'
import { getComments, addComment } from '@/api/comments'
import { useAuthStore } from '@/stores/auth'
import PostLabel from '@/components/post/PostLabel.vue'
import PostMedia from '@/components/post/PostMedia.vue'
import { useMark } from '@/motion/useMark'

const props = defineProps({ id: String })
const auth = useAuthStore()

const post = ref(null)
const comments = ref([])
const draft = ref('')
const posting = ref(false)
const markRef = ref(null)
const playMark = useMark(markRef)

onMounted(async () => {
  post.value = await getPost(props.id)
  comments.value = await getComments(props.id)
})

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

async function submitComment() {
  if (!draft.value.trim() || !auth.isSignedIn) return
  posting.value = true
  const comment = await addComment({
    postId: post.value.id,
    authorId: auth.session.userId,
    authorHandle: auth.session.handle,
    authorDisplayName: auth.session.handle,
    body: draft.value.trim(),
  })
  comments.value.push(comment)
  draft.value = ''
  posting.value = false
}
</script>

<template>
  <main v-if="post" class="max-w-[980px] mx-auto px-6 py-12">
    <article class="flex flex-col gap-4 md:grid md:grid-cols-[220px_1fr] md:gap-x-10 md:items-start">
      <div class="flex flex-col gap-3">
        <PostLabel :post="post" align="left" />
        <button
          class="w-fit flex items-center gap-2 text-xs tracking-[0.05em] font-medium"
          :class="post.likedByMe ? 'text-ultramarine' : 'text-graphite/60 hover:text-graphite'"
          @click="onLike"
        >
          <span
            ref="markRef"
            class="inline-block w-[6px] h-[6px] bg-ultramarine"
            :style="{ transform: post.likedByMe ? 'scale(1)' : 'scale(0)' }"
          />
          {{ post.likedByMe ? 'Liked' : 'Like' }}
        </button>
      </div>
      <PostMedia :post="post" height="560px" class="md:max-w-[720px]" />
    </article>

    <section class="mt-16 md:ml-[260px] max-w-[720px] flex flex-col gap-6">
      <p v-if="!comments.length" class="text-sm text-graphite/60">No comments yet.</p>
      <ul v-else class="flex flex-col gap-4">
        <li v-for="c in comments" :key="c.id">
          <RouterLink :to="{ name: 'profile', params: { handle: c.authorHandle } }" class="text-sm font-medium hover:text-ultramarine">
            {{ c.authorDisplayName }}
          </RouterLink>
          <p class="text-base">{{ c.body }}</p>
        </li>
      </ul>

      <form v-if="auth.isSignedIn" class="flex gap-3" @submit.prevent="submitComment">
        <input
          v-model="draft"
          type="text"
          maxlength="280"
          placeholder="Write a comment"
          class="flex-1 bg-wall-deep px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ultramarine"
        />
        <button type="submit" class="text-sm font-medium hover:text-ultramarine disabled:opacity-50" :disabled="posting">Post</button>
      </form>
    </section>
  </main>
  <p v-else class="max-w-[980px] mx-auto px-6 py-12 text-sm text-graphite/60">Loading…</p>
</template>
