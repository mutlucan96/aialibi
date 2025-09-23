<template>
  <v-container fluid>
    <!-- Lobby View for Player -->
    <div v-if="game.status === 'lobby'">
      <v-row class="justify-center text-center">
        <v-col cols="12" md="6">
          <v-card v-if="!isJoined" class="pa-4">
            <v-card-title class="text-h5">Join the Game</v-card-title>
            <v-card-text>
              <v-form @submit.prevent="handleJoinLobby">
                <v-text-field
                  v-model="newTeamName"
                  label="Enter Your Team Name"
                  required
                  :rules="[(v) => !!v || 'Team name is required']"
                ></v-text-field>
                <v-btn type="submit" color="primary" :disabled="!newTeamName"> Join Lobby </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
          <div v-else>
            <h2 class="mb-4">Welcome, {{ teamName }}! Waiting for the host to start the game...</h2>
            <v-progress-linear indeterminate color="primary"></v-progress-linear>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- In-Progress View for Player -->
    <div v-else-if="game.status === 'in-progress'">
      <v-row class="justify-center text-center">
        <v-col cols="12">
          <h2>The Investigation is Underway!</h2>
          <div><!-- Placeholder for in-progress game interface --></div>
        </v-col>
      </v-row>
    </div>

    <!-- Finished View for Player -->
    <div v-else-if="game.status === 'finished'">
      <v-row class="justify-center text-center">
        <v-col cols="12">
          <h2>The Case is Closed!</h2>
          <div><!-- Placeholder for leaderboard --></div>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { signInAnonymously, getAuth } from 'firebase/auth'

/**
 * Props for the PlayerView component.
 * @property {object} game - The reactive game object from Firebase.
 * @property {string} teamName - The current player's team name.
 * @property {boolean} isJoined - A boolean indicating if the player has successfully joined the lobby.
 */
const props = defineProps({
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

/**
 * Local ref for the new team name input field.
 * @type {import('vue').Ref<string>}
 */
const newTeamName = ref('')

/**
 * Handles the join lobby action.
 * Validates the newTeamName, signs in anonymously if no user exists,
 * and then emits the 'join-lobby' event.
 * @returns {Promise<void>}
 */
async function handleJoinLobby() {
  if (newTeamName.value.trim()) {
    const auth = getAuth()
    if (!auth.currentUser) {
      await signInAnonymously(auth)
    }
    emit('join-lobby', newTeamName.value.trim())
  }
}
</script>
