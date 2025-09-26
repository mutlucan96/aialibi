<template>
  <v-container class="fill-height">
    <template v-if="game">
      <PresenterLobby v-if="game.status === 'lobby'" :gameId="gameId" :game="game" />
      <PresenterInProgress v-else-if="game.status === 'in-progress'" :game="game" />
      <PresenterFinished v-else-if="game.status === 'finished'" />
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
import { ref, onMounted, onUnmounted } from 'vue'
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

onMounted(() => {
  gameRef = dbRef(db, `games/${props.gameId}`)
  onValue(gameRef, (snapshot) => {
    game.value = snapshot.val()
    loading.value = false
  })
})

onUnmounted(() => {
  if (gameRef) {
    onValue(gameRef, () => {})
  }
})
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
