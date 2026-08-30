<template>
  <v-container style="max-width: 1200px">
    <TimerView
      v-if="game.settings.mode === 'race'"
      :startTime="game.startTime || 0"
      :duration="game.duration || 0"
      @timer-up="handleTimerUp"
    />
    <CrimeDescription :crime="game.story.crime" />
    <WitnessesView
      :game-id="gameId"
      :game="game"
      :mode="game.settings.mode"
      @open-chat="handleOpenChat"
      @open-accusation="handleOpenAccusation"
      @update-talking-to="handleUpdateTalkingTo"
      :is-accusation-disabled="isAccusationDisabled"
      :accusation-cooldown-text="formattedAccusationCooldown"
      :timer-up="timerUp"
    />
    <ChatModal
      v-if="activeWitness"
      ref="chatModalRef"
      v-model="isChatOpen"
      :witness="activeWitness"
      :chatHistory="currentChatHistory"
      :isAiResponding="isAiResponding"
      @send-message="handleSendMessage"
      @close="isChatOpen = false"
    />
    <AccusationButton
      @open-accusation="handleOpenAccusation"
      :is-disabled="isAccusationDisabled"
      :cooldown-text="formattedAccusationCooldown"
    />
    <AccusationModal
      v-model="isAccusationModalOpen"
      :game="game"
      :is-disabled="isAccusationDisabled"
      @submit-accusation="handleAccusation"
      @close="isAccusationModalOpen = false"
      :is-loading="isAccusationLoading"
    />

    <v-snackbar v-model="snackbar" :timeout="5000" :color="snackbarColor" location="bottom">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="snackbar = false"> Close </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TimerView from './game/TimerView.vue'
import CrimeDescription from './game/CrimeDescription.vue'
import WitnessesView from './game/WitnessesView.vue'
import ChatModal from './game/ChatModal.vue'
import AccusationButton from './game/AccusationButton.vue'
import AccusationModal from './game/AccusationModal.vue'
import {
  updateWitnessTalkingTo,
  clearMyWitnessTalkingTo,
  getChatHistory,
  finishGame,
  setAccusationCooldown,
} from '@/utils/game-state.js'
import { sendChatMessage, evaluateAccusation } from '@/utils/ai.js'
import { formatTime } from '@/utils/ui.js'

/**
 * @import {Game} from '@/types.js'
 * @import {PropType} from 'vue'
 * @property {import('firebase/auth').User | null} currentUser - The current authenticated user.
 */
const props = defineProps({
  gameId: {
    type: String,
    required: true,
  },
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },
  /** @type {PropType<currentUser | null>} */
  currentUser: {
    type: Object,
    required: false,
  },
})

const route = useRoute()
const router = useRouter()

const isChatOpen = ref(false)
const activeWitness = ref(null)
const currentChatHistory = ref([])
const chatModalRef = ref(null)
const isAiResponding = ref(false)

const isAccusationModalOpen = ref(false)
const accusationCooldown = ref(0)
let cooldownInterval = null
const isAccusationLoading = ref(false)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('error')

const timerUp = ref(false)

/**
 *
 * @param text
 * @param color
 */
function showNotification(text, color = 'error') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const currentTeamId = computed(() => {
  if (!props.currentUser?.uid) return null
  if (props.game?.teams && props.game.teams[props.currentUser.uid]) {
    return props.currentUser.uid
  }
  if (props.game?.teams) {
    const entry = Object.entries(props.game.teams).find(
      ([, team]) => team && team.uid === props.currentUser.uid,
    )
    if (entry) return entry[0]
  }
  return props.currentUser.uid
})

const currentTeam = computed(() => {
  if (!props.game?.teams || !currentTeamId.value) return null
  return props.game.teams[currentTeamId.value] || null
})

const accusationCooldownUntil = computed(() => {
  return currentTeam.value?.accusationCooldownUntil || 0
})

const isAccusationDisabled = computed(() => accusationCooldown.value > 0)

const formattedAccusationCooldown = computed(() => {
  return formatTime(accusationCooldown.value)
})

const storageKey = computed(() => {
  return props.gameId && props.currentUser?.uid
    ? `accusation_cooldown_${props.gameId}_${props.currentUser.uid}`
    : null
})

/**
 *
 */
function getStoredCooldown() {
  if (!storageKey.value) return 0
  try {
    const val = localStorage.getItem(storageKey.value)
    return val ? Number(val) : 0
  } catch {
    return 0
  }
}

/**
 *
 * @param timestamp
 */
function setStoredCooldown(timestamp) {
  if (!storageKey.value) return
  try {
    if (timestamp && timestamp > Date.now()) {
      localStorage.setItem(storageKey.value, String(timestamp))
    } else {
      localStorage.removeItem(storageKey.value)
    }
  } catch {
    // ignore
  }
}

/**
 *
 */
function clearCooldownTimer() {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
    cooldownInterval = null
  }
}

/**
 *
 * @param targetTimestamp
 */
function startCooldown(targetTimestamp) {
  clearCooldownTimer()
  setStoredCooldown(targetTimestamp)

  const tick = () => {
    const remaining = Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000))
    accusationCooldown.value = remaining
    if (remaining <= 0) {
      clearCooldownTimer()
      setStoredCooldown(0)
    }
  }

  tick()
  if (accusationCooldown.value > 0) {
    cooldownInterval = setInterval(tick, 1000)
  }
}

/**
 *
 */
function syncCooldown() {
  const rtdbTime = Number(accusationCooldownUntil.value) || 0
  const localStoredTime = getStoredCooldown()
  const targetTime = Math.max(rtdbTime, localStoredTime)

  if (targetTime > Date.now()) {
    startCooldown(targetTime)
  } else {
    accusationCooldown.value = 0
    clearCooldownTimer()
    setStoredCooldown(0)
  }
}

