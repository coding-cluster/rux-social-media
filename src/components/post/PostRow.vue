<script setup>
import PostLabel from './PostLabel.vue'
import PostMedia from './PostMedia.vue'

defineProps({
  post: { type: Object, required: true },
  drawDatum: { type: Boolean, default: false },
})
</script>

<template>
  <article data-post-row class="flex flex-col gap-4 md:grid md:grid-cols-[220px_1fr] md:gap-x-10 md:items-start">
    <PostLabel :post="post" />
    <RouterLink :to="{ name: 'post', params: { id: post.id } }" class="block w-full md:max-w-[720px]" :data-flip-id="post.id">
      <PostMedia :post="post" :draw-datum="drawDatum" />
    </RouterLink>
  </article>
</template>
