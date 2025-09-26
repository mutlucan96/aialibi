<template>
  <v-container>
    <v-row class="font-size-1-5x justify-center">
      <Timer
        v-if="game.settings.mode === 'race'"
        :startTime="game.startTime"
        :duration="game.settings.duration"
      />
    </v-row>
    <v-row>
      <v-col cols="8" class="pa-10">
        <v-row class="mb-4">
          <v-col cols="12" class="font-size-1-5x">
            <CrimeDescription :crime="game.story.crime" />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" class="font-size-1-5x">
            <WitnessesView :game="game" />
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="4" style="padding-top: 36px">
        <TeamList :game="game" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { defineProps } from 'vue'
import Timer from './game/TimerView.vue'
import CrimeDescription from './game/CrimeDescription.vue'
import WitnessesView from './game/WitnessesView.vue'
import TeamList from './TeamList.vue'

/**
 * PresenterInProgress component displays the game in progress for the presenter.
 * It assembles Timer, CrimeDescription, WitnessesView, and TeamList components.
 * @property {object} game - The game object containing all necessary data.
 */
const props = defineProps({
  game: {
    type: Object,
    required: true,
  },
})

console.log(props.game)
</script>

<style scoped>
.font-size-1-5x :deep(*) {
  font-size: 1.3rem !important;
}
</style>
