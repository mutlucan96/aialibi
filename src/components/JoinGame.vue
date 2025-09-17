<template>
  <v-card class="mb-4">
    <v-card-title>Join an Existing Game</v-card-title>
    <v-card-text>
      <v-text-field
        v-model="gameCode"
        label="Enter Game Code"
        prepend-inner-icon="mdi-key-variant"
        variant="outlined"
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

const gameCode = ref('');

/**
 * @description Logs the entered game code to the console.
 */
const joinGame = () => {
  console.log('Joining game with code:', gameCode.value);
  // Navigation logic will be added later
};
</script>
