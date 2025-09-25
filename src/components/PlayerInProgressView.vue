<template>
  <v-container fluid>
    <TimerView
      v-if="game.settings.mode === 'race'"
      :startTime="game.startTime"
      :duration="game.duration"
    />
    <CrimeDescription :crime="game.story.crime" />
    <WitnessesView
      :game-id="game.id"
      :game="game"
      :mode="game.settings.mode"
      @open-chat="handleOpenChat"
      @open-accusation="handleOpenAccusation"
      @update-talking-to="handleUpdateTalkingTo"
    />
    <ChatModal
      ref="chatModalRef"
      v-model="isChatOpen"
      :witness="activeWitness"
      :chatHistory="currentChatHistory"
      @send-message="handleSendMessage"
      @close="isChatOpen = false"
    />
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TimerView from './game/TimerView.vue'
import CrimeDescription from './game/CrimeDescription.vue'
import WitnessesView from './game/WitnessesView.vue'
import ChatModal from './game/ChatModal.vue'

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
const chatModalRef = ref(null) // New ref for ChatModal

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

function handleOpenChat(witnessId) {
  activeWitness.value = props.game.witnesses.find((w) => w.id === witnessId)
  currentChatHistory.value = [] // Load chat history for this witness
  isChatOpen.value = true
}

function handleOpenAccusation() {
  // Logic for making an accusation
  console.log('Make an Accusation button clicked!')
  // This would typically open another modal or navigate to an accusation view
}

import { updateWitnessTalkingTo } from '@/utils/game-state.js'
import { sendChatMessage } from '@/utils/ai.js'

async function handleSendMessage(messageText) {
  console.log('Message sent:', messageText)
  currentChatHistory.value.push({ sender: 'player', text: messageText })

  let aiResponseText = ''
  await sendChatMessage(
    messageText,
    (chunk) => {
      aiResponseText += chunk
      // Update the last AI message or add a new one
      if (currentChatHistory.value.length > 0 && currentChatHistory.value[currentChatHistory.value.length - 1].sender === 'ai') {
        currentChatHistory.value[currentChatHistory.value.length - 1].text = aiResponseText
      } else {
        currentChatHistory.value.push({ sender: 'ai', text: aiResponseText })
      }
      // Stream the chunk to the ChatModal
      if (chatModalRef.value) {
        chatModalRef.value.streamAiResponse(chunk)
      }
    },
    () => {
      console.log('AI response complete.')
      // Signal completion to the ChatModal
      if (chatModalRef.value) {
        chatModalRef.value.streamAiResponse('', true) // Pass true for done
      }
    }
  )
}

async function handleUpdateTalkingTo(witnessId) {
  // Ensure game and current user are available
  if (!props.game || !props.currentUser) {
    console.error('Game or current user is not available to update talkingTo.')
    return
  }

  const gameId = props.gameId
  const currentUserId = props.currentUser.uid

  // Find the team ID for the current user
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
