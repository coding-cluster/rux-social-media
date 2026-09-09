<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { toggleLike, toggleSaved, toggleRepost, updatePost, deletePost } from '@/api/posts'
import { addComment, getComments } from '@/api/comments'
import { useAuthStore } from '@/stores/auth'
import { t } from '@/i18n'

const props = defineProps({ post: { type: Object, required: true } })
const emit = defineEmits(['close', 'updated', 'deleted'])
const auth = useAuthStore()

const post = ref({ ...props.post })
const showCommentInput = ref(false)
const comments = ref([])
const loadingComments = ref(false)
const commentDraft = ref('')
const postingComment = ref(false)
const commentError = ref('')
const editing = ref(false)
const editingCaption = ref('')
const savingEdit = ref(false)
const deleting = ref(false)
const reposting = ref(false)
const showDeleteConfirm = ref(false)
const editError = ref('')
const isOwner = computed(() => auth.isSignedIn && auth.session.userId === post.value.authorId)
const canInteract = computed(() => /^[0-9a-f-]{36}$/i.test(post.value.id))

function onKeydown(e) {
  if (e.key !== 'Escape') return
  if (showDeleteConfirm.value) {
    showDeleteConfirm.value = false
    return
  }
  emit('close')
}
async function loadComments() {
  if (!canInteract.value) return
  loadingComments.value = true
  try {
    comments.value = await getComments(post.value.id)
  } catch (error) {
    commentError.value = error.message
  } finally {
    loadingComments.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  loadComments()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

async function onLike() {
  if (!canInteract.value) return
  const before = { likedByMe: post.value.likedByMe, likeCount: post.value.likeCount }
  post.value.likedByMe = !before.likedByMe
  post.value.likeCount += post.value.likedByMe ? 1 : -1
  try {
    await toggleLike(post.value.id)
  } catch {
    post.value.likedByMe = before.likedByMe
    post.value.likeCount = before.likeCount
  }
}

async function onSave() {
  if (!auth.isSignedIn || !canInteract.value) return
  const before = post.value.savedByMe
  post.value.savedByMe = !before
  try {
    await toggleSaved(post.value.id)
  } catch {
    post.value.savedByMe = before
  }
}

async function onRepost() {
  if (!auth.isSignedIn || !canInteract.value || reposting.value) return
  const before = { repostedByMe: post.value.repostedByMe, repostCount: post.value.repostCount }
  post.value.repostedByMe = !before.repostedByMe
  post.value.repostCount += post.value.repostedByMe ? 1 : -1
  reposting.value = true
  try {
    const result = await toggleRepost(post.value.id)
    post.value.repostedByMe = result.repostedByMe
    post.value.repostCount = result.repostCount
    emit('updated', post.value)
  } catch {
    post.value.repostedByMe = before.repostedByMe
    post.value.repostCount = before.repostCount
  } finally {
    reposting.value = false
  }
}

async function submitComment() {
  if (!commentDraft.value.trim() || !auth.isSignedIn || !canInteract.value || postingComment.value) return
  postingComment.value = true
  commentError.value = ''

  try {
    const comment = await addComment({
      postId: post.value.id,
      authorId: auth.session.userId,
      authorHandle: auth.session.handle,
      authorDisplayName: auth.session.displayName || auth.session.handle,
      body: commentDraft.value.trim(),
    })
    comments.value.push(comment)
    post.value.commentCount += 1
    commentDraft.value = ''
  } catch (error) {
    commentError.value = error.message
  } finally {
    postingComment.value = false
  }
}

function startEditing() {
  editingCaption.value = post.value.caption || ''
  editError.value = ''
  editing.value = true
}

function cancelEditing() {
  editing.value = false
  editError.value = ''
}

async function saveEdit() {
  if (!isOwner.value || savingEdit.value) return
  savingEdit.value = true
  editError.value = ''
  try {
    const updatedPost = await updatePost(post.value.id, {
      caption: editingCaption.value,
      authorId: auth.session.userId,
    })
    post.value = { ...post.value, ...updatedPost }
    editing.value = false
    emit('updated', post.value)
  } catch (error) {
    editError.value = error.message
  } finally {
    savingEdit.value = false
  }
}

function requestDelete() {
  if (!isOwner.value || deleting.value) return
  editError.value = ''
  showDeleteConfirm.value = true
}

async function removePost() {
  if (!isOwner.value || deleting.value) return
  deleting.value = true
  showDeleteConfirm.value = false
  editError.value = ''
  try {
    await deletePost(post.value.id, auth.session.userId)
    emit('deleted', post.value.id)
    emit('close')
  } catch (error) {
    editError.value = error.message
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-graphite/60 p-6" @click.self="emit('close')">
    <div class="relative flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-y-auto rounded-3xl bg-mount shadow-2xl">
      <button
        type="button"
        class="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-graphite/75 text-wall backdrop-blur transition hover:bg-graphite"
        :aria-label="t('close')"
        @click="emit('close')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" class="h-4 w-4">
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </svg>
      </button>

      <img
        :src="post.imagePath"
        :alt="post.caption || `Photo by ${post.authorHandle}`"
        class="max-h-[55vh] w-full rounded-t-3xl object-cover"
      />
      <div class="flex flex-col gap-3 p-6">
        <div class="flex items-center gap-3">
          <img
            v-if="post.authorAvatarPath"
            :src="post.authorAvatarPath"
            :alt="post.authorDisplayName"
            class="h-8 w-8 rounded-full object-cover"
          />
          <RouterLink
            :to="{ name: 'profile', params: { handle: post.authorHandle } }"
            class="text-sm font-medium hover:text-umber"
          >
            {{ post.authorDisplayName }}
          </RouterLink>
          <div v-if="isOwner && !editing" class="ml-auto flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full bg-wall-deep px-3 py-1.5 text-xs font-medium text-graphite transition hover:bg-graphite hover:text-wall"
              @click="startEditing"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5" aria-hidden="true">
                <path d="m4 16.5-.8 3.8 3.8-.8L18.5 8a2.1 2.1 0 0 0-3-3L4 16.5Z" />
                <path d="m14.5 6.5 3 3" />
              </svg>
              {{ t('edit') }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full border border-umber/25 px-3 py-1.5 text-xs font-medium text-umber transition hover:bg-umber hover:text-wall disabled:cursor-wait disabled:opacity-50"
              :disabled="deleting"
              @click="requestDelete"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5" aria-hidden="true">
                <path d="M4 7h16" />
                <path d="M10 11v6M14 11v6" />
                <path d="m6 7 1 13h10l1-13M9 7V4h6v3" />
              </svg>
              {{ t('delete') }}
            </button>
          </div>
        </div>
        <div v-if="editing" class="flex flex-col gap-3">
          <textarea
            v-model="editingCaption"
            maxlength="280"
            rows="3"
            :aria-label="t('caption')"
            class="rounded-2xl bg-wall-deep px-4 py-3 text-sm italic outline-none focus-visible:ring-2 focus-visible:ring-umber"
          />
          <div class="flex items-center gap-4">
            <button type="button" class="rounded-full bg-umber px-4 py-2 text-xs font-medium text-wall hover:brightness-110 disabled:opacity-50" :disabled="savingEdit" @click="saveEdit">
              {{ savingEdit ? t('saving') : t('saveChanges') }}
            </button>
            <button type="button" class="text-xs font-medium text-graphite/60 hover:text-graphite" @click="cancelEditing">
              {{ t('cancel') }}
            </button>
          </div>
          <p v-if="editError" class="text-sm text-umber">{{ editError }}</p>
        </div>
        <p v-else-if="post.caption" class="text-md italic leading-[1.55] text-graphite">{{ post.caption }}</p>
        <div class="flex items-center gap-5 border-t border-graphite/10 pt-4">
          <button
            type="button"
            class="flex items-center gap-2 text-xs font-medium tracking-[0.05em] disabled:opacity-40"
            :class="post.likedByMe ? 'text-umber' : 'text-graphite/60 hover:text-graphite'"
            :aria-label="post.likedByMe ? t('liked') : t('like')"
            :disabled="!canInteract"
            @click="onLike"
          >
            <svg viewBox="0 0 24 24" :fill="post.likedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
              <path d="M20.8 8.7c0 5.4-8.8 10.2-8.8 10.2S3.2 14.1 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" />
            </svg>
            <span>{{ post.likeCount }}</span>
          </button>

          <button
            type="button"
            class="flex items-center gap-2 text-graphite/60 transition hover:text-graphite"
            :aria-label="t('comments')"
            :aria-expanded="showCommentInput"
            @click="showCommentInput = !showCommentInput"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
              <path d="M20 11.5a7.5 7.5 0 0 1-7.8 7.5 8.2 8.2 0 0 1-3.4-.7L4 20l1.7-4.1A7.3 7.3 0 0 1 4.5 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />
            </svg>
            <span>{{ post.commentCount }}</span>
          </button>

          <button
            type="button"
            class="flex items-center gap-2 transition disabled:opacity-40"
            :class="post.repostedByMe ? 'text-umber' : 'text-graphite/60 hover:text-graphite'"
            :aria-label="post.repostedByMe ? t('reposted') : t('repost')"
            :title="t('repost')"
            :disabled="reposting || !canInteract"
            @click="onRepost"
          >
            <svg viewBox="0 0 24 24" :fill="post.repostedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
              <path d="M17 3l4 4-4 4" />
              <path d="M3 11V9a2 2 0 0 1 2-2h16" />
              <path d="M7 21l-4-4 4-4" />
              <path d="M21 13v2a2 2 0 0 1-2 2H3" />
            </svg>
            <span>{{ post.repostCount }}</span>
          </button>

          <button
            type="button"
            class="flex items-center gap-2 transition disabled:opacity-40"
            :class="post.savedByMe ? 'text-umber' : 'text-graphite/60 hover:text-graphite'"
            :aria-label="post.savedByMe ? t('saved') : t('save')"
            :disabled="!canInteract"
            @click="onSave"
          >
            <svg viewBox="0 0 24 24" :fill="post.savedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-5 w-5">
              <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z" />
            </svg>
          </button>
        </div>

        <div v-if="showCommentInput" class="flex flex-col gap-3 rounded-2xl bg-wall-deep/45 p-4">
          <p v-if="loadingComments" class="text-xs text-graphite/55">{{ t('loadingComments') }}</p>
          <p v-else-if="!comments.length" class="text-xs text-graphite/55">{{ t('noCommentsYet') }}</p>
          <ul v-else class="flex max-h-44 flex-col gap-3 overflow-y-auto">
            <li v-for="comment in comments" :key="comment.id" class="border-b border-graphite/10 pb-3 last:border-0 last:pb-0">
              <div class="flex items-baseline justify-between gap-3">
                <RouterLink :to="{ name: 'profile', params: { handle: comment.authorHandle } }" class="text-xs font-medium hover:text-umber">
                  {{ comment.authorDisplayName }}
                </RouterLink>
                <span class="text-[10px] text-graphite/45">@{{ comment.authorHandle }}</span>
              </div>
              <p class="mt-1 text-sm leading-5 text-graphite/80">{{ comment.body }}</p>
            </li>
          </ul>
        </div>

        <form v-if="showCommentInput && auth.isSignedIn && canInteract" class="flex gap-3" @submit.prevent="submitComment">
          <input
            v-model="commentDraft"
            type="text"
            maxlength="280"
            :placeholder="t('commentPlaceholder')"
            :aria-label="t('writeComment')"
            class="min-w-0 flex-1 rounded-full bg-wall-deep px-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-umber"
          />
          <button type="submit" class="text-sm font-medium hover:text-umber disabled:opacity-50" :disabled="postingComment || !commentDraft.trim()">
            {{ postingComment ? t('commenting') : t('post') }}
          </button>
        </form>
        <RouterLink v-if="showCommentInput && !auth.isSignedIn" :to="{ name: 'auth' }" class="text-sm text-graphite/60 hover:text-umber">
          {{ t('signInToComment') }}
        </RouterLink>
        <p v-if="commentError" class="text-sm text-umber">{{ commentError }}</p>
      </div>
    </div>

    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-graphite/45 p-5 backdrop-blur-sm"
      role="presentation"
      @click.self="showDeleteConfirm = false"
    >
      <div
        class="w-full max-w-[380px] rounded-3xl bg-mount p-6 text-graphite shadow-2xl"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'delete-dialog-title'"
      >
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-umber/10 text-umber">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
            <path d="M4 7h16" />
            <path d="M10 11v6M14 11v6" />
            <path d="m6 7 1 13h10l1-13M9 7V4h6v3" />
          </svg>
        </div>
        <h2 id="delete-dialog-title" class="mt-5 text-lg font-expanded font-semibold">{{ t('deletePostTitle') }}</h2>
        <p class="mt-2 text-sm leading-6 text-graphite/65">{{ t('deletePostBody') }}</p>
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-full bg-wall-deep px-4 py-2.5 text-sm font-medium transition hover:bg-graphite hover:text-wall"
            @click="showDeleteConfirm = false"
          >
            {{ t('cancel') }}
          </button>
          <button
            type="button"
            class="rounded-full bg-umber px-4 py-2.5 text-sm font-medium text-wall transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
            :disabled="deleting"
            @click="removePost"
          >
            {{ deleting ? t('deleting') : t('confirmDelete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
