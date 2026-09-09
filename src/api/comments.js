import { supabase } from './supabase'

function mapComment(row) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles

  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorHandle: profile?.handle || row.author_id,
    authorDisplayName: profile?.display_name || row.author_id,
    body: row.body,
    createdAt: row.created_at,
  }
}

export async function getComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, post_id, author_id, body, created_at, profiles(handle, display_name)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapComment)
}

export async function addComment(input) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: input.postId,
      author_id: input.authorId,
      body: input.body.trim(),
    })
    .select('id, post_id, author_id, body, created_at')
    .single()
  if (error) throw error

  return {
    id: data.id,
    postId: data.post_id,
    authorId: data.author_id,
    authorHandle: input.authorHandle,
    authorDisplayName: input.authorDisplayName,
    body: data.body,
    createdAt: data.created_at,
  }
}
