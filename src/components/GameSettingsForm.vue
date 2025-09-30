<template>
  <v-card class="pa-4">
    <v-form @submit.prevent="onGenerateStory">
      <label class="v-label">Game Mode</label>
      <v-radio-group v-model="localGameSettings.mode">
        <v-radio value="classic">
          <template v-slot:label>
            <div>
              <strong class="v-label">Classic</strong>
              <div class="text-caption">
                Solve a crime yourself or as a one team. Ideal for a single screen or guided play.
              </div>
            </div>
          </template>
        </v-radio>
        <v-radio value="race">
          <template v-slot:label>
            <div>
              <strong class="v-label">Race</strong>
              <div class="text-caption">
                Multiple teams compete in real-time to be the first to solve the crime. Requires a
                device for each team.
              </div>
            </div>
          </template>
        </v-radio>
      </v-radio-group>

      <!-- Race Mode Specific Controls -->
      <div v-if="localGameSettings.mode === 'race'" class="mb-4">
        <v-card outlined>
          <v-card-title>Race Mode</v-card-title>
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ game.joinCode }}</div>
            <v-btn @click="$emit('open-presenter-window')" class="mr-2">Open Presenter View</v-btn>
            <v-dialog v-model="teamManagementDialog" max-width="500px">
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props">Manage Teams</v-btn>
              </template>
              <v-card>
                <v-card-title>Joined Teams</v-card-title>
                <v-list>
                  <v-list-item
                    v-for="(team, teamId) in game.teams"
                    :key="teamId"
                    :title="team.name"
                  >
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-close"
                        size="small"
                        variant="text"
                        @click="$emit('remove-team', teamId)"
                      ></v-btn>
                    </template>
                  </v-list-item>
                </v-list>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn text @click="teamManagementDialog = false">Close</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-card-text>
        </v-card>
      </div>

      <v-radio-group v-model="localGameSettings.languageLevel" label="Language Level" inline>
        <v-radio label="A2" value="A2"></v-radio>
        <v-radio label="B1" value="B1"></v-radio>
        <v-radio label="B2" value="B2"></v-radio>
        <v-radio label="C1" value="C1"></v-radio>
        <v-radio label="C2" value="C2"></v-radio>
      </v-radio-group>

      <v-text-field
        v-model.number="localGameSettings.targetAge"
        label="Target Age (optional)"
        type="number"
      ></v-text-field>

      <v-text-field
        v-if="localGameSettings.mode === 'race'"
        v-model.number="localGameSettings.timeLimit"
        label="Time Limit (minutes)"
        type="number"
      ></v-text-field>

      <v-text-field
        v-model="localGameSettings.targetVocabulary"
        label="Target Vocabulary (optional)"
        hint="Comma-separated words"
      ></v-text-field>

      <v-textarea
        v-model="localGameSettings.theme"
        label="Theme / Additional Info (optional)"
      ></v-textarea>

      <v-btn ref="submitButton" type="submit" :loading="isGeneratingStory" color="primary">
        {{ hasStoryGenerated ? 'Regenerate Story' : 'Generate Story' }}
      </v-btn>
    </v-form>
  </v-card>
</template>

<script setup>
import { reactive, watch, ref } from 'vue'

/**
 * @import {PropType, Reactive, Ref} from 'vue'
 * @import {Game, GameSettings} from '@/types.js'
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
  isGeneratingStory: {
    type: Boolean,
    required: true,
  },
  hasStoryGenerated: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['generate-story', 'open-presenter-window', 'remove-team'])

/** @type { Reactive<GameSettings>} */
const localGameSettings = reactive({ ...props.gameSettings })
/** @type {Ref<boolean>} */
const teamManagementDialog = ref(false)
/** @type {Ref<HTMLElement | null>} */
const submitButton = ref(null)

watch(
  () => props.gameSettings,
  (newSettings) => {
    Object.assign(localGameSettings, newSettings)
  },
)

watch(
  () => props.hasStoryGenerated,
  (isGenerated) => {
    if (isGenerated) {
      setTimeout(() => {
        if (submitButton.value && submitButton.value.$el) {
          submitButton.value.$el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 400)
    }
  },
)

function onGenerateStory() {
  emit('generate-story', localGameSettings)
}
</script>
