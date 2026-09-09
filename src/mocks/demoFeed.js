import { applyDemoInteraction } from './demoInteractions'

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

const FEATURED_SCENES = [
  { imagePath: '/demo-feed/alfredo-1.webp', width: 1200, height: 1454, caption: 'Alfredo Olivas, noche de música' },
  { imagePath: '/demo-feed/alfredo-2.webp', width: 1200, height: 675, caption: 'Alfredo Olivas en el palenque' },
  { imagePath: '/demo-feed/alfredo-3.webp', width: 1200, height: 800, caption: 'V1VO Tour' },
  { imagePath: '/demo-feed/alfredo-4.webp', width: 1200, height: 628, caption: 'una noche de Alfredo Olivas' },
  { imagePath: '/demo-feed/alfredo-home-1.webp', width: 1200, height: 1819, caption: 'Alfredo Olivas, directo desde la noche' },
  { imagePath: '/demo-feed/alfredo-home-2.webp', width: 1200, height: 1523, caption: 'otra postal de Alfredo Olivas' },
  { imagePath: '/demo-feed/music-1.webp', width: 1200, height: 1200, caption: 'música que se canta a todo pulmón' },
  { imagePath: '/demo-feed/grupo-firme.webp', width: 1200, height: 1500, caption: 'Grupo Firme en vivo' },
  { imagePath: '/demo-feed/music-2.webp', width: 1200, height: 1200, caption: 'puro ambiente norteño' },
  { imagePath: '/demo-feed/music-3.webp', width: 1200, height: 801, caption: 'la música también es paisaje' },
  { imagePath: '/demo-feed/music-4.webp', width: 1200, height: 736, caption: 'entre canciones y carretera' },
  { imagePath: '/demo-feed/music-5.webp', width: 1200, height: 1625, caption: 'una postal para guardar' },
  { imagePath: '/demo-feed/avengers-doomsday-1.webp', width: 1200, height: 1780, caption: 'Avengers: Doomsday' },
  { imagePath: '/demo-feed/avengers-doomsday-2.webp', width: 184, height: 273, caption: 'una nueva amenaza' },
  { imagePath: '/demo-feed/avengers-doomsday-3.webp', width: 400, height: 225, caption: 'el fin se acerca' },
  { imagePath: '/demo-feed/avengers-doomsday-4.webp', width: 452, height: 678, caption: 'Doomsday' },
  { imagePath: '/demo-feed/beach-1.webp', width: 1200, height: 976, caption: 'días que piden playa' },
  { imagePath: '/demo-feed/cabo-1.webp', width: 1200, height: 844, caption: 'Los Cabos, por fin' },
  { imagePath: '/demo-feed/cabo-arch.webp', width: 1200, height: 675, caption: 'el arco y el mar' },
  { imagePath: '/demo-feed/beach-2.webp', width: 1200, height: 1152, caption: 'azul hasta donde alcance la vista' },
  { imagePath: '/demo-feed/beach-3.webp', width: 1200, height: 674, caption: 'arena, sol y silencio' },
  { imagePath: '/demo-feed/beach-4.webp', width: 1200, height: 903, caption: 'un rato lejos de todo' },
]

const STORAGE_KEY = 'rux-mock-db-v8'

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
    const scene = FEATURED_SCENES[index]
    const [width, height] = scene ? [scene.width, scene.height] : ASPECTS[index % ASPECTS.length]
    return {
      id: `post-${index + 1}`,
      authorId: author.id,
      authorHandle: author.handle,
      authorDisplayName: author.displayName,
      authorAvatarPath: author.avatarPath,
      caption: scene?.caption || CAPTIONS[(index - FEATURED_SCENES.length) % CAPTIONS.length],
      imagePath: scene?.imagePath || `https://picsum.photos/seed/rux-post-${index + 1}/${width}/${height}`,
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
  return loadDemoPosts().map(applyDemoInteraction)
}
