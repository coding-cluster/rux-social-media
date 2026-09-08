// Stands in for supabase-js GoTrue calls. Real handle validation
// (^[a-z0-9_]{3,20}$) is enforced here too so the UI doesn't drift
// from the DB constraint it will eventually hit.

import db, { delay, persist } from './db'

const HANDLE_RE = /^[a-z0-9_]{3,20}$/

/**
 * @param {{ email: string, password: string, handle: string, displayName: string }} input
 * @returns {Promise<import('../types').Session>}
 */
export async function signUp({ email, password, handle, displayName }) {
  await delay()
  if (!HANDLE_RE.test(handle)) throw new Error('Handle must be 3-20 lowercase letters, numbers or underscores.')
  if (db.accounts.some((a) => a.email === email)) throw new Error('An account already uses that email.')
  if (db.profiles.some((p) => p.handle === handle)) throw new Error('That handle is taken.')
  if (password.length < 6) throw new Error('Password must be at least 6 characters.')

  const id = `user-${crypto.randomUUID()}`
  db.accounts.push({ id, email, password })
  db.profiles.push({
    id,
    handle,
    displayName,
    avatarPath: `https://picsum.photos/seed/${handle}-avatar/80/80`,
    bio: null,
    createdAt: new Date().toISOString(),
  })
  persist()
  return { userId: id, handle }
}

/**
 * @param {{ email: string, password: string }} input
 * @returns {Promise<import('../types').Session>}
 */
export async function signIn({ email, password }) {
  await delay()
  const account = db.accounts.find((a) => a.email === email && a.password === password)
  if (!account) throw new Error('Wrong email or password.')
  const profile = db.profiles.find((p) => p.id === account.id)
  return { userId: account.id, handle: profile.handle }
}
