import db, { delay, persist } from './db'

/** @returns {Promise<import('../types').Comment[]>} */
export async function getComments(postId) {
  await delay()
  return db.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/**
 * @param {{ postId: string, authorId: string, authorHandle: string, authorDisplayName: string, body: string }} input
 * @returns {Promise<import('../types').Comment>}
 */
export async function addComment(input) {
  await delay()
  const comment = { id: `comment-${crypto.randomUUID()}`, createdAt: new Date().toISOString(), ...input }
  db.comments.push(comment)
  const post = db.posts.find((p) => p.id === input.postId)
  if (post) post.commentCount += 1
  persist()
  return comment
}
