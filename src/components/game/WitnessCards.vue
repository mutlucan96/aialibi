<template>
  <v-row justify="center" class="mt-4" style="margin: -35px">
    <v-col v-for="witness in witnesses" :key="witness.id" cols="5" sm="5" md="3">
      <v-card
        class="witness-card"
        :disabled="isWitnessDisabled(witness.id)"
        @click="!isWitnessDisabled(witness.id) && $emit('open-chat', witness.id)"
      >
        <v-img :src="witness.imageUrl" aspect-ratio="1"></v-img>
        <v-card-title class="text-body-2 pa-1 text-center">{{ witness.name }}</v-card-title>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
/**
 * @import {Witness} from '@/types.js'
 * @import {PropType} from 'vue'
 */
const props = defineProps({
  /** @type {PropType<Witness[]>} */
  witnesses: {
    type: Array,
    required: true,
  },
  /** @type {PropType<Object>} */
  teams: {
    type: Object,
    required: true,
  },
})

/**
 * Checks if a witness is currently disabled (i.e., busy with another team).
 * @param {string} witnessId - The ID of the witness to check.
 * @returns {boolean} - True if the witness is disabled, false otherwise.
 */
const isWitnessDisabled = (witnessId) => {
  return Object.values(props.teams).some((team) => team.talkingTo === witnessId)
}
</script>

<style scoped>
.witness-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.witness-card:hover:not(.v-card--disabled) {
  transform: translateY(-5px);
}

.v-card--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
