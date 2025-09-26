<template>
  <v-container class="pa-0">
    <WitnessCards
      :game-id="gameId"
      :witnesses="game.witnesses"
      :teams="game.teams"
      @open-chat="$emit('open-chat', $event)"
      @update-talking-to="$emit('update-talking-to', $event)"
    />
  </v-container>
</template>

<script setup>
import WitnessCards from './WitnessCards.vue'

/**
 * @import {Game} from '@/types.js'
 * @import {PropType} from 'vue'
 */
const props = defineProps({
  gameId: {
    type: String,
    required: true,
  },
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },

  mode: {
    type: String,
    required: true,
  },
})
</script>

<style scoped></style>
