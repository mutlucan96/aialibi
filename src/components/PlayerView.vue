<template>
  <div v-if="game">
    <!-- Lobby View for Player -->
    <div v-if="game.status === 'lobby'">
      <v-row class="justify-center text-center">
        <v-col cols="12" md="6">
          <h1 class="mb-4">Waiting for the host to start...</h1>
          <v-form @submit.prevent="onJoinLobby">
            <v-text-field
              v-model="localTeamName"
              label="Enter Your Team Name"
              :disabled="isJoined"
            ></v-text-field>
            <v-btn type="submit" color="primary" :disabled="isJoined || !localTeamName">
              {{ isJoined ? 'Joined!' : 'Join Lobby' }}
            </v-btn>
          </v-form>
        </v-col>
      </v-row>
    </div>

    <!-- In-Progress View for Player -->
    <div v-else-if="game.status === 'in-progress'">
      <h2>Game is in progress!</h2>
    </div>

    <!-- Finished View for Player -->
    <div v-else-if="game.status === 'finished'">
      <h2>Game Over!</h2>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { /** @type {PropType} */ PropType } from 'vue';
import '@/types.js';

const props = defineProps({
  game: {
    type: /** @type {PropType<Game>} */ (Object),
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
});

const emit = defineEmits(['join-lobby']);

const localTeamName = ref(props.teamName);

watch(() => props.teamName, (newName) => {
  localTeamName.value = newName;
});

function onJoinLobby() {
  emit('join-lobby', localTeamName.value);
}
</script>
