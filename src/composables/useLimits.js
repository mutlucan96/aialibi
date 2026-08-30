import { ref, computed, watch, onUnmounted } from 'vue'
import { db } from '@/firebase'
import { ref as dbRef, onValue, off } from 'firebase/database'

export const DEFAULT_DAILY_LIMIT = 5

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
 *   isLoaded: import('vue').Ref<boolean>
 * }} Limit state and utilities for UI rendering and action guards.
 */
export function useLimits(userRef) {
  const limitsData = ref(null)
  const usageData = ref(null)
  const isLoaded = ref(false)

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
  }

  const setupListeners = (uid) => {
    cleanListeners()
    if (!uid) {
      limitsData.value = null
      usageData.value = null
      isLoaded.value = false
      return
    }

    limitsDbRef = dbRef(db, 'limits')
    limitsListener = onValue(limitsDbRef, (snapshot) => {
      limitsData.value = snapshot.val() || {}
      isLoaded.value = true
    })

    const today = getTodayDateString()
    usageDbRef = dbRef(db, `usage/${uid}/${today}`)
    usageListener = onValue(usageDbRef, (snapshot) => {
      usageData.value = snapshot.val() || {}
    })
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

    const specific = lim.specific || lim.users || lim.overrides || {}
    if (uid && specific[uid]) {
      const userVal =
        specific[uid].story ?? specific[uid].storyLimit ?? specific[uid].stories
      if (typeof userVal === 'number' && !isNaN(userVal)) return userVal
    }

    const globalVal =
      lim.global?.story ?? lim.global?.storyLimit ?? lim.global?.stories
    if (typeof globalVal === 'number' && !isNaN(globalVal)) return globalVal

    return DEFAULT_DAILY_LIMIT
  })

  const imageLimit = computed(() => {
    const current = typeof userRef === 'function' ? userRef() : userRef?.value
    const uid = current?.uid
    const lim = limitsData.value
    if (!lim) return DEFAULT_DAILY_LIMIT

    const specific = lim.specific || lim.users || lim.overrides || {}
    if (uid && specific[uid]) {
      const userVal =
        specific[uid].image ?? specific[uid].imageLimit ?? specific[uid].images
      if (typeof userVal === 'number' && !isNaN(userVal)) return userVal
    }

    const globalVal =
      lim.global?.image ?? lim.global?.imageLimit ?? lim.global?.images
    if (typeof globalVal === 'number' && !isNaN(globalVal)) return globalVal

    return DEFAULT_DAILY_LIMIT
  })

  const storyUsage = computed(() => {
    const u = usageData.value
    if (!u) return 0
    return Number(u.story ?? u.stories ?? 0) || 0
  })

  const imageUsage = computed(() => {
    const u = usageData.value
    if (!u) return 0
    return Number(u.image ?? u.images ?? 0) || 0
  })

  const remainingStories = computed(() => Math.max(0, storyLimit.value - storyUsage.value))
  const remainingImages = computed(() => Math.max(0, imageLimit.value - imageUsage.value))

  const canGenerateStory = computed(() => remainingStories.value > 0)
  const canGenerateImages = computed(() => remainingImages.value > 0)

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
