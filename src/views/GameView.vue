<template>
  <v-container fluid class="pa-0">
    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex justify-center align-center" style="height: 80vh">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <!-- Main Content -->
    <div v-else>
      <CreatorView
        v-if="isCreator"
        :game="game"
        :game-settings="gameSettings"
        :is-generating-story="isGeneratingStory"
        :is-generating-images="isGeneratingImages"
        :case-file="caseFile"
        :witnesses="witnesses"
        :show-solution="showSolution"
        @generate-story="handleGenerateStory"
        @generate-images="handleGenerateImages"
        @start-game="handleStartGame"
        @open-presenter-window="handleOpenPresenterWindow"
        @remove-team="handleRemoveTeam"
        @update:witnesses="witnesses = $event"
        @update:show-solution="showSolution = $event"
      />
      <PlayerView
        v-else-if="game"
        :game-id="gameId"
        :game="game"
        :team-name="teamName"
        :is-joined="isJoined"
        :current-user="currentUser"
        @join-lobby="handleJoinLobby"
      />
      <!-- Game Not Found View -->
      <div v-else class="text-center">
        <h2>Game not found</h2>
        <p>The game you are looking for does not exist or may have been deleted.</p>
        <v-btn to="/" color="primary" class="mt-4">Go to Home</v-btn>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { auth, db } from '@/firebase'
import { onValue, ref as dbRef } from 'firebase/database'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import CreatorView from '@/components/CreatorView.vue'
import PlayerView from '@/components/PlayerView.vue'
import { generateImages, generateStory } from '@/utils/ai.js'
import { joinLobby, removeTeam } from '@/utils/lobby.js'
import { startGame } from '@/utils/game-state.js'
import { openPresenterWindow } from '@/utils/ui.js'

/** @import {Game, Story, GameSettings, Witness} from '@/types.js' */

// Props
const props = defineProps({
  gameId: {
    type: String,
    required: true,
  },
})

/** @type {Game | null} */
const game = ref(null)
const currentUser = ref(null)
const isLoading = ref(true)
const isGeneratingStory = ref(false)
const teamName = ref('')
const isJoined = ref(false)

const isGeneratingImages = ref(false)
/** @type {ref<Story | null>} */
const caseFile = ref(null)
/** @type {import('vue').Ref<Witness[]>} */
const witnesses = ref([])
const showSolution = ref(false) // For Race Mode

const isCreator = computed(() => {
  if (!game.value || !currentUser.value) return false
  const creatorId = String(game.value.creatorId || '').trim()
  const userId = String(currentUser.value.uid || '').trim()
  return creatorId === userId && creatorId !== ''
})

/** @type {GameSettings} */
const gameSettings = reactive({
  mode: 'classic',
  languageLevel: 'B1',
  targetVocabulary: '',
  theme: '',
  targetAge: null,
  timeLimit: 15,
})

let gameListener = null

/**
 * Fetches and listens to game data from Firebase.
 */
function fetchGameData() {
  const gameRef = dbRef(db, `games/${props.gameId}`)
  gameListener = onValue(gameRef, (snapshot) => {
    const data = snapshot.val()
    console.log('fetchGameData: Received data from Firebase:', data)
    if (data) {
      game.value = data
      if (data.settings) {
        Object.assign(gameSettings, data.settings)
      }
      if (data.story) {
        caseFile.value = data.story
      }
      // Always update witnesses.value from Firebase if data.witnesses exists
      if (data.witnesses) {
        witnesses.value = data.witnesses
        console.log('fetchGameData: witnesses.value updated:', witnesses.value)
      }
      if (currentUser.value && data.teams) {
        const userTeam = Object.values(data.teams).find(
          (team) => team.uid === currentUser.value.uid,
        )
        if (userTeam) {
          isJoined.value = true
          teamName.value = userTeam.name
        }
      }
    } else {
      game.value = null
    }
    isLoading.value = false
  })
}

async function handleGenerateStory(newSettings) {
  isGeneratingStory.value = true
  caseFile.value = null
  witnesses.value = []
  try {
    const { caseFile: newCaseFile, witnesses: newWitnesses } = await generateStory(
      props.gameId,
      newSettings,
    )
    caseFile.value = newCaseFile
    witnesses.value = newWitnesses
  } catch (error) {
    console.error('Error generating story:', error)
    alert('Error generating story: ' + error.reason)
  } finally {
    isGeneratingStory.value = false
  }
}

async function handleGenerateImages() {
  if (!witnesses.value || witnesses.value.length === 0) return
  isGeneratingImages.value = true
  try {
    witnesses.value = await generateImages(witnesses.value)
  } catch (error) {
    console.error('Error generating images:', error)
  } finally {
    isGeneratingImages.value = false
  }
}

async function handleStartGame() {
  await startGame(props.gameId, caseFile.value, witnesses.value)
}

function handleOpenPresenterWindow() {
  openPresenterWindow(props.gameId)
}

async function handleJoinLobby(newTeamName) {
  await joinLobby(props.gameId, newTeamName, currentUser.value)
  isJoined.value = true
}

async function handleRemoveTeam(teamId) {
  await removeTeam(props.gameId, teamId)
}

let authUnsubscribe = null
onMounted(() => {
  authUnsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // If no user, sign in anonymously first
      await signInAnonymously(auth)
      // onAuthStateChanged will be called again with the anonymous user,
      // so we can return here and let the next call handle fetchGameData.
      return
    }
    currentUser.value = user
    fetchGameData()
  })
})

onUnmounted(() => {
  if (authUnsubscribe) {
    authUnsubscribe()
  }
  if (gameListener) {
    gameListener()
  }
})
</script>
