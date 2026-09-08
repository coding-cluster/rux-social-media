import db, { delay } from './db'

/** @returns {Promise<import('../types').Profile|null>} */
export async function getProfileByHandle(handle) {
  await delay()
  return db.profiles.find((p) => p.handle === handle) ?? null
}
