<template>
  <v-container>
    <v-row align="center" class="ml-0">
      <v-btn color="error" @click="isConfirmDialogOpen = true"> Finish Game </v-btn>
      <Timer :start-time="game.startTime" :duration="game.duration" />
    </v-row>
    <v-row>
      <!-- Left Column -->
      <v-col cols="12" md="6">
        <CrimeDescription :crime="game.story.crime" />
        <CrimeSolution :case-file="caseFile" />
      </v-col>

      <!-- Right Column -->
      <v-col cols="12" md="6">
        <TeamList :game="game" />
      </v-col>
    </v-row>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="isConfirmDialogOpen" max-width="500">
      <v-card>
        <v-card-title>Finish Game</v-card-title>
        <v-card-text>
          Are you sure you want to end the game for all players? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="isConfirmDialogOpen = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmFinishGame">Finish</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import CrimeDescription from './game/CrimeDescription.vue'
import CrimeSolution from './game/CrimeSolution.vue'
import Timer from './game/TimerView.vue'
import TeamList from './TeamList.vue'

/**
 * @import {PropType} from 'vue'
 * @import {Game, GameSettings, CaseFile, Witness} from '@/types.js'
 */
const props = defineProps({
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },
  /** @type {PropType<GameSettings>} */
  gameSettings: {
    type: Object,
    required: true,
  },
  /** @type {PropType<CaseFile>} */
  caseFile: {
    type: Object,
    default: null,
  },
  /** @type {PropType<Witness[]>} */
  witnesses: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['finish-game'])

const isConfirmDialogOpen = ref(false)
console.log(props.game)
const confirmFinishGame = () => {
  emit('finish-game')
  isConfirmDialogOpen.value = false
}
</script>

<style scoped></style>
