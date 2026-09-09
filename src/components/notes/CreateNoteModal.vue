<script setup>
import { ref, onBeforeUnmount, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { createNote, searchItunes } from '@/api/notes'
import { t } from '@/i18n'

const emit = defineEmits(['close', 'created'])
const auth = useAuthStore()
const search = ref('')
const results = ref([])
const selectedTrack = ref(null)
const body = ref('')
const searching = ref(false)
const creating = ref(false)
const error = ref('')
let searchTimer

watch(search, () => {
  clearTimeout(searchTimer)
  selectedTrack.value = null
  if (search.value.trim().length < 2) {
    results.value = []
    return
  }

  searchTimer = setTimeout(async () => {
    searching.value = true
    error.value = ''
    try {
      results.value = await searchItunes(search.value)
    } catch (searchError) {
      error.value = searchError.message
    } finally {
      searching.value = false
    }
  }, 350)
})

function selectTrack(track) {
  selectedTrack.value = track
  search.value = `${track.name} — ${track.artist}`
  results.value = []
}

async function save() {
  if (!selectedTrack.value || !body.value.trim() || creating.value) return
  creating.value = true
  error.value = ''
  try {
    const note = await createNote({
      body: body.value,
      track: selectedTrack.value,
      authorHandle: auth.session.handle,
      authorDisplayName: auth.session.displayName || auth.session.handle,
    })
    emit('created', note)
  } catch (saveError) {
    error.value = saveError.message
  } finally {
    creating.value = false
  }
}

onBeforeUnmount(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="fixed inset-0 z-[70] flex items-center justify-center bg-graphite/50 p-5 backdrop-blur-sm" @click.self="emit('close')">
    <div class="max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-3xl bg-mount p-6 text-graphite shadow-2xl sm:p-7">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-[10px] font-medium uppercase tracking-[0.18em] text-graphite/45">Rux</p>
          <h2 class="mt-1 text-xl font-expanded font-semibold">{{ t('newNote') }}</h2>
        </div>
        <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full bg-wall-deep/60 transition hover:bg-graphite hover:text-wall" :aria-label="t('close')" @click="emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-4 w-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <label class="mt-7 flex flex-col gap-2">
        <span class="text-xs font-medium text-graphite/60">{{ t('chooseSong') }}</span>
        <input v-model="search" type="search" :placeholder="t('searchSongs')" class="w-full rounded-full bg-wall-deep/55 px-4 py-3 text-sm outline-none placeholder:text-graphite/45 focus-visible:ring-2 focus-visible:ring-umber" />
      </label>

      <p v-if="searching" class="mt-3 text-xs text-graphite/55">{{ t('loading') }}</p>
      <div v-else-if="results.length" class="mt-3 flex max-h-52 flex-col gap-1 overflow-y-auto rounded-2xl bg-wall-deep/35 p-2">
        <button v-for="track in results" :key="track.id" type="button" class="flex items-center gap-3 rounded-xl p-2 text-left transition hover:bg-mount" @click="selectTrack(track)">
          <img :src="track.artworkUrl" :alt="track.name" class="h-11 w-11 rounded-lg object-cover" />
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium">{{ track.name }}</span>
            <span class="block truncate text-xs text-graphite/55">{{ track.artist }}</span>
          </span>
        </button>
      </div>
      <p v-else-if="search.trim().length >= 2 && !selectedTrack" class="mt-3 text-xs text-graphite/55">{{ t('noSongs') }}</p>

      <div v-if="selectedTrack" class="mt-4 flex gap-3 rounded-2xl bg-wall-deep/35 p-3">
        <img :src="selectedTrack.artworkUrl" :alt="selectedTrack.name" class="h-16 w-16 rounded-xl object-cover" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ selectedTrack.name }}</p>
          <p class="truncate text-xs text-graphite/55">{{ selectedTrack.artist }}</p>
          <audio v-if="selectedTrack.previewUrl" :src="selectedTrack.previewUrl" controls class="mt-2 h-7 w-full" />
          <a :href="selectedTrack.trackUrl" target="_blank" rel="noreferrer" class="mt-2 inline-block text-[10px] text-umber hover:underline">{{ t('itunesAttribution') }}</a>
        </div>
      </div>

      <label class="mt-5 flex flex-col gap-2">
        <span class="text-xs font-medium text-graphite/60">{{ t('notePlaceholder') }}</span>
        <textarea v-model="body" maxlength="80" rows="3" :placeholder="t('noteBodyPlaceholder')" class="resize-none rounded-2xl bg-wall-deep/55 px-4 py-3 text-sm outline-none placeholder:text-graphite/45 focus-visible:ring-2 focus-visible:ring-umber" />
        <span class="text-right text-[10px] text-graphite/45">{{ body.length }}/80</span>
      </label>

      <p v-if="error" class="mt-3 text-sm text-umber">{{ error }}</p>
      <button type="button" class="mt-5 w-full rounded-full bg-umber py-3 text-sm font-medium text-wall transition hover:brightness-110 disabled:opacity-50" :disabled="creating || !selectedTrack || !body.trim()" @click="save">
        {{ creating ? t('loading') : t('saveNote') }}
      </button>
    </div>
  </div>
</template>
