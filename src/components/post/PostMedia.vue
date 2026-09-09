<script setup>
defineProps({
  post: { type: Object, required: true },
  height: { type: String, default: '420px' },
  drawDatum: { type: Boolean, default: false },
})
</script>

<template>
  <div class="relative bg-mount" :style="{ height }">
    <div v-if="drawDatum" data-datum-line class="absolute left-0 right-0 h-px bg-graphite/15" style="top: var(--datum)" />
    <img
      :src="post.imagePath"
      :width="post.imageWidth"
      :height="post.imageHeight"
      :alt="post.caption || `Photo by ${post.authorHandle}`"
      class="absolute left-1/2 max-w-[calc(100%-48px)] max-h-[calc(100%-80px)] w-auto h-auto"
      style="top: var(--datum); transform: translate(-50%, -50%)"
    />
  </div>
</template>
