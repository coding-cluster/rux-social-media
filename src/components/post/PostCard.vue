<script setup>
import { ref } from 'vue'
import { gsap, prefersReducedMotion } from '@/motion'

defineProps({ post: { type: Object, required: true } })
defineEmits(['select'])

const cardRef = ref(null)

function press(scale) {
  if (prefersReducedMotion()) return
  gsap.to(cardRef.value, { scale, duration: 0.2, ease: 'power2.out' })
}
</script>

<template>
  <button
    ref="cardRef"
    type="button"
    class="block w-full overflow-hidden rounded-2xl bg-mount transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-umber"
    @click="$emit('select')"
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
</template>
