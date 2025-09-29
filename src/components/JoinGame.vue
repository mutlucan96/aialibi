<template>
  <v-card class="mb-4">
    <v-card-title>Join an Existing Game</v-card-title>
    <v-card-text>
      <v-text-field
        v-model="gameCode"
        label="Enter Game Code"
        prepend-inner-icon="mdi-key-variant"
        variant="outlined"
        @keydown.enter="joinGame"
      ></v-text-field>
    </v-card-text>
    <v-card-actions>
      <v-btn
        :disabled="!gameCode.trim()"
        color="primary"
        block
        @click="joinGame"
      >
        Join Game
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const gameCode = ref('');
const router = useRouter();

/**
 * @description Navigates to the game view with the entered game code.
 */
const joinGame = () => {
  if (gameCode.value.trim()) {
    router.push({ name: 'game', params: { gameId: gameCode.value.trim() } });
  }
};
</script>
