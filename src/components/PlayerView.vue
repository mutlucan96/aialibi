<template>
  <v-container fluid>
    <!-- Lobby View for Player -->
    <div v-if="game.status === 'lobby'">
      <PlayerLobbyView
        :game-id="gameId"
        :game="game"
        :team-name="teamName"
        :is-joined="isJoined"
        :current-user="currentUser"
        @join-lobby="handleJoinLobby"
      />
    </div>

    <!-- In-Progress View for Player -->
    <div v-else-if="game.status === 'in-progress'">
      <PlayerInProgressView :game-id="gameId" :game="game" :current-user="currentUser" />
    </div>
    <!-- Finished View for Player -->
    <div v-else-if="game.status === 'finished'">
      <PlayerFinishedView :game="game" :case-file="caseFile" />
    </div>

    <!-- Winner Overlay -->
    <v-overlay
      v-if="hasPlayerWon"
      :model-value="hasPlayerWon"
      class="align-center justify-center"
      :style="{ backgroundColor: playerTeamResult.color }"
      persistent
      absolute
    >
      <div class="text-center" style="color: #fff; text-shadow: 0 0 2px BLACK">
        <h1 class="text-h4 font-weight-bold mb-4">CASE SOLVED!</h1>
        <p class="text-h2">{{ getOrdinalWord(playerTeamResult.placement) }} Place</p>
        <p class="text-h1 mt-15">{{ playerTeamResult.emoji }}</p>
        <p class="text-h3 mt-2">{{ playerTeamResult.teamName }}</p>
      </div>
    </v-overlay>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import PlayerLobbyView from './PlayerLobbyView.vue'
import PlayerInProgressView from './PlayerInProgressView.vue'
import { getOrdinalWord } from '@/utils/formatters'
import PlayerFinishedView from './PlayerFinishedView.vue'
/**
 * Props for the PlayerView component.
 * @import {Game, CaseFile} from '@/types.js'
 * @import {PropType} from 'vue'
 * @property {Game} game - The reactive game object from Firebase.
 * @property {string} teamName - The current player's team name.
 * @property {boolean} isJoined - A boolean indicating if the player has successfully joined the lobby.
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
  isJoined: {
    type: Boolean,
    required: true,
  },
  /** @type {PropType<currentUser | null>} */
  currentUser: {
    type: Object,
    required: false,
  },
  /** @type {PropType<CaseFile>} */
  caseFile: {
    type: Object,
  },
})

/**
 * Emits for the PlayerView component.
 * @event join-lobby - Emits the chosen team data when the player clicks the join button.
 * @type {(eventName: 'join-lobby', teamData: {name: string, color?: string, emoji?: string} | string) => void}
 */
const emit = defineEmits(['join-lobby'])

const playerTeamId = computed(() => {
  if (!props.currentUser || !props.game || !props.game.teams) return null
  const teamEntry = Object.entries(props.game.teams).find(
    ([, team]) => team.uid === props.currentUser.uid,
  )
  return teamEntry ? teamEntry[0] : null
})

const hasPlayerWon = computed(() => {
  if (!playerTeamId.value || !props.game || !props.game.results) return false
  return !!props.game.results[playerTeamId.value]
})

const playerTeamResult = computed(() => {
  if (!playerTeamId.value || !props.game || !props.game.results) return null
  return props.game.results[playerTeamId.value]
})

/**
 * Handles the join-lobby emit from PlayerLobbyView and re-emits to GameView.
 * @param {{name: string, color?: string, emoji?: string} | string} teamData - The team data.
 */
function handleJoinLobby(teamData) {
  emit('join-lobby', teamData)
}
</script>
