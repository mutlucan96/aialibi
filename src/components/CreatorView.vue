<template>
  <v-container v-if="game && game.status === 'lobby'">
    <v-row>
      <!-- Left Column: Game Settings Form (Always Visible) -->
      <v-col cols="12" md="6">
        <GameSettingsForm
          :game="game"
          :game-settings="gameSettings"
          :is-generating-story="isGeneratingStory"
          :has-story-generated="!!caseFile"
          :story-limit="storyLimit"
          :remaining-stories="remainingStories"
          :can-generate-story="canGenerateStory"
          @generate-story="onGenerateStory"
          @open-presenter-window="$emit('open-presenter-window')"
          :loading-status-message="loadingStatusMessage"
          @remove-team="$emit('remove-team', $event)"
        />
      </v-col>

      <!-- Right Column: Story Preview & Management (Visible when caseFile is not null) -->
      <v-col cols="12" md="6" v-if="caseFile">
        <StoryReview
          :case-file="caseFile"
          :game="game"
          :witnesses="witnesses"
          :game-settings="gameSettings"
          :is-generating-images="isGeneratingImages"
          :show-solution="showSolution"
          :image-limit="imageLimit"
          :remaining-images="remainingImages"
          :can-generate-images="canGenerateImages"
          @generate-story="onGenerateStory"
          @generate-images="$emit('generate-images')"
          @start-game="$emit('start-game')"
          @update:witnesses="$emit('update:witnesses', $event)"
          @update:show-solution="$emit('update:showSolution', $event)"
        />
      </v-col>
    </v-row>
  </v-container>

  <!-- Game In Progress View -->
  <CreatorInProgress
    v-else-if="game && game.status === 'in-progress' && game.settings.mode === 'race'"
    :game="game"
    :game-id="gameId"
    :teams="game.teams"
    :witnesses="witnesses"
    :case-file="caseFile"
    :game-settings="gameSettings"
    @finish-game="$emit('finish-game')"
  />
  <ClassicModeView
    v-else-if="game && game.status === 'in-progress' && game.settings.mode === 'classic'"
    :game="game"
    :game-id="gameId"
    :currentUser="currentUser"
    @give-up="$emit('finish-game')"
    @delete-game="$emit('delete-game')"
  />
  <!-- Game Finished View -->
  <v-container v-else-if="game && game.status === 'finished' && game.settings.mode === 'race'">
    <v-card max-width="600" class="mx-auto text-center">
      <v-card-title>Game Finished</v-card-title>
      <v-btn color="error" @click="$emit('remove-game')">Remove Game</v-btn>
      <TeamList :game="game" />
    </v-card>
  </v-container>
  <ClassicModeView
    v-else-if="game && game.status === 'finished' && game.settings.mode === 'classic'"
    :game="game"
    :game-id="gameId"
    :currentUser="currentUser"
    @give-up="$emit('finish-game')"
    @delete-game="$emit('delete-game')"
  />
</template>

<script setup>
import GameSettingsForm from './GameSettingsForm.vue'
import StoryReview from './StoryReview.vue'
import CreatorInProgress from './CreatorInProgress.vue'
import ClassicModeView from './ClassicModeView.vue'
import TeamList from './TeamList.vue'

/**
 * @import {PropType} from 'vue'
 * @import {Game, GameSettings, CaseFile, Witness} from '@/types.js'
 */

defineProps({
  game: {
    type: /** @type {PropType<Game>} */ (Object),
    required: true,
  },
  /** @type {PropType<string>} */
  gameId: {
    type: String,
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
    type: /** @type {PropType<CaseFile>} */ (Object),
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
  loadingStatusMessage: {
    type: String,
    required: true,
  },
  currentUser: {
    type: /** @type {PropType<any>} */ (Object),
    default: null,
  },
  storyLimit: {
    type: Number,
    default: 0,
  },
  remainingStories: {
    type: Number,
    default: 0,
  },
  canGenerateStory: {
    type: Boolean,
    default: true,
  },
  imageLimit: {
    type: Number,
    default: 0,
  },
  remainingImages: {
    type: Number,
    default: 0,
  },
  canGenerateImages: {
    type: Boolean,
    default: true,
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
  'finish-game',
  'delete-game',
  'remove-game',
  'open-presenter-window',
])

/**
 * Relays the generate-story event upwards.
 * @param {GameSettings} localGameSettings - The updated settings.
 */
function onGenerateStory(localGameSettings) {
  emit('generate-story', localGameSettings)
}
</script>
