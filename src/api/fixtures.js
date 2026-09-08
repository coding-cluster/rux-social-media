// Seed data standing in for Supabase until the real backend lands.
// Shapes match src/types.js exactly so swapping the implementation
// in profiles.js / posts.js / auth.js is the only integration work.

const PROFILE_SEEDS = [
  ['maya_cortes', 'Maya Cortés', 'Light and quiet rooms.'],
  ['theo_lange', 'Theo Lange', 'Streets, mostly at dusk.'],
  ['ines_haddad', 'Inés Haddad', null],
  ['kenji_oda', 'Kenji Oda', 'Film only. No filters.'],
  ['ada_ryzner', 'Ada Ryzner', 'Textures I trip over.'],
  ['sam_okafor', 'Sam Okafor', 'Coastlines and coffee.'],
  ['lin_vasquez', 'Lin Vásquez', null],
  ['noor_petit', 'Noor Petit', 'Slow mornings, fast trains.'],
]

/** @returns {import('../types').Profile[]} */
export function makeProfiles() {
  const base = Date.now() - PROFILE_SEEDS.length * 86400000
  return PROFILE_SEEDS.map(([handle, displayName, bio], i) => ({
    id: `user-${i + 1}`,
    handle,
    displayName,
    avatarPath: `https://picsum.photos/seed/${handle}-avatar/80/80`,
    bio,
    createdAt: new Date(base + i * 86400000).toISOString(),
  }))
}

const ASPECTS = [
  [1200, 800],
  [1000, 1250],
  [1200, 1200],
  [1400, 933],
  [900, 1400],
]

const CAPTIONS = [
  'the last of the afternoon light',
  'stairwell, tuesday',
  'still had the tags on',
  'nobody warned me about this color of sky',
  'kept walking past it for a week before I stopped',
  null,
  'the kettle, before anyone else was up',
  'unfinished, on purpose',
  'a whole block smelled like rain',
  'this is the only photo I took all week',
]

/**
 * @param {import('../types').Profile[]} profiles
 * @returns {import('../types').FeedPost[]}
 */
export function makePosts(profiles, count = 30) {
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => {
    const author = profiles[i % profiles.length]
    const [w, h] = ASPECTS[i % ASPECTS.length]
    return {
      id: `post-${i + 1}`,
      authorId: author.id,
      authorHandle: author.handle,
      authorDisplayName: author.displayName,
      authorAvatarPath: author.avatarPath,
      caption: CAPTIONS[i % CAPTIONS.length],
      imagePath: `https://picsum.photos/seed/rux-post-${i + 1}/${w}/${h}`,
      imageWidth: w,
      imageHeight: h,
      likeCount: (i * 7) % 53,
      commentCount: (i * 3) % 9,
      likedByMe: i % 5 === 0,
      createdAt: new Date(now - i * 3 * 3600000).toISOString(),
    }
  })
}
