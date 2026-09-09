<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  getConversations,
  getConversation,
  getMessageProfiles,
  markConversationRead,
  sendMessage,
  subscribeToIncomingMessages,
} from '@/api/messages'
import LoadingMark from '@/components/ui/LoadingMark.vue'
import { t } from '@/i18n'

const route = useRoute()
const profiles = ref([])
const conversations = ref([])
const activeUser = ref(null)
const messages = ref([])
const search = ref('')
const draft = ref('')
const loading = ref(true)
const loadingConversation = ref(false)
const sending = ref(false)
const error = ref('')
const messagesEnd = ref(null)
let stopRealtime = null

const filteredProfiles = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return profiles.value
  return profiles.value.filter((profile) => `${profile.displayName} ${profile.handle}`.toLowerCase().includes(query))
})

function initials(profile) {
  return profile.displayName?.charAt(0)?.toUpperCase() || profile.handle.charAt(0).toUpperCase()
}

function formatTime(iso) {
  return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

async function scrollToBottom() {
  await nextTick()
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
}

async function selectUser(user) {
  activeUser.value = user
  loadingConversation.value = true
  error.value = ''
  try {
    messages.value = await getConversation(user.id)
    await markConversationRead(user.id)
    conversations.value = await getConversations()
    await scrollToBottom()
  } catch (loadError) {
    error.value = loadError.message
  } finally {
    loadingConversation.value = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    profiles.value = await getMessageProfiles()
    conversations.value = await getConversations()

    const requestedHandle = route.query.to
    const requestedUser = requestedHandle
      ? profiles.value.find((profile) => profile.handle === requestedHandle || profile.id === requestedHandle)
      : null
    const firstUser = requestedUser || conversations.value[0]?.user
    if (firstUser) await selectUser(firstUser)
  } catch (loadError) {
    error.value = loadError.message
  } finally {
    loading.value = false
  }
}

async function submitMessage() {
  if (!activeUser.value || !draft.value.trim() || sending.value) return
  sending.value = true
  error.value = ''
  try {
    const message = await sendMessage(activeUser.value.id, draft.value)
    messages.value.push(message)
    draft.value = ''
    conversations.value = await getConversations()
    await scrollToBottom()
  } catch (sendError) {
    error.value = sendError.message
  } finally {
    sending.value = false
  }
}

async function handleIncomingMessage(message) {
  let sender = profiles.value.find((profile) => profile.id === message.senderId)
  if (!sender) {
    profiles.value = await getMessageProfiles()
    sender = profiles.value.find((profile) => profile.id === message.senderId)
  }
  if (!sender) return

  if (activeUser.value?.id === message.senderId) {
    messages.value.push(message)
    await markConversationRead(sender.id)
    await scrollToBottom()
  }

  conversations.value = await getConversations()
}

watch(messages, scrollToBottom)

onMounted(async () => {
  await load()
  try {
    stopRealtime = await subscribeToIncomingMessages(handleIncomingMessage)
  } catch (subscriptionError) {
    error.value = subscriptionError.message
  }
})

onBeforeUnmount(() => stopRealtime?.())
</script>

<template>
  <main class="mx-auto max-w-[1180px] px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16">
    <header class="mb-8">
      <p class="text-[10px] font-medium uppercase tracking-[0.18em] text-graphite/45">{{ t('inboxLabel') }}</p>
      <h1 class="mt-1 text-2xl font-expanded font-semibold tracking-[-0.035em] sm:text-3xl">{{ t('messages') }}</h1>
      <p class="mt-2 text-sm text-graphite/60">{{ t('messagesSubtitle') }}</p>
    </header>

    <LoadingMark v-if="loading" />
    <p v-else-if="error && !activeUser" class="text-sm text-umber">{{ error }}</p>

    <div v-else class="grid min-h-[620px] overflow-hidden rounded-3xl border border-graphite/10 bg-mount shadow-[0_18px_50px_rgba(53,47,39,0.06)] lg:grid-cols-[300px_1fr]">
      <aside class="border-b border-graphite/10 bg-mount lg:border-b-0 lg:border-r">
        <div class="p-4 sm:p-5">
          <input
            v-model="search"
            type="search"
            :placeholder="t('searchPeople')"
            class="w-full rounded-full bg-wall-deep/55 px-4 py-2.5 text-sm outline-none placeholder:text-graphite/45 focus-visible:ring-2 focus-visible:ring-umber"
          />
        </div>

        <div class="max-h-[360px] overflow-y-auto px-3 pb-4 lg:max-h-[570px]">
          <p class="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-graphite/45">{{ t('conversations') }}</p>
          <div v-if="!conversations.length" class="px-2 pb-5 text-xs leading-5 text-graphite/55">{{ t('noConversations') }}</div>
          <button
            v-for="conversation in conversations"
            :key="conversation.user.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-wall-deep/50"
            :class="activeUser?.id === conversation.user.id ? 'bg-wall-deep/60' : ''"
            @click="selectUser(conversation.user)"
          >
            <img v-if="conversation.user.avatarPath" :src="conversation.user.avatarPath" :alt="conversation.user.displayName" class="h-10 w-10 rounded-full object-cover" />
            <span v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-umber text-sm font-medium text-wall">{{ initials(conversation.user) }}</span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center justify-between gap-2">
                <span class="truncate text-sm font-medium">{{ conversation.user.displayName }}</span>
                <span v-if="conversation.unreadCount" class="rounded-full bg-umber px-1.5 py-0.5 text-[10px] text-wall">{{ conversation.unreadCount }}</span>
              </span>
              <span class="mt-0.5 block truncate text-xs text-graphite/50">{{ conversation.lastMessage }}</span>
            </span>
          </button>

          <p class="px-2 pb-2 pt-5 text-[10px] font-medium uppercase tracking-[0.16em] text-graphite/45">{{ t('people') }}</p>
          <p v-if="!filteredProfiles.length" class="px-2 text-xs leading-5 text-graphite/55">{{ t('noPeople') }}</p>
          <button
            v-for="profile in filteredProfiles"
            :key="profile.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-wall-deep/50"
            :class="activeUser?.id === profile.id ? 'bg-wall-deep/60' : ''"
            @click="selectUser(profile)"
          >
            <img v-if="profile.avatarPath" :src="profile.avatarPath" :alt="profile.displayName" class="h-10 w-10 rounded-full object-cover" />
            <span v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-graphite text-sm font-medium text-wall">{{ initials(profile) }}</span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium">{{ profile.displayName }}</span>
              <span class="block truncate text-xs text-graphite/50">@{{ profile.handle }}</span>
            </span>
          </button>
        </div>
      </aside>

      <section class="flex min-h-[620px] flex-col bg-wall/35">
        <template v-if="activeUser">
          <header class="flex items-center gap-3 border-b border-graphite/10 bg-mount px-5 py-4 sm:px-7">
            <img v-if="activeUser.avatarPath" :src="activeUser.avatarPath" :alt="activeUser.displayName" class="h-10 w-10 rounded-full object-cover" />
            <span v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-umber text-sm font-medium text-wall">{{ initials(activeUser) }}</span>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ activeUser.displayName }}</p>
              <p class="truncate text-xs text-graphite/50">@{{ activeUser.handle }}</p>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            <div v-if="loadingConversation" class="flex min-h-64 items-center justify-center">
              <img src="/letras-rux.png" :alt="t('loading')" class="w-28 animate-pulse" />
            </div>
            <div v-else-if="!messages.length" class="flex h-full min-h-64 flex-col items-center justify-center text-center">
              <p class="text-sm font-medium">{{ t('noMessagesYet') }}</p>
              <p class="mt-1 text-xs text-graphite/55">{{ t('selectConversationHint') }}</p>
            </div>
            <div v-else class="flex flex-col gap-3">
              <div v-for="message in messages" :key="message.id" class="flex" :class="message.isMine ? 'justify-end' : 'justify-start'">
                <div class="max-w-[78%] sm:max-w-[65%]">
                  <div v-if="message.replyNote" class="mb-1 rounded-2xl border border-umber/15 bg-mount/80 px-3 py-2 text-xs text-graphite/65">
                    <p class="font-medium text-umber">{{ t('noteReply') }}</p>
                    <p class="mt-1 line-clamp-2">{{ message.replyNote.body }}</p>
                    <p class="mt-1 truncate text-[10px] text-graphite/45">{{ message.replyNote.trackName }} · {{ message.replyNote.artistName }}</p>
                  </div>
                  <p
                    class="rounded-2xl px-4 py-2.5 text-sm leading-5"
                    :class="message.isMine ? 'rounded-br-md bg-graphite text-wall' : 'rounded-bl-md bg-mount text-graphite shadow-sm'"
                  >
                    {{ message.body }}
                  </p>
                  <p class="mt-1 px-1 text-[10px] text-graphite/45" :class="message.isMine ? 'text-right' : ''">{{ formatTime(message.createdAt) }}</p>
                </div>
              </div>
              <div ref="messagesEnd" />
            </div>
          </div>

          <form class="flex gap-3 border-t border-graphite/10 bg-mount p-4 sm:p-5" @submit.prevent="submitMessage">
            <input
              v-model="draft"
              type="text"
              maxlength="2000"
              :placeholder="t('messagePlaceholder')"
              class="min-w-0 flex-1 rounded-full bg-wall-deep/55 px-4 py-3 text-sm outline-none placeholder:text-graphite/45 focus-visible:ring-2 focus-visible:ring-umber"
            />
            <button type="submit" class="rounded-full bg-umber px-4 py-2 text-sm font-medium text-wall transition hover:brightness-110 disabled:opacity-50" :disabled="sending || !draft.trim()">
              {{ sending ? t('loading') : t('send') }}
            </button>
          </form>
          <p v-if="error" class="bg-mount px-5 pb-4 text-sm text-umber sm:px-7">{{ error }}</p>
        </template>

        <div v-else class="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-mount text-graphite/50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6" aria-hidden="true">
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" />
            </svg>
          </div>
          <h2 class="mt-4 text-lg font-expanded font-semibold">{{ t('selectConversation') }}</h2>
          <p class="mt-1 max-w-[32ch] text-sm text-graphite/55">{{ t('selectConversationHint') }}</p>
        </div>
      </section>
    </div>
  </main>
</template>
