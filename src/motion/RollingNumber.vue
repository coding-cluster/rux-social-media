<script setup>
// Two stacked spans + a yPercent tween — no SplitText needed. Shared by
// Mark (likes) and any other count that changes (comments, follows).
import { ref, watch, nextTick } from 'vue'
import { gsap, prefersReducedMotion } from './index'

const props = defineProps({ value: { type: [Number, String], required: true } })

const prev = ref(props.value)
const current = ref(props.value)
const trackRef = ref(null)

watch(
  () => props.value,
  async (newVal, oldVal) => {
    if (newVal === oldVal) return
    prev.value = oldVal
    current.value = newVal

    if (prefersReducedMotion()) {
      prev.value = newVal
      return
    }

    await nextTick()
    gsap.fromTo(
      trackRef.value,
      { yPercent: 0 },
      {
        yPercent: -50,
        duration: 0.25,
        ease: 'power3.out',
        onComplete: () => {
          prev.value = newVal
          gsap.set(trackRef.value, { yPercent: 0 })
        },
      },
    )
  },
)
</script>

<template>
  <span class="inline-block h-[1em] overflow-hidden align-bottom">
    <span ref="trackRef" class="block">
      <span class="block h-[1em] leading-[1em]">{{ prev }}</span>
      <span class="block h-[1em] leading-[1em]">{{ current }}</span>
    </span>
  </span>
</template>
