<script setup>
import RollingNumber from '@/motion/RollingNumber.vue'

defineProps({
  post: { type: Object, required: true },
  align: { type: String, default: 'right' },
})

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}
</script>

<template>
  <div :class="['flex flex-col gap-1', align === 'right' ? 'md:text-right md:items-end' : 'text-left items-start']">
    <RouterLink
      :to="{ name: 'profile', params: { handle: post.authorHandle } }"
      class="text-sm font-medium text-graphite hover:text-umber"
    >
      {{ post.authorDisplayName }}
    </RouterLink>
    <p class="text-xs tracking-[0.05em] text-graphite/60">{{ timeAgo(post.createdAt) }}</p>
    <p v-if="post.caption" class="italic text-md leading-[1.55] max-w-[62ch] text-graphite">
      {{ post.caption }}
    </p>
    <p class="text-xs tracking-[0.05em] text-graphite/60"><RollingNumber :value="post.likeCount" /> likes</p>
  </div>
</template>
