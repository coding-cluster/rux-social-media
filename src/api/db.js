// In-memory store backing every mock endpoint. Persists for the tab's
// lifetime via localStorage so a refresh doesn't undo a compose/like.
// ponytail: no reactivity here on purpose — api/ stays framework-free,
// callers own their own state (see stores/auth.js, views/*).

import { makeProfiles, makePosts } from './fixtures'

const KEY = 'rux-mock-db-v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // storage unavailable or corrupt — fall through to fresh seed
  }
  const profiles = makeProfiles()
  const posts = makePosts(profiles)
  return { profiles, posts, comments: [], accounts: [] }
}

const db = load()

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    // quota exceeded or storage disabled — mock data just won't survive reload
  }
}

export default db

/** Simulated network latency so loading states are real to build against. */
export function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
