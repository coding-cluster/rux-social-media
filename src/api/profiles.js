import { supabase } from './supabase'

function publicAvatarUrl(path) {
  if (!path || path.startsWith('http')) return path
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

export async function getProfileByHandle(handle) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, handle, display_name, bio, avatar_path, created_at')
    .eq('handle', handle)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    handle: data.handle,
    displayName: data.display_name,
    bio: data.bio,
    avatarPath: publicAvatarUrl(data.avatar_path),
    createdAt: data.created_at,
  }
}
