import { supabase } from './supabase'

function avatarUrl(path) {
  if (!path || path.startsWith('http')) return path
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

async function getOptionalUserId() {
  const { data } = await supabase.auth.getUser()
  return data.user?.id || null
}

function mapProfile(row, followingIds) {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    avatarPath: avatarUrl(row.avatar_path),
    avatarEmoji: row.avatar_emoji,
    avatarColor: row.avatar_color,
    followingByMe: followingIds.has(row.id),
  }
}

export async function searchPeople(query) {
  const term = query.trim()
  if (term.length < 2) return []

  const pattern = `%${term}%`
  const [handleResult, nameResult] = await Promise.all([
    supabase.from('profiles').select('id, handle, display_name, bio, avatar_path, avatar_emoji, avatar_color').ilike('handle', pattern).limit(20),
    supabase.from('profiles').select('id, handle, display_name, bio, avatar_path, avatar_emoji, avatar_color').ilike('display_name', pattern).limit(20),
  ])
  if (handleResult.error) throw handleResult.error
  if (nameResult.error) throw nameResult.error

  const profiles = [...(handleResult.data ?? []), ...(nameResult.data ?? [])]
  const uniqueProfiles = [...new Map(profiles.map((profile) => [profile.id, profile])).values()]
  const userId = await getOptionalUserId()
  if (!userId || !uniqueProfiles.length) return uniqueProfiles.map((profile) => mapProfile(profile, new Set()))

  const { data: follows, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
    .in('following_id', uniqueProfiles.map((profile) => profile.id))
  if (error) throw error

  return uniqueProfiles.map((profile) => mapProfile(profile, new Set((follows ?? []).map((follow) => follow.following_id))))
}

export async function toggleFollow(followingId) {
  const userId = await getOptionalUserId()
  if (!userId) throw new Error('Debes iniciar sesión para seguir personas.')
  if (userId === followingId) throw new Error('No puedes seguirte a ti mismo.')

  const { data: existing, error: readError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
    .eq('following_id', followingId)
    .maybeSingle()
  if (readError) throw readError

  if (existing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', followingId)
    if (error) throw error
    return false
  }

  const { error } = await supabase.from('follows').insert({ follower_id: userId, following_id: followingId })
  if (error) throw error
  return true
}

export async function getFollowCounts(profileId) {
  const [followersResult, followingResult] = await Promise.all([
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profileId),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', profileId),
  ])

  if (followersResult.error) throw followersResult.error
  if (followingResult.error) throw followingResult.error

  return {
    followers: followersResult.count ?? 0,
    following: followingResult.count ?? 0,
  }
}
