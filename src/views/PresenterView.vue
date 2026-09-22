<template>
  <v-container fluid class="fill-height px-4 px-md-8">
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

    <!-- Winner Announcement Fullscreen Banner -->
    <transition name="fade">
      <div
        v-if="isWinnerOverlayOpen && latestWinner"
        class="winner-fullscreen-overlay"
        :style="{ backgroundColor: latestWinner.color || '#1976d2' }"
      >
        <div class="text-center winner-text-content px-4">
          <div class="text-h3 text-uppercase font-weight-black tracking-wide text-white mb-4 case-solved-badge">
            🎉 CASE SOLVED! 🎉
          </div>
          <h1 class="text-h1 font-weight-black text-white mb-6 placement-text">
            {{ getOrdinalWord(latestWinner.placement) }} Place
          </h1>
          <div class="winner-emoji mb-6">
            {{ latestWinner.emoji }}
          </div>
          <p class="text-h2 font-weight-bold text-white team-name-text">
            {{ latestWinner.teamName }}
          </p>
        </div>
      </div>
    </transition>
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
const seenWinnerIds = new Set()
let isInitialSync = true

const showSnackbar = (message) => {
  snackbarText.value = message
  snackbar.value = true
}

function getWinnersList(gameData) {
  if (!gameData) return []
  const list = []

  // Check results object
  if (gameData.results) {
    Object.entries(gameData.results).forEach(([id, res]) => {
      if (res) {
        list.push({
          id,
          teamName: res.teamName || (gameData.teams && gameData.teams[id]?.name) || 'Unknown Team',
          color: res.color || (gameData.teams && gameData.teams[id]?.color) || '#1976d2',
          emoji: res.emoji || (gameData.teams && gameData.teams[id]?.emoji) || '🕵️',
          placement: res.placement || 1,
          finishTime: res.finishTime || 0,
        })
      }
    })
  }

  // Also check teams with correctAccusation if not in results
  if (gameData.teams) {
    Object.entries(gameData.teams).forEach(([id, team]) => {
      if (team && team.correctAccusation && !list.some((w) => w.id === id)) {
        list.push({
          id,
          teamName: team.name || 'Unknown Team',
          color: team.color || '#1976d2',
          emoji: team.emoji || '🕵️',
          placement: list.length + 1,
          finishTime: Date.now(),
        })
      }
    })
  }

  return list
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

function checkNewWinners(gameData) {
  if (!gameData) return
  const winners = getWinnersList(gameData)

  if (isInitialSync) {
    // If a winner finished very recently (within last 15 seconds), still celebrate them
    const now = Date.now()
    const recentWinner = winners.find(
      (w) => w.finishTime && now - w.finishTime < 15000,
    )

    winners.forEach((w) => seenWinnerIds.add(w.id))
    isInitialSync = false

    if (recentWinner) {
      triggerWinnerCelebration(recentWinner)
    }
    return
  }

  const newWinners = winners.filter((w) => !seenWinnerIds.has(w.id))
  if (newWinners.length > 0) {
    newWinners.forEach((w) => seenWinnerIds.add(w.id))
    const latest = newWinners[newWinners.length - 1]
    triggerWinnerCelebration(latest)
  }
}

onMounted(() => {
  gameRef = dbRef(db, `games/${props.gameId}`)
  onValue(gameRef, (snapshot) => {
    const data = snapshot.val()
    game.value = data
    loading.value = false
    if (data) {
      checkNewWinners(data)
    }
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
  () => game.value,
  (newData) => {
    if (newData) {
      checkNewWinners(newData)
    }
  },
  { deep: true },
)
</script>

<style scoped>
a {
  text-decoration: none;
}

.winner-fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.winner-text-content {
  color: #fff;
  text-shadow: 0 0 6px #000, 0 4px 24px rgba(0, 0, 0, 0.9);
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.winner-emoji {
  font-size: 8rem;
  line-height: 1;
  animation: bounce 1s infinite alternate;
}

.case-solved-badge {
  letter-spacing: 3px;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
