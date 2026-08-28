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
        :case-file="game.story"
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
      v-model="isWinnerOverlayOpen"
      class="align-center justify-center winner-announcement-overlay"
      :scrim="latestWinner?.color || '#1976d2'"
      :opacity="0.95"
      persistent
      z-index="9999"
    >
      <div v-if="latestWinner" class="text-center winner-content px-4">
        <div class="text-h4 text-uppercase font-weight-black tracking-wide text-white mb-2 case-solved-badge">
          🎉 Case Solved! 🎉
        </div>
        <h1 class="text-h1 font-weight-black text-white mb-2 placement-text">
          {{ getOrdinalWord(latestWinner.placement) }}
        </h1>
        <div class="winner-emoji mb-2">
          {{ latestWinner.emoji }}
        </div>
        <p class="text-h2 font-weight-bold text-white team-name-text">
          {{ latestWinner.teamName }}
        </p>
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
 * @property {string} gameId - The ID of the game to display.
 */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { getDatabase, ref as dbRef, onValue, off } from 'firebase/database'
import PresenterLobby from '../components/PresenterLobby.vue'
import PresenterInProgress from '../components/PresenterInProgress.vue'
import PresenterFinished from '../components/PresenterFinished.vue'
import PresenterNotFound from '../components/PresenterNotFound.vue'
import { getOrdinalWord } from '@/utils/formatters.js'

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
const isWinnerOverlayOpen = ref(false)
let winnerTimeout = null
const seenResultIds = new Set()
let isInitialResultsLoad = true

const showSnackbar = (message) => {
  snackbarText.value = message
  snackbar.value = true
}

const triggerWinnerCelebration = (winner) => {
  latestWinner.value = winner
  isWinnerOverlayOpen.value = true

  if (winnerTimeout) {
    clearTimeout(winnerTimeout)
  }
  winnerTimeout = setTimeout(() => {
    isWinnerOverlayOpen.value = false
    latestWinner.value = null
  }, 6000)
}

onMounted(() => {
  gameRef = dbRef(db, `games/${props.gameId}`)
  onValue(gameRef, (snapshot) => {
    const data = snapshot.val()
    game.value = data
    loading.value = false
  })

  showSnackbar('Move this tab to an extended screen and press F11 for fullscreen.')
})

onUnmounted(() => {
  if (gameRef) {
    off(gameRef)
  }
  if (winnerTimeout) {
    clearTimeout(winnerTimeout)
  }
})

watch(
  () => game.value?.results,
  (results) => {
    if (!results) return

    const resultEntries = Object.entries(results)

    if (isInitialResultsLoad) {
      // Register existing results on mount so stale results don't re-trigger
      resultEntries.forEach(([id]) => seenResultIds.add(id))
      isInitialResultsLoad = false
      return
    }

    // Detect any newly added results in real time
    const newResults = resultEntries.filter(([id]) => !seenResultIds.has(id))
    if (newResults.length > 0) {
      const [newId, newWinner] = newResults[0]
      seenResultIds.add(newId)
      triggerWinnerCelebration(newWinner)
    }
  },
  { deep: true },
)
</script>

<style scoped>
a {
  text-decoration: none;
}

.winner-announcement-overlay :deep(.v-overlay__content) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
}

.winner-content {
  color: #fff;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.winner-emoji {
  font-size: 6rem;
  line-height: 1;
  animation: bounce 1s infinite alternate;
}

.case-solved-badge {
  letter-spacing: 2px;
}

@keyframes popIn {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-15px);
  }
}
</style>
