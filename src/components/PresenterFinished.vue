<template>
  <v-row align="center" justify="center" class="fill-height">
    <v-col cols="12" class="text-center">
      <h1 class="text-h2">Game Finished</h1>
      <p class="text-h5 mt-4">Here are the final results!</p>
    </v-col>
    <TeamList :game="game" />
  </v-row>
</template>

<script setup>
import TeamList from '@/components/TeamList.vue'
import { watch } from 'vue'

/**
 * @typedef {import('@/types.js').Game} Game
 */
const props = defineProps({
  /** @type {Game} */
  game: {
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
