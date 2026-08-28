<template>
  <div
    v-if="witness?.imageUrl"
    :class="['witness-avatar', roundedClass, customClass]"
    :style="avatarStyle"
    :aria-label="witness?.name"
  />
  <v-avatar
    v-else
    :size="numericSize"
    :class="[roundedClass, customClass]"
    color="grey-lighten-1"
  >
    <span :class="initialsClass">{{ initial }}</span>
  </v-avatar>
</template>

<script setup>
import { computed } from 'vue'

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
})

// CSS sprite positions for a 2x2 grid (1:1 aspect ratio)
const spritePositions = [
  '0% 0%',     // 0: Top-Left
  '100% 0%',   // 1: Top-Right
  '0% 100%',   // 2: Bottom-Left
  '100% 100%', // 3: Bottom-Right
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

const avatarStyle = computed(() => {
  const sizeValue = typeof props.size === 'number' ? `${props.size}px` : props.size

  if (!props.witness?.imageUrl) return {}

  if (isSprite.value) {
    const idx = Number(props.witness.spriteIndex) % 4
    const pos = spritePositions[idx] || '0% 0%'
    return {
      width: sizeValue,
      height: sizeValue,
      backgroundImage: `url("${props.witness.imageUrl}")`,
      backgroundSize: '200% 200%',
      backgroundPosition: pos,
      backgroundRepeat: 'no-repeat',
      flexShrink: 0,
    }
  }

  // Fallback for standalone single images
  return {
    width: sizeValue,
    height: sizeValue,
    backgroundImage: `url("${props.witness.imageUrl}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    flexShrink: 0,
  }
})
</script>

<style scoped>
.witness-avatar {
  display: inline-block;
  overflow: hidden;
  box-sizing: border-box;
}
</style>
