import { db } from '../config.js'

export const DEFAULT_DAILY_STORY_LIMIT = 0
export const DEFAULT_DAILY_IMAGE_LIMIT = 0

/**
 * Gets the current UTC date string YYYY-MM-DD.
 * @returns {string} Date string in YYYY-MM-DD format.
 */
export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Resolves the daily limit for a user for a given action ('story' or 'image').
 * Checks RTDB /limits/specific/{uuid} or /limits/users/{uuid}, then /limits/global, then default.
 * @param {string} uid - User identifier.
 * @param {'story'|'image'} type - The action type.
 * @returns {Promise<number>} The resolved numeric limit.
 */
export async function getUserDailyLimit(uid, type) {
  try {
    const limitsSnap = await db.ref('limits').once('value')
    const limits = limitsSnap.val() || {}

    // Check specific user overrides first
    const specificUsers = limits['specific'] || limits['users'] || limits['overrides'] || {}
    if (uid && specificUsers[uid]) {
      const userLimitObj = specificUsers[uid]
      const userVal =
        type === 'story'
          ? (userLimitObj['story'] ?? userLimitObj['storyLimit'] ?? userLimitObj['stories'])
          : (userLimitObj['image'] ?? userLimitObj['imageLimit'] ?? userLimitObj['images'])

      if (typeof userVal === 'number' && !isNaN(userVal)) {
        return userVal
      }
    }

    // Check global limits
    const globalLimits = limits['global'] || {}
    const globalVal =
      type === 'story'
        ? (globalLimits['story'] ?? globalLimits['storyLimit'] ?? globalLimits['stories'])
        : (globalLimits['image'] ?? globalLimits['imageLimit'] ?? globalLimits['images'])

    if (typeof globalVal === 'number' && !isNaN(globalVal)) {
      return globalVal
    }
  } catch (err) {
    console.error('Error fetching limits from RTDB:', err)
  }

  return type === 'story' ? DEFAULT_DAILY_STORY_LIMIT : DEFAULT_DAILY_IMAGE_LIMIT
}

/**
 * Checks if a user has remaining daily limit for the specified action.
 * @param {string} uid - User identifier.
 * @param {'story'|'image'} type - The action type ('story' or 'image').
 * @returns {Promise<{allowed: boolean, limit: number, usage: number, remaining: number, reason?: string}>}
 */
export async function checkDailyLimit(uid, type) {
  if (!uid) {
    return {
      allowed: false,
      limit: 0,
      usage: 0,
      remaining: 0,
      reason: 'User ID is missing. Cannot verify daily limit.',
    }
  }

  const limit = await getUserDailyLimit(uid, type)
  const today = getTodayDateString()
  const usageSnap = await db.ref(`usage/${uid}/${today}/${type}`).once('value')
  const usage = Number(usageSnap.val()) || 0
  const remaining = Math.max(0, limit - usage)

  if (usage >= limit) {
    return {
      allowed: false,
      limit,
      usage,
      remaining: 0,
      reason: `Daily ${type} generation limit reached (${usage}/${limit}). Please try again tomorrow.`,
    }
  }

  return {
    allowed: true,
    limit,
    usage,
    remaining,
  }
}

/**
 * Atomically increments the daily usage counter for a user and action type.
 * @param {string} uid - User identifier.
 * @param {'story'|'image'} type - The action type ('story' or 'image').
 * @returns {Promise<number>} The updated usage count.
 */
export async function incrementDailyUsage(uid, type) {
  if (!uid) return 0
  const today = getTodayDateString()
  const usageRef = db.ref(`usage/${uid}/${today}/${type}`)
  const result = await usageRef.transaction((current) => (Number(current) || 0) + 1)
  return result.snapshot.val() || 1
}
