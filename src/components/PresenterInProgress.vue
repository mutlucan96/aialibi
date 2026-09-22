<template>
  <v-container fluid class="px-2 px-md-4 py-2">
    <v-row class="justify-center mb-2 timer-row">
      <Timer
        v-if="game.settings?.mode === 'race'"
        :startTime="game.startTime || 0"
        :duration="game.duration || game.settings?.timeLimit || 0"
      />
    </v-row>
    <v-row>
      <v-col cols="12" md="8" lg="9" class="pa-2 pa-md-4">
        <div class="crime-section mb-4">
          <CrimeDescription :crime="game.story.crime" />
        </div>
        <div class="witnesses-section">
          <WitnessesView :game="game" />
        </div>
      </v-col>
      <v-col cols="12" md="4" lg="3" class="pa-2 pa-md-4">
        <TeamList :game="game" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import Timer from './game/TimerView.vue'
import CrimeDescription from './game/CrimeDescription.vue'
import WitnessesView from './game/WitnessesView.vue'
import TeamList from './TeamList.vue'

/**
 * PresenterInProgress component displays the game in progress for the presenter.
 * It assembles Timer, CrimeDescription, WitnessesView, and TeamList components.
 * @import {PropType} from 'vue'
 * @import {Game} from '@/types.js'
 */
const props = defineProps({
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },
})

console.log(props.game)
</script>

<style scoped>
.timer-row :deep(.v-chip) {
  font-size: 1.35rem !important;
  padding: 8px 18px !important;
  height: auto !important;
}

.timer-row :deep(.v-icon) {
  font-size: 1.35rem !important;
}

.crime-section :deep(.v-card-title) {
  font-size: 1.5rem !important;
  font-weight: 700 !important;
}

.crime-section :deep(.v-card-text) {
  font-size: 1.25rem !important;
  line-height: 1.6 !important;
}

.witnesses-section :deep(.witness-card) {
  cursor: default;
}

.witnesses-section :deep(.witness-name) {
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
}

.witnesses-section :deep(.witness-description) {
  font-size: 1.05rem !important;
  line-height: 1.45 !important;
}

.witnesses-section :deep(.status-wrapper .v-chip) {
  font-size: 0.95rem !important;
}

.witnesses-section :deep(.status-wrapper .v-icon) {
  font-size: 1rem !important;
}
</style>
