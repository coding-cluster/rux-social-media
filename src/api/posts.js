import { supabase } from './supabase'
import { getDemoPosts } from '@/mocks/demoFeed'

function publicUrl(bucket, path) {
  if (!path || path.startsWith('http')) return path
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

function mapPost(row) {
  if (!row) return null

  return {
    id: row.id,
    authorId: row.author_id,
    authorHandle: row.author_handle,
    authorDisplayName: row.author_display_name,
    authorAvatarPath: publicUrl('avatars', row.author_avatar_path),
    caption: row.caption,
    imagePath: publicUrl('posts', row.image_path),
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    likeCount: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
    likedByMe: Boolean(row.liked_by_me),
    savedByMe: Boolean(row.saved_by_me),
    repostCount: row.repost_count ?? 0,
    repostedByMe: Boolean(row.reposted_by_me),
    createdAt: row.created_at,
  }
}

async function addRepostState(posts) {
  const uuidIds = posts.map((post) => post.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id))
  if (!uuidIds.length) return posts

  const { data, error } = await supabase
    .from('reposts')
    .select('post_id, user_id')
    .in('post_id', uuidIds)
  if (error) throw error

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  const counts = new Map()
  const mine = new Set()
  for (const repost of data ?? []) {
    counts.set(repost.post_id, (counts.get(repost.post_id) ?? 0) + 1)
    if (repost.user_id === userId) mine.add(repost.post_id)
  }

  return posts.map((post) => ({
    ...post,
    repostCount: counts.get(post.id) ?? 0,
    repostedByMe: mine.has(post.id),
  }))
}

async function getUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Debes iniciar sesión.')
  return data.user.id
}

export async function getFeed({ cursor, limit = 70 } = {}) {
  let query = supabase
    .from('feed_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    const { data: cursorPost, error: cursorError } = await supabase
      .from('feed_posts')
      .select('created_at')
      .eq('id', cursor)
      .maybeSingle()
    if (cursorError) throw cursorError
    if (cursorPost) query = query.lt('created_at', cursorPost.created_at)
  }

  const { data, error } = await query
  if (error) throw error

  const realPosts = await addRepostState((data ?? []).map(mapPost))
  const showDemoContent = import.meta.env.VITE_SHOW_DEMO_CONTENT !== 'false'
  const posts = cursor || !showDemoContent ? realPosts : [...realPosts, ...getDemoPosts()]
  return {
    posts,
    nextCursor: realPosts.length === limit ? realPosts[realPosts.length - 1].id : null,
  }
}

export async function getPost(id) {
  const { data, error } = await supabase
    .from('feed_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return (await addRepostState([mapPost(data)]))[0]
}

export async function getPostsByHandle(handle) {
  const { data, error } = await supabase
    .from('feed_posts')
    .select('*')
    .eq('author_handle', handle)
    .order('created_at', { ascending: false })
  if (error) throw error
  return addRepostState((data ?? []).map(mapPost))
}

export async function getSavedPosts() {
  const { data, error } = await supabase
    .from('feed_posts')
    .select('*')
    .eq('saved_by_me', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return addRepostState((data ?? []).map(mapPost))
}

export async function getRepostedPosts() {
  const userId = await getUserId()
  const { data: reposts, error: repostError } = await supabase
    .from('reposts')
    .select('post_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (repostError) throw repostError
  if (!reposts?.length) return []

  const postIds = reposts.map((repost) => repost.post_id)
  const { data, error } = await supabase.from('feed_posts').select('*').in('id', postIds)
  if (error) throw error

  const posts = await addRepostState((data ?? []).map(mapPost))
  const order = new Map(postIds.map((id, index) => [id, index]))
  return posts.sort((a, b) => order.get(a.id) - order.get(b.id))
}

export async function createPost(input) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: input.authorId,
      caption: input.caption?.trim() || null,
      image_path: input.imagePath,
      image_width: input.imageWidth,
      image_height: input.imageHeight,
    })
    .select('id')
    .single()
  if (error) throw error
  return getPost(data.id)
}

export async function updatePost(postId, { caption, authorId }) {
  const { data, error } = await supabase
    .from('posts')
    .update({ caption: caption?.trim() || null })
    .eq('id', postId)
    .eq('author_id', authorId)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Publicación no encontrada o no es tuya.')
  return getPost(data.id)
}

export async function deletePost(postId, authorId) {
  const { data: post, error: readError } = await supabase
    .from('posts')
    .select('image_path')
    .eq('id', postId)
    .eq('author_id', authorId)
    .maybeSingle()
  if (readError) throw readError
  if (!post) throw new Error('Publicación no encontrada o no es tuya.')

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', authorId)
  if (error) throw error

  if (post.image_path && !post.image_path.startsWith('http')) {
    await supabase.storage.from('posts').remove([post.image_path])
  }
}

export async function toggleLike(postId) {
  const userId = await getUserId()
  const post = await getPost(postId)
  if (!post) throw new Error('Publicación no encontrada.')

  if (post.likedByMe) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId })
    if (error) throw error
  }

  const updated = await getPost(postId)
  return { likedByMe: updated.likedByMe, likeCount: updated.likeCount }
}

export async function toggleSaved(postId) {
  const userId = await getUserId()
  const post = await getPost(postId)
  if (!post) throw new Error('Publicación no encontrada.')

  if (post.savedByMe) {
    const { error } = await supabase
      .from('saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('saves').insert({ post_id: postId, user_id: userId })
    if (error) throw error
  }

  const updated = await getPost(postId)
  return { savedByMe: updated.savedByMe }
}

export async function toggleRepost(postId) {
  const userId = await getUserId()
  const { data: existing, error: readError } = await supabase
    .from('reposts')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()
  if (readError) throw readError

  if (existing) {
    const { error } = await supabase
      .from('reposts')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('reposts').insert({ post_id: postId, user_id: userId })
    if (error) throw error
  }

  const { count, error: countError } = await supabase
    .from('reposts')
    .select('post_id', { count: 'exact', head: true })
    .eq('post_id', postId)
  if (countError) throw countError
  return { repostedByMe: !existing, repostCount: count ?? 0 }
}
