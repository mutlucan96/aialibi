<template>
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
</template>

<script setup>
import { ref } from 'vue'
import { signInAnonymously, getAuth } from 'firebase/auth'

defineProps({
  teamName: {
    type: String,
    required: true,
  },
  isJoined: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['join-lobby'])

const newTeamName = ref('')

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
