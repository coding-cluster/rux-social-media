<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { createPost } from '@/api/posts'

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
    router.push({ name: 'post', params: { id: post.id } })
  } catch (e) {
    error.value = e.message
  } finally {
    publishing.value = false
  }
}
</script>

<template>
  <main class="max-w-[480px] px-6 py-16 flex flex-col gap-6">
    <h1 class="text-lg font-expanded font-semibold tracking-[-0.02em]">Hang something</h1>

    <label class="flex flex-col gap-2">
      <span class="text-sm font-medium">Photo</span>
      <input
        type="file"
        accept="image/*"
        class="text-sm file:mr-3 file:px-3 file:py-2 file:border-0 file:bg-wall-deep file:text-sm file:font-medium"
        @change="onFileChange"
      />
    </label>

    <div v-if="preview" class="relative bg-mount h-[420px]">
      <img
        :src="preview"
        :width="dimensions?.width"
        :height="dimensions?.height"
        alt="Preview"
        class="absolute left-1/2 max-w-[calc(100%-48px)] max-h-[calc(100%-80px)] w-auto h-auto"
        style="top: var(--datum); transform: translate(-50%, -50%)"
      />
    </div>

    <label class="flex flex-col gap-2">
      <span class="text-sm font-medium">Caption</span>
      <textarea
        v-model="caption"
        maxlength="280"
        rows="3"
        class="italic text-md bg-wall-deep px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ultramarine"
      />
    </label>

    <p v-if="error" class="text-sm text-ultramarine">{{ error }}</p>

    <button
      class="w-fit px-4 py-2 bg-graphite text-wall text-sm font-medium disabled:opacity-50"
      :disabled="!file || publishing"
      @click="publish"
    >
      {{ publishing ? 'Hanging…' : 'Hang it' }}
    </button>
  </main>
</template>
