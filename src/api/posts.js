// Mirrors the future PostgREST calls against `feed_posts` / `posts` / `likes`.
// Signatures are the contract: swap the bodies for supabase-js calls later,
// nothing that imports from here should need to change.

import db, { delay, persist } from './db'

/**
 * @param {{ cursor?: string, limit?: number }} [opts]
 * @returns {Promise<{ posts: import('../types').FeedPost[], nextCursor: string|null }>}
 */
export async function getFeed({ cursor, limit = 70 } = {}) {
  await delay()
  const sorted = [...db.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const start = cursor ? sorted.findIndex((p) => p.id === cursor) + 1 : 0
  const page = sorted.slice(start, start + limit)
  const nextCursor = sorted[start + limit] ? page[page.length - 1].id : null
  return { posts: page, nextCursor }
}

/** @returns {Promise<import('../types').FeedPost|null>} */
export async function getPost(id) {
  await delay()
  return db.posts.find((p) => p.id === id) ?? null
}

/** @returns {Promise<import('../types').FeedPost[]>} */
export async function getPostsByHandle(handle) {
  await delay()
  return db.posts
    .filter((p) => p.authorHandle === handle)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * @param {{ authorId: string, authorHandle: string, authorDisplayName: string, authorAvatarPath: string|null, caption: string|null, imagePath: string, imageWidth: number, imageHeight: number }} input
 * @returns {Promise<import('../types').FeedPost>}
 */
export async function createPost(input) {
  await delay()
  const post = {
    id: `post-${crypto.randomUUID()}`,
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    createdAt: new Date().toISOString(),
    ...input,
  }
  db.posts.unshift(post)
  persist()
  return post
}

/** @returns {Promise<{ likedByMe: boolean, likeCount: number }>} */
export async function toggleLike(postId) {
  await delay(120)
  const post = db.posts.find((p) => p.id === postId)
  if (!post) throw new Error('Post not found')
  post.likedByMe = !post.likedByMe
  post.likeCount += post.likedByMe ? 1 : -1
  persist()
  return { likedByMe: post.likedByMe, likeCount: post.likeCount }
}
