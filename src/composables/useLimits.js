import { ref, computed, watch, onUnmounted } from 'vue'
import { db } from '@/firebase'
import { ref as dbRef, onValue, off } from 'firebase/database'

/**
 * @import {LimitsData, DailyUsageData, LimitConfig} from '@/types.js'
 */

export const DEFAULT_DAILY_LIMIT = 0

/**
 * Returns the current UTC date string formatted as YYYY-MM-DD.
 * @returns {string} Formatted date string.
 */
export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Composable for tracking UUID-based daily story and image limits from RTDB.
 * @param {import('vue').Ref<any> | (() => any)} userRef - Reactive ref or getter returning current user object.
 * @returns {{
 *   storyLimit: import('vue').ComputedRef<number>,
 *   imageLimit: import('vue').ComputedRef<number>,
 *   storyUsage: import('vue').ComputedRef<number>,
 *   imageUsage: import('vue').ComputedRef<number>,
 *   remainingStories: import('vue').ComputedRef<number>,
 *   remainingImages: import('vue').ComputedRef<number>,
 *   canGenerateStory: import('vue').ComputedRef<boolean>,
 *   canGenerateImages: import('vue').ComputedRef<boolean>,
 *   isLoaded: import('vue').ComputedRef<boolean>
 * }} Limit state and utilities for UI rendering and action guards.
 */
export function useLimits(userRef) {
  /** @type {import('vue').Ref<LimitsData | null>} */
  const limitsData = ref(null)
  /** @type {import('vue').Ref<DailyUsageData | null>} */
  const usageData = ref(null)
  const limitsReceived = ref(false)
  const usageReceived = ref(false)
  const isLoaded = computed(() => limitsReceived.value && usageReceived.value)

  let limitsListener = null
  let usageListener = null
  let limitsDbRef = null
  let usageDbRef = null

  const cleanListeners = () => {
    if (limitsListener && limitsDbRef) {
      off(limitsDbRef, 'value', limitsListener)
      limitsListener = null
    }
    if (usageListener && usageDbRef) {
      off(usageDbRef, 'value', usageListener)
      usageListener = null
    }
    limitsReceived.value = false
    usageReceived.value = false
  }

  const setupListeners = (uid) => {
    cleanListeners()
    if (!uid) {
      limitsData.value = null
      usageData.value = null
      limitsReceived.value = false
      usageReceived.value = false
      return
    }

    limitsDbRef = dbRef(db, 'limits')
    limitsListener = onValue(
      limitsDbRef,
      (snapshot) => {
        limitsData.value = snapshot.val() || {}
        limitsReceived.value = true
      },
      (error) => {
        console.error('Error loading limits:', error)
        limitsData.value = {}
        limitsReceived.value = true
      },
    )

    const today = getTodayDateString()
    usageDbRef = dbRef(db, `usage/${uid}/${today}`)
    usageListener = onValue(
      usageDbRef,
      (snapshot) => {
        usageData.value = snapshot.val() || {}
        usageReceived.value = true
      },
      (error) => {
        console.error('Error loading usage:', error)
        usageData.value = {}
        usageReceived.value = true
      },
    )
  }

  watch(
    () => (typeof userRef === 'function' ? userRef() : userRef?.value),
    (currentUser) => {
      if (currentUser?.uid) {
        setupListeners(currentUser.uid)
      } else {
        cleanListeners()
        limitsData.value = null
        usageData.value = null
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    cleanListeners()
  })

  const storyLimit = computed(() => {
    const current = typeof userRef === 'function' ? userRef() : userRef?.value
    const uid = current?.uid
    const lim = limitsData.value
    if (!lim) return DEFAULT_DAILY_LIMIT

    const specific = lim['specific'] || lim['users'] || lim['overrides'] || {}
    if (uid && specific[uid]) {
      const userObj = specific[uid]
      const userVal = userObj['story'] ?? userObj['storyLimit'] ?? userObj['stories']
      if (typeof userVal === 'number' && !isNaN(userVal)) return userVal
    }

    const globalObj = lim['global'] || {}
    const globalVal = globalObj['story'] ?? globalObj['storyLimit'] ?? globalObj['stories']
    if (typeof globalVal === 'number' && !isNaN(globalVal)) return globalVal

    return DEFAULT_DAILY_LIMIT
  })

  const imageLimit = computed(() => {
    const current = typeof userRef === 'function' ? userRef() : userRef?.value
    const uid = current?.uid
    const lim = limitsData.value
    if (!lim) return DEFAULT_DAILY_LIMIT

    const specific = lim['specific'] || lim['users'] || lim['overrides'] || {}
    if (uid && specific[uid]) {
      const userObj = specific[uid]
      const userVal = userObj['image'] ?? userObj['imageLimit'] ?? userObj['images']
      if (typeof userVal === 'number' && !isNaN(userVal)) return userVal
    }

    const globalObj = lim['global'] || {}
    const globalVal = globalObj['image'] ?? globalObj['imageLimit'] ?? globalObj['images']
    if (typeof globalVal === 'number' && !isNaN(globalVal)) return globalVal

    return DEFAULT_DAILY_LIMIT
  })

  const storyUsage = computed(() => {
    const u = usageData.value
    if (!u) return 0
    return Number(u['story'] ?? u['stories'] ?? 0) || 0
  })

  const imageUsage = computed(() => {
    const u = usageData.value
    if (!u) return 0
    return Number(u['image'] ?? u['images'] ?? 0) || 0
  })

  const remainingStories = computed(() => Math.max(0, storyLimit.value - storyUsage.value))
  const remainingImages = computed(() => Math.max(0, imageLimit.value - imageUsage.value))

  const canGenerateStory = computed(() => isLoaded.value && remainingStories.value > 0)
  const canGenerateImages = computed(() => isLoaded.value && remainingImages.value > 0)

  return {
    storyLimit,
    imageLimit,
    storyUsage,
    imageUsage,
    remainingStories,
    remainingImages,
    canGenerateStory,
    canGenerateImages,
    isLoaded,
  }
}
