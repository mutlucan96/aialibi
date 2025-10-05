<template>
  <div class="classic-mode-view">
    <div v-if="game.status === 'in-progress'">
      <PlayerInProgressView :game="game" :game-id="gameId" />
      <v-btn color="warning" @click="showGiveUpDialog = true">Give Up</v-btn>

      <v-dialog v-model="showGiveUpDialog" max-width="500">
        <v-card>
          <v-card-title class="headline">Confirm Give Up</v-card-title>
          <v-card-text>Are you sure you want to give up and see the solution?</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="showGiveUpDialog = false">Cancel</v-btn>
            <v-btn color="warning" @click="confirmGiveUp">Give Up</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <div v-else-if="game.status === 'finished'">
      <h2>The Case is Closed!</h2>
      <p><strong>Culprit:</strong> {{ game.story.culprit }}</p>
      <p><strong>Motive:</strong> {{ game.story.motive }}</p>

      <v-btn color="error" @click="showDeleteGameDialog = true">Delete Game</v-btn>

      <v-dialog v-model="showDeleteGameDialog" max-width="500">
        <v-card>
          <v-card-title class="headline">Confirm Delete Game</v-card-title>
          <v-card-text>Are you sure you want to permanently delete this game session?</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="showDeleteGameDialog = false">Cancel</v-btn>
            <v-btn color="error" @click="confirmDeleteGame">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CrimeDescription from '@/components/game/CrimeDescription.vue'
import WitnessesView from '@/components/game/WitnessesView.vue'
import PlayerInProgressView from '@/components/PlayerInProgressView.vue'

/**
 * @import {PropType} from 'vue'
 * @import {Game} from '@/types.js'
 */
const props = defineProps({
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },
  gameId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['give-up', 'delete-game'])

const showGiveUpDialog = ref(false)
const showDeleteGameDialog = ref(false)

const confirmGiveUp = () => {
  showGiveUpDialog.value = false
  emit('give-up')
}

const confirmDeleteGame = () => {
  showDeleteGameDialog.value = false
  emit('delete-game')
}
</script>

<style scoped>
.classic-mode-view {
  padding: 20px;
}
</style>
