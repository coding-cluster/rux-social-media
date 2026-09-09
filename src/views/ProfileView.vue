<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getProfileByHandle, updateProfileAppearance } from '@/api/profiles'
import { getFollowCounts } from '@/api/follows'
import { getPostsByHandle } from '@/api/posts'
import MasonryGrid from '@/components/post/MasonryGrid.vue'
import PostExpandOverlay from '@/components/post/PostExpandOverlay.vue'
import LoadingMark from '@/components/ui/LoadingMark.vue'
import { t } from '@/i18n'

const props = defineProps({ handle: String })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const profile = ref(null)
const posts = ref([])
const loading = ref(true)
const expandedPost = ref(null)
const followerCount = ref(0)
const followingCount = ref(0)
const totalLikes = computed(() => posts.value.reduce((total, post) => total + post.likeCount, 0))
const totalComments = computed(() => posts.value.reduce((total, post) => total + post.commentCount, 0))
const isOwnProfile = computed(() => auth.isSignedIn && auth.session.userId === profile.value?.id)
const showEditProfile = ref(false)
const savingProfile = ref(false)
const profileError = ref('')
const avatarInput = ref(null)
const avatarFile = ref(null)
const avatarPreview = ref('')
const avatarPreviewUrl = ref('')
const avatarMode = ref('style')
const avatarEmoji = ref('')
const avatarColor = ref('#7a4a2a')
const avatarColors = ['#7a4a2a', '#22231f', '#b39a76', '#6f7c57', '#315c67', '#a64d3c']
const avatarEmojis = ['✦', '☀', '☁', '✿', '♥', '⚡', '🎧', '🌙', '🛸']

function updatePostInProfile(updatedPost) {
  const index = posts.value.findIndex((post) => post.id === updatedPost.id)
  if (index !== -1) posts.value[index] = { ...posts.value[index], ...updatedPost }
}

function removePostFromProfile(postId) {
  posts.value = posts.value.filter((post) => post.id !== postId)
  expandedPost.value = null
}

function clearAvatarPreviewUrl() {
  if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value)
  avatarPreviewUrl.value = ''
}

function openEditProfile() {
  profileError.value = ''
  avatarFile.value = null
  clearAvatarPreviewUrl()
  avatarPreview.value = profile.value.avatarPath || ''
  avatarMode.value = profile.value.avatarPath ? 'image' : 'style'
  avatarEmoji.value = profile.value.avatarEmoji || ''
  avatarColor.value = profile.value.avatarColor || '#7a4a2a'
  showEditProfile.value = true
}

function closeEditProfile() {
  if (savingProfile.value) return
  showEditProfile.value = false
  profileError.value = ''
  avatarFile.value = null
  avatarPreview.value = ''
  clearAvatarPreviewUrl()
}

function selectAvatarFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    profileError.value = t('avatarInvalidType')
    return
  }
  if (file.size > 8 * 1024 * 1024) {
    profileError.value = t('avatarTooLarge')
    return
  }
  profileError.value = ''
  clearAvatarPreviewUrl()
  avatarFile.value = file
  avatarPreviewUrl.value = URL.createObjectURL(file)
  avatarPreview.value = avatarPreviewUrl.value
  avatarMode.value = 'image'
}

function selectAvatarStyle() {
  clearAvatarPreviewUrl()
  avatarFile.value = null
  avatarPreview.value = ''
  avatarMode.value = 'style'
  avatarEmoji.value = ''
}

function selectAvatarEmoji(emoji) {
  selectAvatarStyle()
  avatarEmoji.value = emoji
}

async function saveProfileAppearance() {
  if (!isOwnProfile.value || savingProfile.value) return
  savingProfile.value = true
  profileError.value = ''
  try {
    const updated = await updateProfileAppearance({
      file: avatarFile.value,
      emoji: avatarMode.value === 'style' ? avatarEmoji.value : null,
      color: avatarColor.value,
      keepImage: avatarMode.value === 'image' && !avatarFile.value,
    })
    profile.value = { ...profile.value, ...updated }
    savingProfile.value = false
    closeEditProfile()
  } catch (saveError) {
    profileError.value = saveError.message
  } finally {
    savingProfile.value = false
  }
}

async function load() {
  loading.value = true
  profile.value = await getProfileByHandle(props.handle)
  if (profile.value) {
    const [profilePosts, followCounts] = await Promise.all([
      getPostsByHandle(props.handle),
      getFollowCounts(profile.value.id),
    ])
    posts.value = profilePosts
    followerCount.value = followCounts.followers
    followingCount.value = followCounts.following
  } else {
    posts.value = []
    followerCount.value = 0
    followingCount.value = 0
  }
  loading.value = false

  const openId = route.query.post
  if (openId) {
    const match = posts.value.find((post) => post.id === openId)
    if (match) expandedPost.value = match
    router.replace({ query: {} })
  }
}

