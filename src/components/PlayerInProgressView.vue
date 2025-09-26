<template>
  <v-container fluid>
    <TimerView
      v-if="game.settings.mode === 'race'"
      :startTime="game.startTime || 0"
      :duration="game.duration || 0"
    />
    <CrimeDescription :crime="game.story.crime" />
    <WitnessesView
      :game-id="gameId"
      :game="game"
      :mode="game.settings.mode"
      @open-chat="handleOpenChat"
      @open-accusation="handleOpenAccusation"
      @update-talking-to="handleUpdateTalkingTo"
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
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TimerView from './game/TimerView.vue'
import CrimeDescription from './game/CrimeDescription.vue'
import WitnessesView from './game/WitnessesView.vue'
import ChatModal from './game/ChatModal.vue'
import {
  updateWitnessTalkingTo,
  clearAllWitnessTalkingTo,
  getChatHistory,
} from '@/utils/game-state.js'
import { sendChatMessage } from '@/utils/ai.js'

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
  teamName: {
    type: String,
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

function handleOpenAccusation() {
  // Logic for making an accusation
  console.log('Make an Accusation button clicked!')
  // This would typically open another modal or navigate to an accusation view
}

onMounted(async () => {
  if (props.gameId) {
    await clearAllWitnessTalkingTo(props.gameId)
  }
})

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

async function handleSendMessage(messageText) {
  currentChatHistory.value.push({ sender: 'player', text: messageText })
  currentChatHistory.value.push({ sender: 'ai', text: '' })
  isAiResponding.value = true

  await sendChatMessage(
    props.gameId,
    activeWitness.value.id,
    messageText,
    activeWitness.value,
    props.currentUser.uid,
    (chunk) => {
      if (
        currentChatHistory.value.length > 0 &&
        currentChatHistory.value[currentChatHistory.value.length - 1].sender === 'ai'
      ) {
        currentChatHistory.value[currentChatHistory.value.length - 1].text += chunk
      }
    },
    () => {
      isAiResponding.value = false
      updateWitnessTalkingTo(props.gameId, activeWitness.value.id, null)
    },
  )
}

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
