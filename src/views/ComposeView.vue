<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { createPost } from '@/api/posts'
import { t } from '@/i18n'

const router = useRouter()
const auth = useAuthStore()

const file = ref(null)
const preview = ref(null)
const dimensions = ref(null)
const caption = ref('')
const publishing = ref(false)
const error = ref('')

function onFileChange(e) {
  const picked = e.target.files[0]
  if (!picked) return
  file.value = picked
  preview.value = URL.createObjectURL(picked)
  const img = new Image()
  img.onload = () => {
    dimensions.value = { width: img.naturalWidth, height: img.naturalHeight }
  }
  img.src = preview.value
}

async function publish() {
  if (!file.value || !dimensions.value) return
  publishing.value = true
  error.value = ''
  try {
    const post = await createPost({
      authorId: auth.session.userId,
      authorHandle: auth.session.handle,
      authorDisplayName: auth.session.handle,
      authorAvatarPath: null,
      caption: caption.value || null,
      imagePath: preview.value,
      imageWidth: dimensions.value.width,
      imageHeight: dimensions.value.height,
    })
    // land on the profile with the new post already expanded, card-style —
    // no separate post/comments page for a freshly hung photo
    router.push({ name: 'profile', params: { handle: auth.session.handle }, query: { post: post.id } })
  } catch (e) {
    error.value = e.message
  } finally {
    publishing.value = false
  }
}
</script>

<template>
  <main class="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-8">
    <div class="flex w-full max-w-[560px] flex-col gap-6 rounded-[32px] bg-mount p-10 shadow-2xl">
      <div class="flex flex-col gap-1">
        <h1 class="text-xl font-expanded font-semibold tracking-[-0.02em]">{{ t('hangSomething') }}</h1>
        <p class="text-sm text-graphite/60">{{ t('hangSubtitle') }}</p>
      </div>

      <label
        class="relative flex h-[320px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-graphite/20 bg-wall-deep text-center transition hover:border-umber/50"
      >
        <input type="file" accept="image/*" class="absolute inset-0 cursor-pointer opacity-0" @change="onFileChange" />
        <img v-if="preview" :src="preview" alt="Preview" class="absolute inset-0 h-full w-full object-cover" />
        <template v-else>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-graphite/40">
            <path d="M15 8h.01" />
            <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-14a1 1 0 0 1 1 -1z" />
            <path d="M4 15l4 -4a3 5 0 0 1 3 0l5 5" />
            <path d="M14 14l1 -1a3 5 0 0 1 3 0l2 2" />
          </svg>
          <p class="text-sm font-medium text-graphite/60">{{ t('choosePhoto') }}</p>
        </template>
      </label>

      <label class="flex flex-col gap-2">
        <span class="text-xs font-medium text-graphite/60">{{ t('caption') }}</span>
        <textarea
          v-model="caption"
          maxlength="280"
          rows="3"
          :placeholder="t('captionPlaceholder')"
          class="rounded-2xl bg-wall-deep px-4 py-3 text-sm italic outline-none focus-visible:ring-2 focus-visible:ring-umber"
        />
      </label>

      <p v-if="error" class="text-sm text-umber">{{ error }}</p>

      <button
        class="rounded-full bg-umber py-3 text-sm font-medium text-wall transition hover:brightness-110 disabled:opacity-50"
        :disabled="!file || publishing"
        @click="publish"
      >
        {{ publishing ? t('hanging') : t('hangIt') }}
      </button>
    </div>
  </main>
</template>
