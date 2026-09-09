const INTERACTIONS_KEY = 'rux-demo-interactions-v1'
const COMMENTS_KEY = 'rux-demo-comments-v1'

export function isDemoPost(postId) {
  return typeof postId === 'string' && postId.startsWith('post-')
}

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Demo interactions remain available for the current page if storage is unavailable.
  }
}

export function applyDemoInteraction(post) {
  const saved = read(INTERACTIONS_KEY, {})[post.id]
  return saved ? { ...post, ...saved } : post
}

function updateInteraction(post, changes) {
  const interactions = read(INTERACTIONS_KEY, {})
  const next = { ...post, ...changes }
  interactions[post.id] = {
    likedByMe: next.likedByMe,
    likeCount: next.likeCount,
    savedByMe: next.savedByMe,
    repostedByMe: next.repostedByMe,
    repostCount: next.repostCount,
  }
  write(INTERACTIONS_KEY, interactions)
  return next
}

export function toggleDemoLike(post) {
  const likedByMe = !post.likedByMe
  return updateInteraction(post, {
    likedByMe,
    likeCount: Math.max(0, post.likeCount + (likedByMe ? 1 : -1)),
  })
}

export function toggleDemoSaved(post) {
  return updateInteraction(post, { savedByMe: !post.savedByMe })
}

export function toggleDemoRepost(post) {
  const repostedByMe = !post.repostedByMe
  return updateInteraction(post, {
    repostedByMe,
    repostCount: Math.max(0, post.repostCount + (repostedByMe ? 1 : -1)),
  })
}

export function getDemoComments(postId) {
  return read(COMMENTS_KEY, {})[postId] || []
}

export function addDemoComment({ postId, authorHandle, authorDisplayName, body }) {
  const comments = read(COMMENTS_KEY, {})
  const comment = {
    id: `demo-comment-${Date.now()}`,
    authorHandle,
    authorDisplayName,
    body,
    createdAt: new Date().toISOString(),
  }
  comments[postId] = [...(comments[postId] || []), comment]
  write(COMMENTS_KEY, comments)
  return comment
}
