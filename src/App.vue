<script setup>
import { RouterView } from 'vue-router'
import FloatingNav from '@/components/nav/FloatingNav.vue'
</script>

<template>
  <div class="min-h-screen bg-wall text-graphite">
    <FloatingNav />
    <RouterView />
  </div>
</template>
