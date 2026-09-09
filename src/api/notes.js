import { supabase } from './supabase'

function avatarUrl(path) {
  if (!path || path.startsWith('http')) return path
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

function mapNote(row) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  return {
    id: row.id,
    authorId: row.author_id,
    authorHandle: profile?.handle || row.author_handle,
    authorDisplayName: profile?.display_name || row.author_display_name,
    authorAvatarPath: avatarUrl(profile?.avatar_path || row.author_avatar_path),
    authorAvatarEmoji: profile?.avatar_emoji || row.author_avatar_emoji,
    authorAvatarColor: profile?.avatar_color || row.author_avatar_color,
    body: row.body,
    trackId: row.track_id,
    trackName: row.track_name,
    artistName: row.artist_name,
    artworkUrl: row.artwork_url,
    previewUrl: row.preview_url,
    trackUrl: row.track_url,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }
}

async function getUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Debes iniciar sesión.')
  return data.user.id
}

export async function searchItunes(term) {
  const query = term.trim()
  if (query.length < 2) return []

  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&country=mx&limit=8`,
  )
  if (!response.ok) throw new Error('No se pudieron buscar canciones.')

  const data = await response.json()
  return (data.results ?? []).map((track) => ({
    id: String(track.trackId),
    name: track.trackName,
    artist: track.artistName,
    artworkUrl: track.artworkUrl100,
    previewUrl: track.previewUrl?.replace(/^http:/, 'https:') || null,
    trackUrl: track.trackViewUrl,
  }))
}

export async function getActiveNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select(
      'id, author_id, body, track_id, track_name, artist_name, artwork_url, preview_url, track_url, created_at, expires_at, profiles(handle, display_name, avatar_path, avatar_emoji, avatar_color)',
    )
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapNote)
}

export async function createNote({ body, track, authorHandle, authorDisplayName }) {
  const authorId = await getUserId()
  const { data, error } = await supabase
    .from('notes')
    .insert({
      author_id: authorId,
      body: body.trim(),
      track_id: track.id,
      track_name: track.name,
      artist_name: track.artist,
      artwork_url: track.artworkUrl,
      preview_url: track.previewUrl,
      track_url: track.trackUrl,
    })
    .select('id, author_id, body, track_id, track_name, artist_name, artwork_url, preview_url, track_url, created_at, expires_at')
    .single()
  if (error) throw error

  return mapNote({
    ...data,
    author_handle: authorHandle,
    author_display_name: authorDisplayName,
  })
}

export async function deleteNote(noteId) {
  const userId = await getUserId()
  const { error } = await supabase.from('notes').delete().eq('id', noteId).eq('author_id', userId)
  if (error) throw error
}
