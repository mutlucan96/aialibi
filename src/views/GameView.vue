<template>
  <v-container fluid>
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
        @generate-story="generateStory"
        @generate-images="generateImages"
        @start-game="startGame"
        @open-presenter-window="openPresenterWindow"
        @remove-team="removeTeam"
        @update:witnesses="witnesses = $event"
        @update:show-solution="showSolution = $event"
      />
      <PlayerView
        v-else-if="game"
        :game="game"
        :team-name="teamName"
        :is-joined="isJoined"
        @join-lobby="joinLobby"
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
import { onValue, ref as dbRef, remove, set, update } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import CreatorView from '@/components/CreatorView.vue'
import PlayerView from '@/components/PlayerView.vue'

/** @typedef {import('../types/index.js')} AppTypes */

// Props
const props = defineProps({
  gameId: {
    type: String,
    required: true,
  },
})

// State
/** @type {Ref<AppTypes.Game | null>} */
const game = ref(null)
const currentUser = ref(null)
const isLoading = ref(true)
const isGeneratingStory = ref(false)
const teamName = ref('')
const isJoined = ref(false)

// New state for creator workflow
const isGeneratingImages = ref(false)
/** @type {Ref<AppTypes.Story | null>} */
const caseFile = ref(null)
/** @type {Ref<AppTypes.Witness[]>} */
const witnesses = ref([])
const showSolution = ref(false) // For Race Mode

const isCreator = computed(() => {
  if (!game.value || !currentUser.value) return false
  const creatorId = String(game.value.creatorId || '').trim()
  const userId = String(currentUser.value.uid || '').trim()
  return creatorId === userId && creatorId !== ''
})

/** @type {AppTypes.GameSettings} */
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

/**
 * Generates the story based on the settings.
 * This function constructs a prompt for a powerful AI model (like Gemini 1.5 Pro)
 * to generate the entire case file, including the secret solution and witness details.
 * @param {AppTypes.GameSettings} newSettings - The game settings from the form.
 * @async
 */
async function generateStory(newSettings) {
  isGeneratingStory.value = true
  caseFile.value = null
  witnesses.value = []

  // Update game settings in Firebase right away
  const gameRef = dbRef(db, `games/${props.gameId}`)
  // IMPORTANT: Do NOT set witnesses to null here. It will clear the array in Firebase
  // and cause issues with the fetchGameData listener. We will update it with the full
  // generated list later.
  await update(gameRef, { settings: { ...newSettings }, story: null })

  // --- AI Prompt Construction ---
  const prompt = `
    You are a master detective story writer. Based on the following game settings, create a compelling mystery case file.
    Game Settings:
    - Mode: ${newSettings.mode}
    - Language Level: ${newSettings.languageLevel}
    - Target Age: ${newSettings.targetAge || 'any'}
    - Target Vocabulary: ${newSettings.targetVocabulary || 'none'}
    - Theme: ${newSettings.theme || 'classic detective story'}

    Please return ONLY a valid JSON object with the following structure:
    {
      "crime": "A detailed description of the crime that was committed.",
      "clue": "A single, crucial clue that(can help solve the case. This clue will be revealed later in the game.",
      "culprit": "The name of the witness who is the culprit.",
      "motive": "The culprit's reason for committing the crime.",
      "witnesses": [
        {
          "name": "Witness Name 1",
          "personality": "A very detailed personality profile for the witness. This will be used by another AI to role-play as this character. Include their background, their relationship to the crime/victim, their personality, secrets, and how they might behave during an interrogation. This needs to be rich enough for an AI to generate dialogue from.",
          "outfit": "A short (10-15 words), purely visual description of the character's appearance, suitable for an image generation prompt. Example: 'A friendly school gardener with a big hat and a watering can'."
        },
        { "name": "Witness Name 2", "personality": "...", "outfit": "..." },
        { "name": "Witness Name 3", "personality": "...", "outfit": "..." },
        { "name": "Witness Name 4", "personality": "...", "outfit": "..." }
      ]
    }
    Ensure the culprit's name is one of the four witness names.
  `

  // --- Simulate Firebase AI Extension Call ---
  console.log('--- GENERATING STORY PROMPT ---')
  console.log(prompt)

  // Simulate a delay for the AI call
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const mockApiResponse = {
    crime: `The world-renowned "Midnight Diamond" has been stolen from its display case at the Grand Museum Gala. The glass was cut with surgical precision, and the only thing left behind was a single, pristine white feather.`,
    clue: 'A small, almost invisible tear was found on the velvet cushion where the diamond once sat. It appears to be from a sharp, hooked object, not from the glass cutting.',
    culprit: 'Baroness Von Helsing',
    motive:
      'The Baroness is secretly a kleptomaniac from a fallen noble family. She stole the diamond to reclaim a piece of the lavish lifestyle she lost, driven by a compulsive desire for beautiful things.',
    witnesses: [
      {
        name: 'Baroness Von Helsing',
        personality:
          "The Baroness is an elderly, elegant woman, always dressed in vintage haute couture. She appears frail and speaks with a sophisticated, almost theatrical accent. She was a close friend of the museum curator and a major donor. Beneath her polished exterior, she is cunning and deeply resentful of her family's lost fortune. She might nervously fiddle with her pearl necklace when lying.",
        outfit:
          'An elegant, elderly aristocratic woman with sharp eyes, wearing a vintage black dress and a string of pearls. She looks slightly disdainful.',
      },
      {
        name: "Marco 'The Magician' Bellini",
        personality:
          "A charismatic and flamboyant stage magician hired as entertainment for the gala. He's charming, a bit of a show-off, and loves being the center of attention. He claims to have been performing a card trick at the exact moment of the theft. He is a master of misdirection and might have seen more than he lets on, but he's also afraid of getting involved with the police.",
        outfit:
          'A handsome, charismatic stage magician in his late 30s with a tuxedo and a top hat, holding a single playing card.',
      },
      {
        name: 'Dr. Alistair Finch',
        personality:
          "The museum's lead historian and gemologist. He's a quiet, academic man in his 50s, obsessed with the history of the diamond. He was the last person to check on the diamond before the gala began. He is precise, detail-oriented, and slightly socially awkward. He might seem nervous, but it's mostly because he feels responsible for the diamond's safety.",
        outfit:
          'A bookish, slightly disheveled male historian in his 50s, wearing a tweed jacket with elbow patches and glasses.',
      },
      {
        name: 'Fifi LaRoux',
        personality:
          "A young, ambitious journalist for a local gossip magazine who snuck into the gala. She's looking for a big scoop. She is bubbly, inquisitive, and not afraid to ask impertinent questions. She might have a photo or a piece of information that she doesn't realize is important, and she's eager to trade what she knows for a byline.",
        outfit:
          "A young, energetic female journalist with a determined look, holding a reporter's notebook and a vintage camera.",
      },
    ],
  }

  // Store the full secret case file
  caseFile.value = mockApiResponse

  // Create a deep, editable copy of the witnesses for the UI and add unique IDs
  witnesses.value = mockApiResponse.witnesses.map((w) => ({
    ...w,
    id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), // Add a unique ID
  }))

  // Update Firebase with the full list of witnesses (without image URLs yet)
  const witnessesRef = dbRef(db, `games/${props.gameId}/witnesses`)
  await set(witnessesRef, witnesses.value)

  isGeneratingStory.value = false
}

