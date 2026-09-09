/**
 * DTO shapes shared by the mock API (src/api/) and the real Supabase API
 * that will replace it. Views and components must only ever depend on
 * these shapes, never on how they're produced.
 *
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} handle
 * @property {string} displayName
 * @property {string|null} avatarPath
 * @property {string|null} bio
 * @property {string} createdAt - ISO timestamp
 *
 * @typedef {Object} FeedPost - mirrors the future `feed_posts` view
 * @property {string} id
 * @property {string} authorId
 * @property {string} authorHandle
 * @property {string} authorDisplayName
 * @property {string|null} authorAvatarPath
 * @property {string|null} caption
 * @property {string} imagePath - URL for now, storage path once real
 * @property {number} imageWidth
 * @property {number} imageHeight
 * @property {number} likeCount
 * @property {number} commentCount
 * @property {boolean} likedByMe
 * @property {boolean} savedByMe
 * @property {number} repostCount
 * @property {boolean} repostedByMe
 * @property {string} createdAt - ISO timestamp
 *
 * @typedef {Object} Comment
 * @property {string} id
 * @property {string} postId
 * @property {string} authorId
 * @property {string} authorHandle
 * @property {string} authorDisplayName
 * @property {string} body
 * @property {string} createdAt - ISO timestamp
 *
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} senderId
 * @property {string} receiverId
 * @property {string} body
 * @property {{ body: string, trackName: string, artistName: string }|null} replyNote
 * @property {string|null} readAt
 * @property {string} createdAt - ISO timestamp
 * @property {boolean} isMine
 *
 * @typedef {Object} Session
 * @property {string} userId
 * @property {string} handle
 * @property {string} displayName
 */

export {}
