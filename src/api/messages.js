import { supabase } from './supabase'

function avatarUrl(path) {
  if (!path || path.startsWith('http')) return path
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

function mapProfile(row) {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    avatarPath: avatarUrl(row.avatar_path),
    avatarEmoji: row.avatar_emoji,
    avatarColor: row.avatar_color,
  }
}

function mapMessage(row, userId) {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    body: row.body,
    replyNote: row.reply_note_body
      ? {
          body: row.reply_note_body,
          trackName: row.reply_note_track,
          artistName: row.reply_note_artist,
        }
      : null,
    readAt: row.read_at,
    createdAt: row.created_at,
    isMine: row.sender_id === userId,
  }
}

async function getUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Debes iniciar sesión.')
  return data.user.id
}

async function getUserMessages(userId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, body, reply_note_body, reply_note_track, reply_note_artist, read_at, created_at')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getMessageProfiles() {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_path, avatar_emoji, avatar_color')
    .neq('id', userId)
    .order('display_name', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapProfile)
}

export async function getConversations() {
  const userId = await getUserId()
  const rows = await getUserMessages(userId)
  const otherIds = [...new Set(rows.map((row) => (row.sender_id === userId ? row.receiver_id : row.sender_id)))]

  if (!otherIds.length) return []

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_path, avatar_emoji, avatar_color')
    .in('id', otherIds)
  if (error) throw error

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, mapProfile(profile)]))
  return otherIds
    .map((otherId) => {
      const conversationRows = rows.filter((row) => row.sender_id === otherId || row.receiver_id === otherId)
      const lastMessage = conversationRows[conversationRows.length - 1]
      const user = profileMap.get(otherId)
      if (!user || !lastMessage) return null

      return {
        user,
        lastMessage: lastMessage.body,
        createdAt: lastMessage.created_at,
        unreadCount: conversationRows.filter((row) => row.receiver_id === userId && !row.read_at).length,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getConversation(otherUserId) {
  const userId = await getUserId()
  const rows = await getUserMessages(userId)
  return rows
    .filter((row) => row.sender_id === otherUserId || row.receiver_id === otherUserId)
    .map((row) => mapMessage(row, userId))
}

export async function sendMessage(receiverId, body, note = null) {
  const senderId = await getUserId()
  const cleanBody = body.trim()
  if (!cleanBody) throw new Error('Escribe un mensaje.')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      body: cleanBody,
      reply_note_body: note?.body || null,
      reply_note_track: note?.trackName || null,
      reply_note_artist: note?.artistName || null,
    })
    .select('id, sender_id, receiver_id, body, reply_note_body, reply_note_track, reply_note_artist, read_at, created_at')
    .single()
  if (error) throw error
  return mapMessage(data, senderId)
}

export async function markConversationRead(otherUserId) {
  const userId = await getUserId()
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', otherUserId)
    .eq('receiver_id', userId)
    .is('read_at', null)
  if (error) throw error
}

export async function deleteConversation(otherUserId) {
  const userId = await getUserId()
  const { error } = await supabase
    .from('messages')
    .delete()
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
  if (error) throw error
}

const PINNED_CONVERSATIONS_KEY = 'rux-pinned-conversations'

function readPinnedConversationIds(userId) {
  try {
    const stored = localStorage.getItem(`${PINNED_CONVERSATIONS_KEY}:${userId}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function writePinnedConversationIds(userId, ids) {
  localStorage.setItem(`${PINNED_CONVERSATIONS_KEY}:${userId}`, JSON.stringify(ids))
}

export async function getPinnedConversationIds() {
  const userId = await getUserId()
  return readPinnedConversationIds(userId)
}

export async function setConversationPinned(otherUserId, pinned) {
  const userId = await getUserId()
  const ids = readPinnedConversationIds(userId).filter((id) => id !== otherUserId)
  if (pinned) ids.unshift(otherUserId)
  writePinnedConversationIds(userId, ids)
  return ids
}

export async function subscribeToIncomingMessages(onMessage) {
  const userId = await getUserId()
  const channel = supabase
    .channel(`messages:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => onMessage(mapMessage(payload.new, userId)),
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
