<template>
  <div v-if="game && game.status === 'lobby'">
    <v-row>
      <!-- Left Column: Game Settings Form (Always Visible) -->
      <v-col cols="12" md="6">
        <GameSettingsForm
          :game="game"
          :game-settings="gameSettings"
          :is-generating-story="isGeneratingStory"
          :has-story-generated="!!caseFile"
          @generate-story="onGenerateStory"
          @open-presenter-window="$emit('open-presenter-window')"
          @remove-team="$emit('remove-team', $event)"
        />
      </v-col>

      <!-- Right Column: Story Preview & Management (Visible when caseFile is not null) -->
      <v-col cols="12" md="6" v-if="caseFile">
        <StoryReview
          :case-file="caseFile"
          :witnesses="witnesses"
          :game-settings="gameSettings"
          :is-generating-images="isGeneratingImages"
          :show-solution="showSolution"
          @generate-story="onGenerateStory"
          @generate-images="$emit('generate-images')"
          @start-game="$emit('start-game')"
          @update:witnesses="$emit('update:witnesses', $event)"
          @update:show-solution="$emit('update:showSolution', $event)"
        />
      </v-col>
    </v-row>
  </div>

  <!-- Game In Progress View -->
  <div v-else class="text-center pa-4">
    <h2>Game in progress...</h2>
    <p>The game has started. You can monitor the progress from the Presenter View.</p>
    <v-btn @click="$emit('open-presenter-window')" color="primary" class="mt-4"
      >Open Presenter View</v-btn
    >
  </div>
</template>

<script setup>
import GameSettingsForm from './GameSettingsForm.vue'
import StoryReview from './StoryReview.vue'

/**
 * @import {PropType} from 'vue'
 * @import {Game, GameSettings, Story, Witness} from '@/types.js'
 */

defineProps({
  game: {
    type: /** @type {PropType<Game>} */ (Object),
    required: true,
  },
  gameSettings: {
    type: /** @type {PropType<GameSettings>} */ (Object),
    required: true,
  },
  isGeneratingStory: {
    type: Boolean,
    required: true,
  },
  caseFile: {
    type: /** @type {PropType<Story>} */ (Object),
    default: null,
  },
  witnesses: {
    type: /** @type {PropType<Witness[]>} */ (Array),
    required: true,
  },
  isGeneratingImages: {
    type: Boolean,
    required: true,
  },
  showSolution: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'generate-story',
  'generate-images',
  'start-game',
  'open-presenter-window',
  'remove-team',
  'update:witnesses',
  'update:showSolution',
])

/**
 * Relays the generate-story event upwards.
 * @param {GameSettings} localGameSettings
 */
function onGenerateStory(localGameSettings) {
  emit('generate-story', localGameSettings)
}
</script>
