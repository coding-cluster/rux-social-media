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

const STORAGE_KEY = 'rux-mock-db-v1'

function makeProfiles() {
  const base = Date.now() - PROFILE_SEEDS.length * 86400000
  return PROFILE_SEEDS.map(([handle, displayName, bio], index) => ({
    id: `user-${index + 1}`,
    handle,
    displayName,
    avatarPath: `https://picsum.photos/seed/${handle}-avatar/80/80`,
    bio,
    createdAt: new Date(base + index * 86400000).toISOString(),
  }))
}

function makePosts(profiles, count = 120) {
  const now = Date.now()
  return Array.from({ length: count }, (_, index) => {
    const author = profiles[index % profiles.length]
    const [width, height] = ASPECTS[index % ASPECTS.length]
    return {
      id: `post-${index + 1}`,
      authorId: author.id,
      authorHandle: author.handle,
      authorDisplayName: author.displayName,
      authorAvatarPath: author.avatarPath,
      caption: CAPTIONS[index % CAPTIONS.length],
      imagePath: `https://picsum.photos/seed/rux-post-${index + 1}/${width}/${height}`,
      imageWidth: width,
      imageHeight: height,
      likeCount: (index * 7) % 53,
      commentCount: (index * 3) % 9,
      repostCount: 0,
      likedByMe: index % 5 === 0,
      savedByMe: false,
      repostedByMe: false,
      createdAt: new Date(now - index * 3 * 3600000).toISOString(),
    }
  })
}

function loadDemoPosts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored).posts ?? []
  } catch {
    return makePosts(makeProfiles())
  }

  return makePosts(makeProfiles())
}

export function getDemoPosts() {
  return loadDemoPosts()
}
