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

            <v-row class="mb-4">
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
                !newTeamName || !selectedColor || !selectedEmoji || emojiErrorMessages.length > 0
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
import { ref, computed, watch } from 'vue'
import { db } from '@/firebase'
import { ref as dbRef, update } from 'firebase/database'

/**
 * A regular expression that matches a single, complete Unicode grapheme (including complex emojis).
 */
const singleEmojiRegex = /^.$/u

/**
 * @import {PropType, Ref} from 'vue'
 * @import {Game} from '@/types.js'
 * @typedef {import('vue').Ref<string[]>} RefStringArray
 * */
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
/** @type {RefStringArray} */
const emojiErrorMessages = ref(/** @type {string[]} */ ([]))

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
      // Check for both finalized and temporarily selected choices
      takenColors.add(team.color || team.selectedColor)
      takenEmojis.add(team.emoji || team.selectedEmoji)
    })
  }
  return { takenColors, takenEmojis }
})

watch(selectedEmoji, (newEmoji) => {
  emojiErrorMessages.value = []

  if (!newEmoji) {
    return // Do nothing if input is empty
  }

  if (!singleEmojiRegex.test(newEmoji)) {
    emojiErrorMessages.value = ['Please enter only one emoji.']
    return
  }

  // Check if the emoji is taken by any other team
  let isTakenByOtherTeam = false
  if (props.game && props.game.teams && props.currentUser) {
    for (const teamId in props.game.teams) {
      const team = props.game.teams[teamId]
      // If it's not the current user's team AND the emoji is taken by this team
      if (
        teamId !== props.currentUser.uid &&
        (team.emoji === newEmoji || team.selectedEmoji === newEmoji)
      ) {
        isTakenByOtherTeam = true
        break
      }
    }
  }

  if (isTakenByOtherTeam) {
    emojiErrorMessages.value = ['That emoji has already been taken!']
  }
})

async function selectColor(color) {
  if (!props.currentUser || !props.gameId) return
  selectedColor.value = color
  try {
    await update(dbRef(db, `games/${props.gameId}/teams/${props.currentUser.uid}`), {
      selectedColor: color,
    })
  } catch (e) {
    console.error(e)
  }
}

async function selectEmoji(emoji) {
  if (!props.currentUser || !props.gameId) return
  selectedEmoji.value = emoji
  try {
    await update(dbRef(db, `games/${props.gameId}/teams/${props.currentUser.uid}`), {
      selectedEmoji: emoji,
    })
  } catch (e) {
    console.error(e)
  }
}

async function handleJoinLobby() {
  if (newTeamName.value.trim() && emojiErrorMessages.value.length === 0) {
    emit('join-lobby', newTeamName.value.trim())
  }
}
</script>

<style scoped>
.v-btn--disabled {
  opacity: 0.2;
}
</style>