onMounted(load)
watch(() => props.handle, load)
onBeforeUnmount(clearAvatarPreviewUrl)
</script>

<template>
  <main class="mx-auto max-w-[1180px] px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16">
    <LoadingMark v-if="loading" />
    <p v-else-if="!profile" class="text-lg font-expanded font-semibold">{{ t('noProfile') }}</p>

    <template v-else>
      <section class="relative overflow-hidden rounded-[2rem] border border-graphite/10 bg-mount p-5 shadow-[0_18px_50px_rgba(53,47,39,0.06)] sm:p-8 lg:p-10">
        <div class="pointer-events-none absolute -right-12 -top-16 select-none text-[9rem] font-expanded font-semibold leading-none tracking-[-0.12em] text-wall-deep/35 sm:text-[13rem]" aria-hidden="true">R</div>
        <div class="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-end">
            <img
              v-if="profile.avatarPath"
              :src="profile.avatarPath"
              :alt="profile.displayName"
              class="h-28 w-28 shrink-0 rounded-[1.75rem] object-cover ring-8 ring-wall/70 sm:h-36 sm:w-36"
            />
            <div v-else class="flex h-28 w-28 shrink-0 items-center justify-center rounded-[1.75rem] text-4xl font-expanded text-wall ring-8 ring-wall/70 sm:h-36 sm:w-36" :style="{ backgroundColor: profile.avatarColor || '#7a4a2a' }">
              {{ profile.avatarEmoji || profile.displayName.charAt(0).toUpperCase() }}
            </div>

            <div class="min-w-0">
              <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-umber">{{ t('profileLabel') }} / @{{ profile.handle }}</p>
              <h1 class="mt-2 max-w-[18ch] text-3xl font-expanded font-semibold leading-[0.95] tracking-[-0.055em] sm:text-4xl">{{ profile.displayName }}</h1>
              <p class="mt-2 text-sm text-graphite/50">@{{ profile.handle }}</p>
              <p v-if="profile.bio" class="mt-4 max-w-[48ch] text-[15px] leading-6 text-graphite/70">{{ profile.bio }}</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <RouterLink
              v-if="auth.isSignedIn && auth.session.userId !== profile.id"
              :to="{ name: 'messages', query: { to: profile.handle } }"
              class="inline-flex w-fit items-center gap-2 rounded-full bg-umber px-5 py-3 text-xs font-medium text-wall transition hover:brightness-110"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" />
              </svg>
              {{ t('sendMessage') }}
            </RouterLink>
            <button v-if="isOwnProfile" type="button" class="rounded-full border border-graphite/15 bg-wall/55 px-5 py-3 text-xs font-medium transition hover:bg-wall-deep" @click="openEditProfile">
              {{ t('editProfile') }}
            </button>
          </div>
        </div>

        <div class="relative mt-9 grid grid-cols-2 border-t border-graphite/10 pt-5 sm:grid-cols-5">
          <div class="border-graphite/10 px-2 first:pl-0 sm:border-r sm:px-5 sm:first:pl-0">
            <p class="text-xl font-expanded font-semibold tracking-[-0.04em]">{{ posts.length }}</p>
            <p class="mt-1 text-[10px] uppercase tracking-[0.12em] text-graphite/50">{{ t('posts') }}</p>
          </div>
          <div class="border-graphite/10 px-2 sm:border-r sm:px-5">
            <p class="text-xl font-expanded font-semibold tracking-[-0.04em]">{{ followerCount }}</p>
            <p class="mt-1 text-[10px] uppercase tracking-[0.12em] text-graphite/50">{{ t('followers') }}</p>
          </div>
          <div class="border-graphite/10 px-2 pt-4 sm:border-r sm:px-5 sm:pt-0">
            <p class="text-xl font-expanded font-semibold tracking-[-0.04em]">{{ followingCount }}</p>
            <p class="mt-1 text-[10px] uppercase tracking-[0.12em] text-graphite/50">{{ t('followingCount') }}</p>
          </div>
          <div class="border-graphite/10 px-2 pt-4 sm:border-r sm:px-5 sm:pt-0">
            <p class="text-xl font-expanded font-semibold tracking-[-0.04em]">{{ totalLikes }}</p>
            <p class="mt-1 text-[10px] uppercase tracking-[0.12em] text-graphite/50">{{ t('likes') }}</p>
          </div>
          <div class="px-2 pt-4 sm:px-5 sm:pt-0">
            <p class="text-xl font-expanded font-semibold tracking-[-0.04em]">{{ totalComments }}</p>
            <p class="mt-1 text-[10px] uppercase tracking-[0.12em] text-graphite/50">{{ t('comments') }}</p>
          </div>
        </div>
      </section>

      <section class="mt-14">
        <div class="mb-6 flex items-end justify-between border-b border-graphite/10 pb-4">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-umber">{{ t('profileArchive') }}</p>
            <h2 class="mt-1 text-xl font-expanded font-semibold tracking-[-0.04em]">{{ t('posts') }}</h2>
          </div>
          <div class="text-right">
            <p class="text-2xl font-expanded font-semibold tracking-[-0.05em]">{{ posts.length }}</p>
            <p class="text-[10px] uppercase tracking-[0.12em] text-graphite/50">{{ t('posts') }}</p>
          </div>
        </div>
        <p v-if="!posts.length" class="py-10 text-center text-sm text-graphite/60">{{ t('nothingHungYet') }}</p>
        <MasonryGrid v-else :posts="posts" @select="expandedPost = $event" />
      </section>
    </template>

    <div v-if="showEditProfile" class="fixed inset-0 z-[80] flex items-center justify-center bg-graphite/50 p-5 backdrop-blur-sm" role="presentation" @click.self="closeEditProfile">
      <div class="max-h-[90vh] w-full max-w-[500px] overflow-y-auto rounded-3xl bg-mount p-6 text-graphite shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-[0.18em] text-graphite/45">Rux</p>
            <h2 id="edit-profile-title" class="mt-1 text-xl font-expanded font-semibold">{{ t('editProfile') }}</h2>
          </div>
          <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full bg-wall-deep/60 transition hover:bg-graphite hover:text-wall" :aria-label="t('close')" :disabled="savingProfile" @click="closeEditProfile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-4 w-4" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div class="mt-7 flex items-center gap-4 rounded-2xl bg-wall-deep/35 p-4">
          <img v-if="avatarMode === 'image' && avatarPreview" :src="avatarPreview" :alt="t('avatarPreview')" class="h-20 w-20 shrink-0 rounded-[1.25rem] object-cover" />
          <div v-else class="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.25rem] text-2xl font-expanded text-wall" :style="{ backgroundColor: avatarColor }">
            {{ avatarEmoji || profile.displayName.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium">{{ profile.displayName }}</p>
            <p class="mt-1 text-xs text-graphite/55">{{ t('avatarHint') }}</p>
            <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="selectAvatarFile" />
            <button type="button" class="mt-3 rounded-full bg-umber px-3 py-2 text-xs font-medium text-wall transition hover:brightness-110" @click="avatarInput.click()">
              {{ t('uploadAvatar') }}
            </button>
          </div>
        </div>

        <div class="mt-6">
          <p class="text-xs font-medium text-graphite/60">{{ t('avatarColors') }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="color in avatarColors"
              :key="color"
              type="button"
              class="h-9 w-9 rounded-full border-2 border-mount shadow-sm transition hover:scale-105"
              :class="avatarColor === color ? 'ring-2 ring-umber ring-offset-2 ring-offset-mount' : ''"
              :style="{ backgroundColor: color }"
              :aria-label="`${t('avatarColor')} ${color}`"
              @click="avatarColor = color"
            />
          </div>
        </div>

        <div class="mt-6">
          <p class="text-xs font-medium text-graphite/60">{{ t('avatarEmojis') }}</p>
          <div class="mt-3 grid grid-cols-9 gap-2">
            <button
              v-for="emoji in avatarEmojis"
              :key="emoji"
              type="button"
              class="flex h-9 items-center justify-center rounded-xl bg-wall-deep/45 text-lg transition hover:bg-wall-deep"
              :class="avatarMode === 'style' && avatarEmoji === emoji ? 'ring-2 ring-umber' : ''"
              :aria-label="emoji"
              @click="selectAvatarEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
          <button type="button" class="mt-3 text-xs font-medium text-graphite/60 hover:text-umber" @click="selectAvatarStyle">
            {{ t('useInitial') }}
          </button>
        </div>

        <p v-if="profileError" class="mt-4 text-sm text-umber">{{ profileError }}</p>
        <div class="mt-7 flex justify-end gap-2">
          <button type="button" class="rounded-full bg-wall-deep px-4 py-2.5 text-sm font-medium transition hover:bg-graphite hover:text-wall" :disabled="savingProfile" @click="closeEditProfile">
            {{ t('cancel') }}
          </button>
          <button type="button" class="rounded-full bg-umber px-5 py-2.5 text-sm font-medium text-wall transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50" :disabled="savingProfile" @click="saveProfileAppearance">
            {{ savingProfile ? t('saving') : t('saveChanges') }}
          </button>
        </div>
      </div>
    </div>

    <PostExpandOverlay
      v-if="expandedPost"
      :post="expandedPost"
      @close="expandedPost = null"
      @updated="updatePostInProfile"
      @deleted="removePostFromProfile"
    />
  </main>
</template>