/**
 * Generates images for each witness using their description.
 * This would call an image generation AI for each witness.
 * After generation, it updates the witness list in Firebase.
 * @async
 */
async function generateImages() {
  if (!witnesses.value || witnesses.value.length === 0) return

  console.log('generateImages: Setting isGeneratingImages to true')
  isGeneratingImages.value = true
  try {
    // Iterate directly over the reactive witnesses.value array
    for (let i = 0; i < witnesses.value.length; i++) {
      const witness = witnesses.value[i] // Get the reactive witness object
      const prompt = witness.outfit
      console.log(`--- GENERATING IMAGE PROMPT for ${witness.name} ---`)
      console.log(prompt)

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In a real app, the result would be a real URL from Cloud Storage
      const newImageUrl = `https://picsum.photos/seed/${Math.random()}/512` // Placeholder image
      console.log(`Generated image for ${witness.name}: ${newImageUrl}`)

      // Update the imageUrl property of the *local* reactive witness object
      // This will trigger reactivity in StoryReview.vue immediately
      witness.imageUrl = newImageUrl
    }

    // REMOVED: No immediate bulk update to Firebase from generateImages.
    // The witnesses array (with image URLs) will be saved to Firebase when startGame is called.
  } catch (error) {
    console.error('Error generating images:', error)
    // Optionally, display an error message to the user
  } finally {
    console.log('generateImages: Setting isGeneratingImages to false')
    isGeneratingImages.value = false
  }
}

/**
 * Starts the game by updating its status and saving the final story to Firebase.
 * @async
 */
async function startGame() {
  const gameRef = dbRef(db, `games/${props.gameId}`)
  await update(gameRef, {
    status: 'in-progress',
    story: caseFile.value, // Save the complete story, including solution
    witnesses: witnesses.value, // Save the final, potentially edited, witnesses
  })
}

/**
 * Opens the presenter view window.
 */
function openPresenterWindow() {
  window.open(`/presenter/${props.gameId}`, '_blank')
}

/**
 * Allows a player to join the lobby.
 * @param {string} newTeamName - The team name entered by the player.
 * @async
 */
async function joinLobby(newTeamName) {
  if (!newTeamName || !game.value || !currentUser.value) return
  const teamId = currentUser.value.uid
  const teamRef = dbRef(db, `games/${props.gameId}/teams/${teamId}`)
  await set(teamRef, {
    name: newTeamName,
    uid: currentUser.value.uid,
    score: 0,
  })
  isJoined.value = true
}

/**
 * Removes a team from the lobby.
 * @param {string} teamId - The ID of the team to remove.
 * @async
 */
async function removeTeam(teamId) {
  const teamRef = dbRef(db, `games/${props.gameId}/teams/${teamId}`)
  await remove(teamRef)
}

onMounted(() => {
  const authUnsubscribe = onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    if (user) {
      fetchGameData()
    } else {
      console.log('User is not authenticated.')
      isLoading.value = false
    }
  })

  onUnmounted(() => {
    authUnsubscribe()
    if (gameListener) {
      gameListener()
    }
  })
})
</script>
