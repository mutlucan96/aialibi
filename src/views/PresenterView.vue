<template>
  <v-container class="fill-height">
    <template v-if="game">
      <PresenterLobby
        v-if="game.status === 'lobby'"
        :gameId="gameId"
        :game="game"
        :teams="game.teams"
        :results="game.results"
      />
      <PresenterInProgress v-else-if="game.status === 'in-progress'" :game="game" />
      <PresenterFinished
        v-else-if="game.status === 'finished'"
        :game="game"
        :teams="game.teams"
        :results="game.results"
      />
      <v-row v-else align="center" justify="center" class="fill-height">
        <v-col class="text-center">
          <h1 class="text-h2">Unknown Game Status</h1>
          <p class="text-h5 mt-4">The game status is not recognized.</p>
        </v-col>
      </v-row>
    </template>
    <template v-else>
      <PresenterNotFound :gameId="gameId" :loading="loading" />
    </template>

    <v-snackbar v-model="snackbar" :timeout="snackbarTimeout" color="info">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="snackbar = false"> Close </v-btn>
      </template>
    </v-snackbar>

    <!-- Winner Announcement Overlay -->
    <v-overlay
      v-if="latestWinner"
      :model-value="latestWinner"
      class="align-center justify-center"
      :style="{ backgroundColor: latestWinner.color }"
      persistent
      absolute
    >
      <div class="text-center" style="color: #fff; text-shadow: 0 0 2px BLACK">
        <h1 class="text-h1 font-weight-bold mb-4">{{ latestWinner.placement }}</h1>
        <p class="text-h1 mt-4">{{ latestWinner.emoji }}</p>
        <p class="text-h3 mt-2">{{ latestWinner.teamName }}</p>
      </div>
    </v-overlay>
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
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { getDatabase, ref as dbRef, onValue } from 'firebase/database'
import PresenterLobby from '../components/PresenterLobby.vue'
import PresenterInProgress from '../components/PresenterInProgress.vue'
import PresenterFinished from '../components/PresenterFinished.vue'
import PresenterNotFound from '../components/PresenterNotFound.vue'

const props = defineProps({
  gameId: {
    type: String,
    required: true,
  },
})

const game = ref(null)
const loading = ref(true)
const db = getDatabase()
let gameRef = null

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarTimeout = ref(10000)

const latestWinner = ref(null)
let winnerTimeout = null

const showSnackbar = (message) => {
  snackbarText.value = message
  snackbar.value = true
}

onMounted(() => {
  gameRef = dbRef(db, `games/${props.gameId}`)
  onValue(gameRef, (snapshot) => {
    game.value = snapshot.val()
    loading.value = false
  })

  showSnackbar('Move this tab to an extended screen and press F11 for fullscreen.')
})

onUnmounted(() => {
  if (gameRef) {
    onValue(gameRef, () => {})
  }
  if (winnerTimeout) {
    clearTimeout(winnerTimeout)
  }
})

watch(
  () => game.value?.results,
  (newResults, oldResults) => {
    console.log(
      'PresenterView: game.value.results changed. New results:',
      newResults,
      'Old results:',
      oldResults,
    )
    if (
      newResults &&
      (!oldResults || Object.keys(newResults).length > Object.keys(oldResults).length)
    ) {
      const newResultKeys = Object.keys(newResults).filter((key) => !oldResults || !oldResults[key])
      if (newResultKeys.length > 0) {
        const newWinnerId = newResultKeys[0]
        latestWinner.value = newResults[newWinnerId]

        if (winnerTimeout) {
          clearTimeout(winnerTimeout)
        }
        winnerTimeout = setTimeout(() => {
          latestWinner.value = null
        }, 5000)
      }
    }
  },
  { deep: true },
)
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
