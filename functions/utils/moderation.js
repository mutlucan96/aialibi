import { db, ServerValue } from '../config.js'

/**
 * Permanently bans a user in Realtime Database to immediately block further requests at the rules layer.
 * @param {string} uid - The Firebase Auth UID of the abusive user.
 * @param {string} reason - Description of the violation.
 * @returns {Promise<void>}
 */
export async function banUserGlobally(uid, reason) {
  if (!uid) return
  const banRef = db.ref(`blockedUsers/${uid}`)
  await banRef.set({
    bannedAt: ServerValue.TIMESTAMP,
    reason: reason,
  })
}

/**
 * Checks if a user has exceeded the safe message rate limit.
 * @param {string} gameId - The game identifier.
 * @param {string} uid - The user identifier.
 * @returns {Promise<boolean>} True if rate limit is exceeded, false otherwise.
 */
export async function isRateLimited(gameId, uid) {
  if (!uid) return false
  const now = Date.now()
  const windowMs = 30000 // 30 seconds
  const maxMessagesInWindow = 8

  const recentChatsSnap = await db
    .ref(`games/${gameId}/userActivity/${uid}`)
    .orderByKey()
    .limitToLast(15)
    .once('value')

  const activity = recentChatsSnap.val() || {}
  const recentTimestamps = Object.values(activity)
    .map((ts) => Number(ts))
    .filter((ts) => now - ts < windowMs)

  return recentTimestamps.length >= maxMessagesInWindow
}

/**
 * Records user activity timestamp for rate-limit tracking.
 * @param {string} gameId - The game identifier.
 * @param {string} uid - The user identifier.
 * @returns {Promise<void>}
 */
export async function recordUserActivity(gameId, uid) {
  if (!uid) return
  await db.ref(`games/${gameId}/userActivity/${uid}`).push(ServerValue.TIMESTAMP)
}
