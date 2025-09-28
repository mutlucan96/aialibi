<template>
  <v-row class="justify-center text-center">
    <v-col cols="12">
      <h2>The Case is Closed!</h2>
      <CrimeSolution :case-file="game.story" :show-solution="true" />
      <TeamList :game="game" />
    </v-col>
  </v-row>
</template>

<script setup>
import TeamList from '@/components/TeamList.vue'
import CrimeSolution from '@/components/game/CrimeSolution.vue'

/**
 * @import {PropType} from 'vue'
 * @import {Game, CaseFile} from '@/types.js'
 */
const props = defineProps({
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },
  /** @type {PropType<CaseFile>} */
  caseFile: {
    type: Object,
    required: true,
  },
})
console.log(props.game)
</script>
