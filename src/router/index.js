import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'feed', component: () => import('@/views/FeedView.vue') },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('@/views/MessagesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/saved',
      name: 'saved',
      component: () => import('@/views/SavedView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reposts',
      name: 'reposts',
      component: () => import('@/views/RepostsView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue') },
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

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.ready
  if (to.meta.requiresAuth && !auth.isSignedIn) {
    return { name: 'auth', query: { next: to.fullPath } }
  }
})

export default router
