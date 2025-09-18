<template>
  <v-row v-if="game && game.status === 'lobby'">
    <!-- Left Column: Game Settings -->
    <v-col cols="12" md="6">
      <GameSettingsForm
        :game="game"
        :game-settings="gameSettings"
        :is-generating-story="isGeneratingStory"
        @generate-story="onGenerateStory"
        @open-presenter-window="$emit('open-presenter-window')"
        @remove-team="$emit('remove-team', $event)"
      />
    </v-col>

    <!-- Right Column: Story Preview & Management -->
    <v-col cols="12" md="6" v-if="game.story">
      <StoryPreview
        :game="game"
        @start-game="$emit('start-game')"
      />
    </v-col>
  </v-row>
  <div v-else>
    <h2>Game in progress...</h2>
  </div>
</template>

<script setup>
import GameSettingsForm from './GameSettingsForm.vue';
import StoryPreview from './StoryPreview.vue';
import { /** @type {PropType} */ PropType } from 'vue';
import '@/types.js';

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
});

const emit = defineEmits([
  'generate-story',
  'start-game',
  'open-presenter-window',
  'remove-team',
]);

/**
 * @param {GameSettings} localGameSettings
 */
function onGenerateStory(localGameSettings) {
  emit('generate-story', localGameSettings);
}
</script>
