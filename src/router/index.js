import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'feed', component: () => import('@/views/FeedView.vue') },
    { path: '/p/:id', name: 'post', component: () => import('@/views/PostView.vue'), props: true },
    { path: '/u/:handle', name: 'profile', component: () => import('@/views/ProfileView.vue'), props: true },
    {
      path: '/compose',
      name: 'compose',
      component: () => import('@/views/ComposeView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/auth', name: 'auth', component: () => import('@/views/AuthView.vue') },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isSignedIn) {
    return { name: 'auth', query: { next: to.fullPath } }
  }
})

export default router
