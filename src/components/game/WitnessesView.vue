<template>
  <v-container class="pa-0">
    <WitnessCards
      :witnesses="game.witnesses"
      :teams="game.teams"
      @open-chat="$emit('open-chat', $event)"
    />
    <AccusationButton @open-accusation="$emit('open-accusation')" />
  </v-container>
</template>

<script setup>
import WitnessCards from './WitnessCards.vue'
import AccusationButton from './AccusationButton.vue'

/**
 * @import {Game} from '@/types.js'
 * @import {PropType} from 'vue'
 */
const props = defineProps({
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
