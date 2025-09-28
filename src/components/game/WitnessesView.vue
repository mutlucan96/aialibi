<template>
  <v-container class="pa-0">
    <WitnessCards
      :game-id="gameId"
      :witnesses="game.witnesses"
      :teams="game.teams"
      @open-chat="$emit('open-chat', $event)"
      @update-talking-to="$emit('update-talking-to', $event)"
      :is-accusation-disabled="isAccusationDisabled"
      :accusation-cooldown-text="accusationCooldownText"
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
  },
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },

  mode: {
    type: String,
  },
  isAccusationDisabled: {
    type: Boolean,
  },
  accusationCooldownText: {
    type: String,
    default: '',
  },
})

defineEmits(['open-chat', 'open-accusation', 'update-talking-to'])
</script>

<style scoped></style>
