<template>
  <v-container fluid>
    <!-- Lobby View for Player -->
    <div v-if="game.status === 'lobby'">
      <PlayerLobbyView :team-name="teamName" :is-joined="isJoined" @join-lobby="handleJoinLobby" />
    </div>

    <!-- In-Progress View for Player -->
    <div v-else-if="game.status === 'in-progress'">
      <PlayerInProgressView />
    </div>

    <!-- Finished View for Player -->
    <div v-else-if="game.status === 'finished'">
      <PlayerFinishedView />
    </div>
  </v-container>
</template>

<script setup>
import PlayerLobbyView from './PlayerLobbyView.vue'
import PlayerInProgressView from './PlayerInProgressView.vue'
import PlayerFinishedView from './PlayerFinishedView.vue'

/**
 * Props for the PlayerView component.
 * @import {Game} from '@/types.js'
 * @import {PropType} from 'vue'
 * @property {Game} game - The reactive game object from Firebase.
 * @property {string} teamName - The current player's team name.
 * @property {boolean} isJoined - A boolean indicating if the player has successfully joined the lobby.
 */
defineProps({
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },
  teamName: {
    type: String,
    required: true,
  },
  isJoined: {
    type: Boolean,
    required: true,
  },
})

/**
 * Emits for the PlayerView component.
 * @event join-lobby - Emits the chosen team name when the player clicks the join button.
 * @type {(eventName: 'join-lobby', teamName: string) => void}
 */
const emit = defineEmits(['join-lobby'])

function handleJoinLobby(teamName) {
  emit('join-lobby', teamName)
}
</script>
