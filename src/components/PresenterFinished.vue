<template>
  <v-container>
    <v-row align="center" justify="center">
      <h1 class="text-h2 text-center mb-15">Case Closed!</h1>
    </v-row>
    <v-row>
      <v-col cols="6" class="fill-height">
        <CrimeSolution :case-file="caseFile" :show-solution="true" />
      </v-col>
      <v-col cols="6">
        <TeamList :game="game" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import TeamList from '@/components/TeamList.vue'
import { watch } from 'vue'
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

watch(
  () => props.game?.results,
  (newResults) => {
    console.log('PresenterFinished: props.game.results changed. New results:', newResults)
  },
  { deep: true },
)
</script>
