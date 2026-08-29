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
const isAiResponding = ref(false) // New ref to track AI response status

const isAccusationModalOpen = ref(false)
const accusationCooldown = ref(0)
let cooldownInterval = null
const isAccusationLoading = ref(false)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('error')

const timerUp = ref(false)

const currentTeam = computed(() => {
  if (!props.game?.teams || !props.currentUser?.uid) return null
  if (props.game.teams[props.currentUser.uid]) {
    return props.game.teams[props.currentUser.uid]
  }
  return Object.values(props.game.teams).find((t) => t.uid === props.currentUser.uid) || null
})

const accusationCooldownUntil = computed(() => {
  return currentTeam.value?.accusationCooldownUntil || 0
})

const isAccusationDisabled = computed(() => accusationCooldown.value > 0)

const formattedAccusationCooldown = computed(() => {
  return formatTime(accusationCooldown.value)
})

/**
 *
 */
function updateCooldown() {
  const targetTime = accusationCooldownUntil.value
  if (!targetTime) {
    accusationCooldown.value = 0
    if (cooldownInterval) {
      clearInterval(cooldownInterval)
      cooldownInterval = null
    }
    return
  }

  const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000))
  accusationCooldown.value = remaining

  if (remaining > 0) {
    if (!cooldownInterval) {
      cooldownInterval = setInterval(() => {
        const rem = Math.max(0, Math.ceil((accusationCooldownUntil.value - Date.now()) / 1000))
        accusationCooldown.value = rem
        if (rem <= 0) {
          clearInterval(cooldownInterval)
          cooldownInterval = null
        }
      }, 1000)
    }
  } else if (cooldownInterval) {
    clearInterval(cooldownInterval)
    cooldownInterval = null
  }
}

watch(
  accusationCooldownUntil,
  () => {
    updateCooldown()
  },
  { immediate: true },
)

onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
    cooldownInterval = null
  }
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
  isAccusationModalOpen.value = true
}

/**
 * Handles the submission and evaluation of an accusation.
 * @param {{culprit: string, motive: string}} accusationData - The accusation details.
 * @param {string} accusationData.culprit - The accused witness ID.
 * @param {string} accusationData.motive - The motive text.
 * @returns {Promise<void>}\n
 */
async function handleAccusation({ culprit, motive }) {
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
      console.log('Accusation is INCORRECT.')
      snackbarText.value = 'Incorrect accusation! 2-minute penalty.'
      snackbarColor.value = 'error'
      snackbar.value = true
    }
  } catch (error) {
    console.error('Error during accusation:', error)
    snackbarText.value = error.message || 'An error occurred during accusation.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    isAccusationLoading.value = false
    isAccusationModalOpen.value = false
  }
}

onMounted(async () => {
  if (props.gameId && props.currentUser?.uid) {
    await clearMyWitnessTalkingTo(props.gameId, props.currentUser.uid)
  }
})

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
  currentChatHistory.value.push({ sender: 'ai', text: 'Thinking...' })
  isAiResponding.value = true

  await sendChatMessage(
    props.gameId,
    activeWitness.value.id,
    messageText,
    props.currentUser?.uid,
    (updatedAnswer) => {
      if (
        currentChatHistory.value.length > 0 &&
        currentChatHistory.value[currentChatHistory.value.length - 1].sender === 'ai'
      ) {
        currentChatHistory.value[currentChatHistory.value.length - 1].text = updatedAnswer
      }
    },
    () => {
      isAiResponding.value = false
      updateWitnessTalkingTo(props.gameId, activeWitness.value.id, null)
    },
    (errorMessage) => {
      snackbarText.value = errorMessage
      snackbarColor.value = 'error'
      snackbar.value = true
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

  const gameId = props.gameId
  const currentUserId = props.currentUser.uid

  const teamId = Object.keys(props.game.teams).find(
    (key) => props.game.teams[key].uid === currentUserId,
  )

  if (teamId) {
    await updateWitnessTalkingTo(gameId, witnessId, teamId)
  } else {
    console.error('Could not find team ID for current user:', currentUserId)
  }
}
</script>

<style scoped></style>
