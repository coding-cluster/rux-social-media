<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { gsap, prefersReducedMotion } from '@/motion'
import PostCard from './PostCard.vue'

const props = defineProps({ posts: { type: Array, required: true } })
defineEmits(['select'])

const GAP = 16

const containerRef = ref(null)
const containerHeight = ref(0)
const positions = reactive({})
const cardEls = new Map()
const animatedIds = new Set()
let resizeObserver

function columnsForWidth(width) {
  if (width < 640) return 2
  if (width < 1024) return 3
  return 6
}

function layout() {
  const container = containerRef.value
  if (!container) return
  const width = container.clientWidth
  const cols = columnsForWidth(width)
  const colWidth = (width - GAP * (cols - 1)) / cols
  const colHeights = new Array(cols).fill(0)
  const reduced = prefersReducedMotion()
  const toReveal = []

  for (const post of props.posts) {
    let col = 0
    for (let c = 1; c < cols; c++) if (colHeights[c] < colHeights[col]) col = c

    const height = colWidth * (post.imageHeight / post.imageWidth)
    const x = col * (colWidth + GAP)
    const y = colHeights[col]
    positions[post.id] = { x, y, width: colWidth }

    const el = cardEls.get(post.id)
    if (el) {
      if (!animatedIds.has(post.id)) {
        gsap.set(el, { x, y: reduced ? y : y + 16, width: colWidth, opacity: reduced ? 1 : 0 })
        toReveal.push({ el, y })
        animatedIds.add(post.id)
      } else if (!reduced) {
        gsap.to(el, { x, y, width: colWidth, duration: 0.5, ease: 'power3.out' })
      } else {
        gsap.set(el, { x, y, width: colWidth })
      }
    }
    colHeights[col] = y + height + GAP
  }

  containerHeight.value = Math.max(0, ...colHeights) - GAP

  if (toReveal.length && !reduced) {
    gsap.to(
      toReveal.map((r) => r.el),
      { opacity: 1, y: (i) => toReveal[i].y, duration: 0.5, stagger: 0.03, ease: 'power2.out' },
    )
  }
}

function setCardEl(id, el) {
  if (el) cardEls.set(id, el)
  else cardEls.delete(id)
}

onMounted(async () => {
  await nextTick()
  layout()
  resizeObserver = new ResizeObserver(() => layout())
  resizeObserver.observe(containerRef.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())

watch(
  () => props.posts.length,
  async () => {
    await nextTick()
    layout()
  },
)
</script>

<template>
  <div ref="containerRef" class="relative" :style="{ height: containerHeight + 'px' }">
    <div
      v-for="post in posts"
      :key="post.id"
      :ref="(el) => setCardEl(post.id, el)"
      class="absolute left-0 top-0"
      :style="{ width: (positions[post.id]?.width ?? 0) + 'px' }"
    >
      <PostCard :post="post" @select="$emit('select', post)" />
    </div>
  </div>
</template>