watch(
  () => currentTeam.value?.accusationCooldownUntil,
  () => {
    syncCooldown()
  },
)

onMounted(async () => {
  syncCooldown()
  if (props.gameId && props.currentUser?.uid) {
    await clearMyWitnessTalkingTo(props.gameId, props.currentUser.uid)
  }
})

onUnmounted(() => {
  clearCooldownTimer()
})

// Watch for changes in isChatOpen to manage browser history and update witness talkingTo state
watch(isChatOpen, async (newValue) => {
  if (newValue) {
    await router.push({ query: { ...route.query, chat: 'open' } })
  } else {
    const newQuery = { ...route.query }
    delete newQuery.chat
    await router.replace({ query: newQuery })

    if (activeWitness.value && props.gameId) {
      await updateWitnessTalkingTo(props.gameId, activeWitness.value.id, null)
    }
  }
})

// Watch for changes in route query to close modal if 'chat' parameter is removed
watch(
  () => route.query.chat,
  (newChatQuery) => {
    if (!newChatQuery && isChatOpen.value) {
      isChatOpen.value = false
    }
  },
)

/**
 * Opens the accusation modal.
 */
function handleOpenAccusation() {
  if (isAccusationDisabled.value) {
    showNotification(
      `Please wait ${formattedAccusationCooldown.value} before making another accusation.`,
      'warning',
    )
    return
  }
  isAccusationModalOpen.value = true
}

/**
 * Handles the submission and evaluation of an accusation.
 * @param {{culprit: string, motive: string}} accusationData - The accusation details.
 * @param {string} accusationData.culprit - The accused witness ID.
 * @param {string} accusationData.motive - The motive text.
 * @returns {Promise<void>}
 */
async function handleAccusation({ culprit, motive }) {
  if (isAccusationDisabled.value) {
    showNotification(
      `Accusation is on cooldown. Please wait ${formattedAccusationCooldown.value}.`,
      'warning',
    )
    isAccusationModalOpen.value = false
    return
  }

  isAccusationLoading.value = true
  try {
    console.log('Accusation submitted:', { culprit, motive })
    const isCorrect = await evaluateAccusation(
      props.gameId,
      culprit,
      motive,
      props.currentUser?.uid,
    )

    if (isCorrect) {
      console.log('Accusation is CORRECT!')
      if (props.game.settings?.mode !== 'race') {
        await finishGame(props.gameId)
      }
    } else {
      console.log('Accusation is INCORRECT. Starting cooldown.')
      showNotification('Incorrect accusation! 2-minute penalty.', 'error')

      const cooldownUntil = Date.now() + 120 * 1000
      startCooldown(cooldownUntil)

      const teamId = currentTeamId.value
      if (teamId && props.gameId) {
        try {
          await setAccusationCooldown(props.gameId, teamId, cooldownUntil)
        } catch (e) {
          console.error('Failed to update cooldown in database:', e)
        }
      }
    }
  } catch (error) {
    console.error('Error during accusation:', error)
    showNotification(error.message || 'An error occurred during accusation.', 'error')
  } finally {
    isAccusationLoading.value = false
    isAccusationModalOpen.value = false
  }
}

/**
 * Handles game timer expiration.
 */
function handleTimerUp() {
  timerUp.value = true
}

/**
 * Opens chat dialogue with the specified witness.
 * @param {string} witnessId - The ID of the witness.
 * @returns {Promise<void>}
 */
async function handleOpenChat(witnessId) {
  activeWitness.value = props.game.witnesses.find((w) => w.id === witnessId)
  if (activeWitness.value) {
    // Load chat history for this witness
    const history = await getChatHistory(
      props.gameId,
      activeWitness.value.id,
      props.currentUser.uid,
    )
    currentChatHistory.value = []
    history.forEach((chat) => {
      if (chat.question) {
        currentChatHistory.value.push({
          sender: 'player',
          text: chat.question,
          timestamp: chat.timestamp,
        })
      }
      if (chat.answer) {
        currentChatHistory.value.push({
          sender: 'ai',
          text: chat.answer,
          timestamp: chat.timestamp,
        })
      }
    })
  }
  isChatOpen.value = true
}

/**
 * Sends a message question to the active witness and awaits response.
 * @param {string} messageText - The question message text.
 * @returns {Promise<void>}
 */
async function handleSendMessage(messageText) {
  currentChatHistory.value.push({ sender: 'player', text: messageText })
  isAiResponding.value = true
  let responseAdded = false

  await sendChatMessage(
    props.gameId,
    activeWitness.value.id,
    messageText,
    props.currentUser?.uid,
    (updatedAnswer) => {
      if (!responseAdded) {
        currentChatHistory.value.push({
          sender: 'ai',
          text: updatedAnswer,
        })
        responseAdded = true
      } else {
        currentChatHistory.value[currentChatHistory.value.length - 1].text = updatedAnswer
      }
    },
    () => {
      isAiResponding.value = false
      updateWitnessTalkingTo(props.gameId, activeWitness.value.id, null)
    },
    (errorMessage) => {
      showNotification(errorMessage, 'error')
    },
  )
}

/**
 * Updates which witness the current team is talking to.
 * @param {string} witnessId - The ID of the witness.
 * @returns {Promise<void>}
 */
async function handleUpdateTalkingTo(witnessId) {
  if (!props.game || !props.currentUser) {
    console.error('Game or current user is not available to update talkingTo.')
    return
  }

  const teamId = currentTeamId.value
  if (teamId) {
    await updateWitnessTalkingTo(props.gameId, witnessId, teamId)
  } else {
    console.error('Could not find team ID for current user:', props.currentUser.uid)
  }
}
</script>

<style scoped></style>
