<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getActiveNotes } from '@/api/notes'
import { sendMessage } from '@/api/messages'
import CreateNoteModal from './CreateNoteModal.vue'
import { t } from '@/i18n'

const auth = useAuthStore()
const notes = ref([])
const loading = ref(true)
const showModal = ref(false)
const replyNote = ref(null)
const replyDraft = ref('')
const sendingReply = ref(false)
const replyError = ref('')

function initials(note) {
  return note.authorDisplayName?.charAt(0)?.toUpperCase() || note.authorHandle.charAt(0).toUpperCase()
}

async function loadNotes() {
  try {
    notes.value = await getActiveNotes()
  } catch {
    notes.value = []
  } finally {
    loading.value = false
  }
}

function addNote(note) {
  notes.value = [note, ...notes.value]
  showModal.value = false
}

function openReply(note) {
  replyNote.value = note
  replyDraft.value = ''
  replyError.value = ''
}

function closeReply() {
  replyNote.value = null
  replyDraft.value = ''
  replyError.value = ''
}

async function submitReply() {
  if (!replyNote.value || !replyDraft.value.trim() || sendingReply.value) return
  sendingReply.value = true
  replyError.value = ''
  try {
    await sendMessage(replyNote.value.authorId, replyDraft.value.trim(), {
      body: replyNote.value.body,
      trackName: replyNote.value.trackName,
      artistName: replyNote.value.artistName,
    })
    closeReply()
  } catch (error) {
    replyError.value = error.message
  } finally {
    sendingReply.value = false
  }
}

onMounted(loadNotes)
</script>

<template>
  <section class="mb-10">
    <div class="mb-4 flex items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-medium uppercase tracking-[0.18em] text-graphite/45">{{ t('notes') }}</p>
        <p class="mt-1 text-sm text-graphite/60">{{ t('notePlaceholder') }}</p>
      </div>
      <button v-if="auth.isSignedIn" type="button" class="rounded-full bg-umber px-4 py-2 text-xs font-medium text-wall transition hover:brightness-110" @click="showModal = true">
        + {{ t('newNote') }}
      </button>
      <RouterLink v-else :to="{ name: 'auth' }" class="rounded-full bg-umber px-4 py-2 text-xs font-medium text-wall transition hover:brightness-110">
        + {{ t('newNote') }}
      </RouterLink>
    </div>

    <div v-if="!loading && !notes.length" class="rounded-2xl border border-dashed border-graphite/15 px-5 py-4 text-xs text-graphite/55">
      {{ t('notesEmpty') }}
    </div>
    <div v-else-if="notes.length" class="flex gap-3 overflow-x-auto pb-2">
      <article v-for="note in notes" :key="note.id" class="min-w-[250px] max-w-[280px] rounded-2xl bg-mount p-4 shadow-sm">
        <div class="flex items-center gap-2">
          <img v-if="note.authorAvatarPath" :src="note.authorAvatarPath" :alt="note.authorDisplayName" class="h-8 w-8 rounded-full object-cover" />
          <span v-else class="flex h-8 w-8 items-center justify-center rounded-full bg-umber text-xs font-medium text-wall">{{ initials(note) }}</span>
          <div class="min-w-0">
            <p class="truncate text-xs font-medium">{{ note.authorDisplayName }}</p>
            <p class="truncate text-[10px] text-graphite/50">@{{ note.authorHandle }}</p>
          </div>
        </div>
        <p class="mt-3 line-clamp-2 text-sm leading-5">{{ note.body }}</p>
        <a :href="note.trackUrl" target="_blank" rel="noreferrer" class="mt-3 flex items-center gap-2 hover:text-umber">
          <img v-if="note.artworkUrl" :src="note.artworkUrl" :alt="note.trackName" class="h-8 w-8 rounded-md object-cover" />
          <span class="min-w-0">
            <span class="block truncate text-xs font-medium">{{ note.trackName }}</span>
            <span class="block truncate text-[10px] text-graphite/50">{{ note.artistName }}</span>
          </span>
        </a>
        <audio v-if="note.previewUrl" :src="note.previewUrl" controls class="mt-3 h-7 w-full" />
        <button
          v-if="auth.isSignedIn && note.authorId !== auth.session.userId"
          type="button"
          class="mt-3 text-left text-xs font-medium text-umber hover:underline"
          @click="openReply(note)"
        >
          {{ t('reply') }}
        </button>
      </article>
    </div>

    <CreateNoteModal v-if="showModal" @close="showModal = false" @created="addNote" />

    <div v-if="replyNote" class="fixed inset-0 z-[70] flex items-center justify-center bg-graphite/50 p-5 backdrop-blur-sm" @click.self="closeReply">
      <form class="w-full max-w-[400px] rounded-3xl bg-mount p-6 shadow-2xl" @submit.prevent="submitReply">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-[0.18em] text-graphite/45">{{ t('replyToNote') }}</p>
            <h2 class="mt-1 text-lg font-expanded font-semibold">@{{ replyNote.authorHandle }}</h2>
          </div>
          <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full bg-wall-deep/60 hover:bg-graphite hover:text-wall" :aria-label="t('close')" @click="closeReply">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-4 w-4" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div class="mt-5 rounded-2xl bg-wall-deep/35 p-3">
          <p class="text-sm">{{ replyNote.body }}</p>
          <p class="mt-1 text-xs text-graphite/55">{{ replyNote.trackName }} · {{ replyNote.artistName }}</p>
        </div>
        <textarea v-model="replyDraft" maxlength="2000" rows="4" :placeholder="t('replyPlaceholder')" class="mt-4 w-full resize-none rounded-2xl bg-wall-deep/55 px-4 py-3 text-sm outline-none placeholder:text-graphite/45 focus-visible:ring-2 focus-visible:ring-umber" />
        <p v-if="replyError" class="mt-2 text-sm text-umber">{{ replyError }}</p>
        <button type="submit" class="mt-4 w-full rounded-full bg-umber py-3 text-sm font-medium text-wall transition hover:brightness-110 disabled:opacity-50" :disabled="sendingReply || !replyDraft.trim()">
          {{ sendingReply ? t('loading') : t('sendReply') }}
        </button>
      </form>
    </div>
  </section>
</template>
