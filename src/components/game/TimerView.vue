<template>
  <v-chip class="ma-2" color="primary" label>
    <v-icon start icon="mdi-clock-outline"></v-icon>
    <span v-if="timeLeft > 0">{{ formattedTime }}</span>
    <span v-else>Time's Up!</span>
  </v-chip>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  startTime: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['timer-up'])

const timeLeft = ref(0)
let intervalId = null
let endTime = 0

const calculateTimeLeft = () => {
  const remaining = (endTime - Date.now()) / 1000
  timeLeft.value = Math.max(0, Math.floor(remaining))
  if (remaining <= 0) {
    emit('timer-up')
    clearInterval(intervalId)
  }
}

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

onMounted(() => {
  endTime = props.startTime + props.duration * 1000
  calculateTimeLeft()
  intervalId = setInterval(calculateTimeLeft, 1000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped></style>
