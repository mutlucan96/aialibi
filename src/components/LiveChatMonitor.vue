<template>
  <v-expansion-panels variant="accordion" multiple>
    <v-expansion-panel v-for="witness in game.witnesses" :key="witness.id">
      <v-expansion-panel-title>
        <div class="d-flex align-center">
          <v-avatar size="36" class="mr-3">
            <v-img :src="witness.imageUrl" :alt="witness.name"></v-img>
          </v-avatar>
          <span class="font-weight-medium">{{ witness.name }}</span>
          <v-spacer></v-spacer>
          <v-chip :color="getWitnessStatusColor(witness)" size="small" class="ml-2">
            {{ getWitnessStatus(witness) }}
          </v-chip>
        </div>
      </v-expansion-panel-title>
      <v-expansion-panel-text class="scrollable-panel-content">
        <div v-if="witnessChatHistories[witness.id] && witnessChatHistories[witness.id].length > 0">
          <div v-for="(chat, index) in witnessChatHistories[witness.id]" :key="index" class="mb-4">
            <div class="d-flex align-start mb-1">
              <v-avatar size="28" class="mr-2" :color="game.teams[chat.teamId]?.color">
                <span v-if="game.teams[chat.teamId]">{{ game.teams[chat.teamId].emoji }}</span>
              </v-avatar>
              <div class="chat-message-bubble question">
                {{ chat.question }}
              </div>
            </div>
            <div v-if="chat.answer" class="d-flex align-start justify-end">
              <div class="chat-message-bubble answer">
                {{ chat.answer }}
              </div>
              <v-avatar size="28" class="ml-2">
                <v-img :src="witness.imageUrl" :alt="witness.name"></v-img>
              </v-avatar>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-grey">No questions have been asked yet.</div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { db } from '@/firebase.js'
import { ref as dbRef, onValue } from 'firebase/database'

/**
 * LiveChatMonitor component displays real-time chat history for all witnesses.
 * It uses Vuetify's expansion panels to show chat logs for each witness.
 * @import { Game, Witness, ChatHistoryItem } from '@/types.js'
 * @import { PropType, Ref } from 'vue'
 */
const props = defineProps({
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },
  gameId: {
    type: String,
    required: true,
  },
})

/** @type {Ref<Object.<string, ChatHistoryItem[]>>} */
const witnessChatHistories = ref({})
const unsubscribeFns = ref([])

const subscribeToChatHistory = (gameId, witnessId) => {
  const chatRef = dbRef(db, `games/${gameId}/chats/${witnessId}`)
  const unsubscribe = onValue(chatRef, (snapshot) => {
    const chatHistory = snapshot.val() || {}
    witnessChatHistories.value[witnessId] = Object.keys(chatHistory)
      .map((key) => ({
        id: key,
        ...chatHistory[key],
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  })
  unsubscribeFns.value.push(unsubscribe)
}

const loadAndSubscribeToAllChatHistories = () => {
  unsubscribeFns.value.forEach((unsubscribe) => unsubscribe())
  unsubscribeFns.value = []
  if (props.game && props.game.witnesses) {
    for (const witness of props.game.witnesses) {
      subscribeToChatHistory(props.gameId, witness.id)
    }
  }
}

onMounted(loadAndSubscribeToAllChatHistories)

onUnmounted(() => {
  unsubscribeFns.value.forEach((unsubscribe) => unsubscribe())
})

watch(() => props.game.witnesses, loadAndSubscribeToAllChatHistories, { deep: true })

/**
 * Generates the status text for a witness.
 * @param {Witness} witness - The witness object.
 * @returns {string} - The status text (e.g., "Available" or "Talking to Team Alpha").
 */
const getWitnessStatus = (witness) => {
  if (witness.talkingToTeamId && props.game.teams[witness.talkingToTeamId]) {
    const team = props.game.teams[witness.talkingToTeamId]
    return `Talking to ${team.name}`
  }
  return 'Available'
}

/**
 * Determines the color for the witness status chip.
 * @param {Witness} witness - The witness object.
 * @returns {string} - The color string for the Vuetify chip.
 */
const getWitnessStatusColor = (witness) => {
  if (witness.talkingToTeamId) {
    return 'orange'
  }
  return 'green'
}
</script>

<style scoped>
.chat-message-bubble {
  padding: 8px 12px;
  border-radius: 15px;
  word-wrap: break-word;
  max-width: 70%;
}

.question {
  background-color: #e0e0e0;
  color: black;
}

.answer {
  background-color: #1976d2;
  color: white;
}

.scrollable-panel-content {
  max-height: 300px; /* Adjust as needed */
  overflow-y: auto;
}

.v-avatar >>> .v-img__img--cover {
  object-fit: contain !important;
}
</style>
