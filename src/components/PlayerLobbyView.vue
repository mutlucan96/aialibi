<template>
  <v-row class="justify-center text-center">
    <v-col cols="12" md="6">
      <v-card v-if="!isJoined">
        <v-card-title class="text-h5">Join the Game</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleJoinLobby">
            <v-text-field
              v-model="newTeamName"
              label="Team Name"
              required
              :rules="[(v) => !!v || 'Team name is required']"
            ></v-text-field>

            <v-row class="mb-2">
              <v-col
                v-for="color in colorSelection"
                :key="color"
                cols="3"
                class="d-flex justify-center"
              >
                <v-btn
                  icon
                  :color="color"
                  :class="{ 'selected-color': selectedColor === color }"
                  :disabled="takenChoices.takenColors.has(color) && selectedColor !== color"
                  @click="selectColor(color)"
                >
                  <v-icon v-if="selectedColor === color">mdi-check</v-icon>
                </v-btn>
              </v-col>
            </v-row>

            <div v-if="isColorTaken" class="text-caption text-error mb-2">
              That color was just taken by another team. Please pick another color.
            </div>

            <v-text-field
              :model-value="selectedEmoji"
              @update:modelValue="selectEmoji"
              label="Team Emoji"
              :error-messages="emojiErrorMessages"
              class="mb-4"
            ></v-text-field>

            <v-btn
              type="submit"
              color="primary"
              :disabled="
                !newTeamName ||
                !selectedColor ||
                isColorTaken ||
                !selectedEmoji ||
                emojiErrorMessages.length > 0
              "
            >
              Join Lobby
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
      <div v-else>
        <h2 class="mb-4">Welcome, {{ teamName }}! Waiting for the host to start the game...</h2>
        <v-progress-linear indeterminate color="primary"></v-progress-linear>
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed } from 'vue'

/**
 * A regular expression that matches a single, complete Unicode grapheme (including complex emojis).
 */
const singleEmojiRegex = /^.$/u

/**
 * @import {PropType, Ref} from 'vue'
 * @import {Game} from '@/types.js'
 */
const props = defineProps({
  gameId: {
    type: String,
    required: true,
  },
  teamName: {
    type: String,
    required: true,
  },
  isJoined: {
    type: Boolean,
    required: true,
  },
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },

  currentUser: {
    type: /** @type {import('firebase/auth').User | null} */ Object,
    required: false,
  },
})

const emit = defineEmits(['join-lobby'])

/** @type {Ref<string>} */
const newTeamName = ref('')
/** @type {Ref<string>} */
const selectedColor = ref('')
/** @type {Ref<string>} */
const selectedEmoji = ref('')

const colorSelection = [
  '#E53935',
  '#D81B60',
  '#8E24AA',
  '#5E35B1',
  '#3949AB',
  '#1E88E5',
  '#039BE5',
  '#00ACC1',
  '#00897B',
  '#43A047',
  '#7CB342',
  '#C0CA33',
  '#FFEB3B',
  '#FB8C00',
  '#F4511E',
  '#6D4C41',
]

const takenChoices = computed(() => {
  const takenColors = new Set()
  const takenEmojis = new Set()
  if (props.game && props.game.teams) {
    Object.values(props.game.teams).forEach((team) => {
      if (team.color) takenColors.add(team.color)
      if (team.emoji) takenEmojis.add(team.emoji)
    })
  }
  return { takenColors, takenEmojis }
})

const isColorTaken = computed(() => {
  if (!selectedColor.value) return false
  if (props.game && props.game.teams && props.currentUser) {
    for (const teamId in props.game.teams) {
      const team = props.game.teams[teamId]
      if (teamId !== props.currentUser.uid && team.color === selectedColor.value) {
        return true
      }
    }
  }
  return false
})

const emojiErrorMessages = computed(() => {
  if (!selectedEmoji.value) {
    return []
  }

  if (!singleEmojiRegex.test(selectedEmoji.value)) {
    return ['Please enter only one emoji.']
  }

  if (props.game && props.game.teams && props.currentUser) {
    for (const teamId in props.game.teams) {
      const team = props.game.teams[teamId]
      if (teamId !== props.currentUser.uid && team.emoji === selectedEmoji.value) {
        return ['That emoji has already been taken!']
      }
    }
  }

  return []
})

/**
 * Sets the selected color locally for the team.
 * @param {string} color - The hex color code.
 */
function selectColor(color) {
  selectedColor.value = color
}

/**
 * Sets the selected emoji locally for the team.
 * @param {string} emoji - The chosen emoji string.
 */
function selectEmoji(emoji) {
  selectedEmoji.value = emoji
}

/**
 * Handles the lobby join submission by emitting the chosen team details.
 */
async function handleJoinLobby() {
  if (
    newTeamName.value.trim() &&
    selectedColor.value &&
    !isColorTaken.value &&
    selectedEmoji.value &&
    emojiErrorMessages.value.length === 0
  ) {
    emit('join-lobby', {
      name: newTeamName.value.trim(),
      color: selectedColor.value,
      emoji: selectedEmoji.value,
    })
  }
}
</script>

<style scoped>
.v-btn--disabled {
  opacity: 0.2;
}
</style>
