<template>
  <v-container v-if="game" class="fill-height" fluid>
    <template v-if="game.status === 'lobby'">
      <v-row align="center" justify="center">
        <!-- Left Column: Game Code and QR Code -->
        <v-col cols="12" md="6" class="text-center">
          <h1 class="text-h3 mb-4">Join the Game!</h1>
          <div class="text-h1 font-weight-bold mb-8">
            {{ gameId }}
          </div>
          <div class="d-flex justify-center">
            <qrcode-vue :value="joinGameUrl" :size="200" level="H"></qrcode-vue>
          </div>
          <p class="mt-4 text-h6">Scan to join</p>
        </v-col>

        <!-- Right Column: Teams in the Lobby -->
        <v-col cols="12" md="6">
          <h2 class="text-h4 mb-4 text-center">Teams in the Lobby</h2>
          <v-list v-if="teams.length > 0" dense>
            <v-list-item v-for="team in teams" :key="team.id">
              <v-list-item-title class="text-h5"
                >{{ team.emoji }} {{ team.name }}</v-list-item-title
              >
            </v-list-item>
          </v-list>
          <p v-else class="text-h6 text-center">No teams have joined yet.</p>
        </v-col>
      </v-row>

      <!-- Footer for Lobby Screen -->
      <v-row class="mt-auto">
        <v-col class="text-center">
          <p class="text-h6">Waiting for the host to start the game...</p>
        </v-col>
      </v-row>
    </template>

    <template v-else-if="game.status === 'in-progress'">
      <v-row align="center" justify="center" class="fill-height">
        <v-col class="text-center">
          <h1 class="text-h2">Game In Progress</h1>
          <p class="text-h5 mt-4">Content for in-progress phase will go here.</p>
        </v-col>
      </v-row>
    </template>

    <template v-else-if="game.status === 'finished'">
      <v-row align="center" justify="center" class="fill-height">
        <v-col class="text-center">
          <h1 class="text-h2">Game Finished</h1>
          <p class="text-h5 mt-4">Content for finished phase will go here.</p>
        </v-col>
      </v-row>
    </template>

    <template v-else>
      <v-row align="center" justify="center" class="fill-height">
        <v-col class="text-center">
          <h1 class="text-h2">Unknown Game Status</h1>
          <p class="text-h5 mt-4">The game status is not recognized.</p>
        </v-col>
      </v-row>
    </template>
  </v-container>
  <v-container v-else class="fill-height" fluid>
    <v-row align="center" justify="center" class="fill-height">
      <v-col class="text-center">
        <h1 class="text-h2">Game Not Found</h1>
        <p class="text-h5 mt-4">
          The game with ID "{{ gameId }}" does not exist or could not be loaded.
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
/**
 * PresenterView component
 *
 * Displays the game state for the presenter, including a lobby screen with game code, QR code,
 * and a live list of joined teams. Transitions to in-progress and finished screens.
 *
 * @prop {string} gameId - The ID of the game to display.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getDatabase, ref as dbRef, onValue } from 'firebase/database'
import QrcodeVue from 'qrcode.vue'

const props = defineProps({
  gameId: {
    type: String,
    required: true,
  },
})

const game = ref(null)
const db = getDatabase()
let gameRef = null

onMounted(() => {
  gameRef = dbRef(db, `games/${props.gameId}`)
  onValue(gameRef, (snapshot) => {
    game.value = snapshot.val()
  })
})

onUnmounted(() => {
  // Detach listener when component is unmounted
  if (gameRef) {
    onValue(gameRef, () => {}) // Detach by calling onValue with an empty callback
  }
})

const teams = computed(() => {
  if (!game.value || !game.value.teams) {
    return []
  }
  return Object.entries(game.value.teams).map(([id, teamData]) => ({
    id,
    ...teamData,
  }))
})

const joinGameUrl = computed(() => {
  // Assuming the client-side game join URL is /game/{gameId}
  return `${window.location.origin}/game/${props.gameId}`
})
</script>

<style scoped></style>
