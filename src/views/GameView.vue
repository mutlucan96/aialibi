<template>
  <v-container fluid>
    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex justify-center align-center" style="height: 80vh;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <!-- Main Content -->
    <div v-else>
      <CreatorView
        v-if="isCreator"
        :game="game"
        :game-settings="gameSettings"
        :is-generating-story="isGeneratingStory"
        @generate-story="generateStory"
        @start-game="startGame"
        @open-presenter-window="openPresenterWindow"
        @remove-team="removeTeam"
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
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { db, auth } from '@/firebase';
import { ref as dbRef, onValue, update, set, remove } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import CreatorView from '@/components/CreatorView.vue';
import PlayerView from '@/components/PlayerView.vue';
import '@/types.js';

// Props
const props = defineProps({
  gameId: {
    type: String,
    required: true,
  },
});

// State
/** @type {import('vue').Ref<Game | null>} */
const game = ref(null);
const currentUser = ref(null);
const isLoading = ref(true);
const isGeneratingStory = ref(false);
const teamName = ref('');
const isJoined = ref(false);

const isCreator = computed(() => {
  if (!game.value || !currentUser.value) return false;
  const creatorId = String(game.value.creatorId || '').trim();
  const userId = String(currentUser.value.uid || '').trim();
  return creatorId === userId && creatorId !== '';
});

/** @type {GameSettings} */
const gameSettings = reactive({
  mode: 'classic',
  languageLevel: 'B1',
  targetVocabulary: '',
  theme: '',
  targetAge: null,
  timeLimit: 15,
});

let gameListener = null;

/**
 * Fetches and listens to game data from Firebase.
 */
function fetchGameData() {
  const gameRef = dbRef(db, `games/${props.gameId}`);
  gameListener = onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      game.value = data;
      if (data.settings) {
        Object.assign(gameSettings, data.settings);
      }
      if (currentUser.value && data.teams) {
        const userTeam = Object.values(data.teams).find(team => team.uid === currentUser.value.uid);
        if (userTeam) {
          isJoined.value = true;
          teamName.value = userTeam.name;
        }
      }
    } else {
      game.value = null;
    }
    isLoading.value = false;
  });
}

/**
 * Generates the story based on the settings and updates Firebase.
 * @param {GameSettings} newSettings - The game settings from the form.
 * @async
 */
async function generateStory(newSettings) {
  isGeneratingStory.value = true;
  const story = {
    crimeDescription: `A famous painting, 'The Starry Night', has been stolen...`,
    witnesses: [/*...*/],
  };
  const gameRef = dbRef(db, `games/${props.gameId}`);
  await update(gameRef, {
    story: story,
    settings: { ...newSettings }
  });
  isGeneratingStory.value = false;
}

/**
 * Starts the game by updating its status in Firebase.
 * @async
 */
async function startGame() {
  const gameRef = dbRef(db, `games/${props.gameId}`);
  await update(gameRef, { status: 'in-progress' });
}

/**
 * Opens the presenter view window.
 */
function openPresenterWindow() {
  window.open(`/presenter/${props.gameId}`, '_blank');
}

/**
 * Allows a player to join the lobby.
 * @param {string} newTeamName - The team name entered by the player.
 * @async
 */
async function joinLobby(newTeamName) {
  if (!newTeamName || !game.value || !currentUser.value) return;
  const teamId = currentUser.value.uid;
  const teamRef = dbRef(db, `games/${props.gameId}/teams/${teamId}`);
  await set(teamRef, {
    name: newTeamName,
    uid: currentUser.value.uid,
    score: 0
  });
  isJoined.value = true;
}

/**
 * Removes a team from the lobby.
 * @param {string} teamId - The ID of the team to remove.
 * @async
 */
async function removeTeam(teamId) {
    const teamRef = dbRef(db, `games/${props.gameId}/teams/${teamId}`);
    await remove(teamRef);
}

onMounted(() => {
  const authUnsubscribe = onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
    if (user) {
      fetchGameData();
    } else {
      console.log("User is not authenticated.");
      isLoading.value = false;
    }
  });

  onUnmounted(() => {
    authUnsubscribe();
    if (gameListener) {
      gameListener();
    }
  });
});

</script>
