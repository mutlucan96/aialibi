<template>
  <div
    :class="['witness-avatar-container', 'position-relative', roundedClass, customClass]"
    :style="containerStyle"
  >
    <!-- Fallback / Placeholder Avatar -->
    <v-avatar
      :size="numericSize"
      :class="[roundedClass, 'witness-avatar-fallback']"
      :style="fallbackStyle"
      color="grey-lighten-2"
    >
      <span :class="initialsClass">{{ initial }}</span>
    </v-avatar>

    <!-- Smoothly Fading Image Layer -->
    <div
      v-if="witness?.imageUrl"
      :class="['witness-avatar-image', roundedClass, { 'is-loaded': isLoaded }]"
      :style="avatarStyle"
      :aria-label="witness?.name"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

/**
 * @import {Witness} from '@/types.js'
 */

const props = defineProps({
  /** @type {import('vue').PropType<Witness>} */
  witness: {
    type: Object,
    required: true,
  },
  /** Size in pixels (number) or CSS string ('36px', '100%') */
  size: {
    type: [Number, String],
    default: 48,
  },
  /** Shape: 'circle' | 'rounded' | 'square' | boolean */
  rounded: {
    type: [String, Boolean],
    default: 'circle',
  },
  customClass: {
    type: String,
    default: '',
  },
  /** Optional custom zoom factor (default: 204% for ~2% subtle border trimming) */
  zoom: {
    type: Number,
    default: 204,
  },
})

const isLoaded = ref(false)
const isLoading = ref(false)

/**
 * Preloads the image and toggles isLoaded / isLoading states for smooth transition.
 * @param {string} [url] - Image URL to load.
 */
const checkAndLoadImage = (url) => {
  if (!url) {
    isLoaded.value = false
    isLoading.value = false
    return
  }

  isLoading.value = true
  const img = new Image()
  img.src = url

  if (img.complete && img.naturalWidth !== 0) {
    isLoaded.value = true
    isLoading.value = false
    return
  }

  img.onload = () => {
    isLoaded.value = true
    isLoading.value = false
  }

  img.onerror = () => {
    isLoaded.value = false
    isLoading.value = false
  }
}

watch(
  () => props.witness?.imageUrl,
  (newUrl) => {
    isLoaded.value = false
    checkAndLoadImage(newUrl)
  },
  { immediate: true },
)

// CSS sprite positions with subtle ~2% inset to clip off thin divider lines
const spritePositions = [
  '1% 1%',     // 0: Top-Left
  '99% 1%',    // 1: Top-Right
  '1% 99%',    // 2: Bottom-Left
  '99% 99%',   // 3: Bottom-Right
]

const isSprite = computed(() => {
  return props.witness?.spriteIndex !== undefined && props.witness?.spriteIndex !== null
})

const numericSize = computed(() => {
  if (typeof props.size === 'number') return props.size
  const parsed = parseInt(props.size, 10)
  return isNaN(parsed) ? 48 : parsed
})

const initialsClass = computed(() => {
  if (typeof props.size === 'string' && props.size.includes('%')) {
    return 'text-h4 font-weight-bold'
  }
  if (numericSize.value >= 80) return 'text-h3 font-weight-bold'
  if (numericSize.value >= 40) return 'text-h6 font-weight-medium'
  return 'text-caption font-weight-bold'
})

const roundedClass = computed(() => {
  if (props.rounded === false || props.rounded === 'square') return 'rounded-0'
  if (props.rounded === 'rounded' || props.rounded === 'lg') return 'rounded-lg'
  return 'rounded-circle'
})

const initial = computed(() => {
  return props.witness?.name ? props.witness.name.charAt(0).toUpperCase() : '?'
})

const containerStyle = computed(() => {
  const sizeValue = typeof props.size === 'number' ? `${props.size}px` : props.size
  return {
    width: sizeValue,
    height: sizeValue,
    flexShrink: 0,
  }
})

const fallbackStyle = computed(() => {
  return {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  }
})

const avatarStyle = computed(() => {
  if (!props.witness?.imageUrl) return {}

  if (isSprite.value) {
    const idx = Number(props.witness.spriteIndex) % 4
    const pos = spritePositions[idx] || '8% 8%'
    const zoomSize = `${props.zoom}% ${props.zoom}%`

    return {
      width: '100%',
      height: '100%',
      backgroundImage: `url("${props.witness.imageUrl}")`,
      backgroundSize: zoomSize,
      backgroundPosition: pos,
      backgroundRepeat: 'no-repeat',
      position: 'absolute',
      top: 0,
      left: 0,
    }
  }

  // Fallback for standalone single images
  return {
    width: '100%',
    height: '100%',
    backgroundImage: `url("${props.witness.imageUrl}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'absolute',
    top: 0,
    left: 0,
  }
})
</script>

<style scoped>
.witness-avatar-container {
  display: inline-block;
  overflow: hidden;
  box-sizing: border-box;
}

.witness-avatar-fallback {
  user-select: none;
}

.witness-avatar-image {
  opacity: 0;
  transition: opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.witness-avatar-image.is-loaded {
  opacity: 1;
}
</style>
