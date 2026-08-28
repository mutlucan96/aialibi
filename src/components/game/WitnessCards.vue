<template>
  <v-row justify="center" align="stretch" class="my-2">
    <v-col
      v-for="witness in witnesses"
      :key="witness.id"
      cols="6"
      sm="6"
      md="3"
      class="d-flex"
    >
      <v-card
        class="witness-card d-flex flex-column w-100"
        rounded="lg"
        elevation="2"
        :disabled="isWitnessDisabled(witness.id)"
        @click="!isWitnessDisabled(witness.id) && $emit('open-chat', witness.id)"
        @click.stop="!isWitnessDisabled(witness.id) && $emit('update-talking-to', witness.id)"
      >
        <div class="witness-avatar-wrapper">
          <WitnessAvatar
            :witness="witness"
            size="100%"
            rounded="square"
            style="aspect-ratio: 1;"
          />
        </div>

        <div class="card-body d-flex flex-column flex-grow-1 pa-3 text-center">
          <div class="witness-name text-subtitle-1 font-weight-bold mb-1">
            {{ witness.name }}
          </div>

          <div
            v-if="witness.description"
            class="witness-description text-caption text-medium-emphasis flex-grow-1 mb-2"
          >
            {{ witness.description }}
          </div>

          <div class="status-wrapper mt-auto pt-1">
            <v-chip
              :color="getWitnessStatusColor(witness)"
              size="small"
              variant="tonal"
              class="font-weight-medium"
            >
              <v-icon start size="14">{{ getWitnessStatusIcon(witness) }}</v-icon>
              {{ getWitnessStatus(witness) }}
            </v-chip>
          </div>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import WitnessAvatar from '@/components/common/WitnessAvatar.vue'

/**
 * @import {Witness, Team} from '@/types.js'
 * @import {PropType} from 'vue'
 */
const props = defineProps({
  gameId: {
    type: String,
    default: '',
  },
  /** @type {PropType<Witness[]>} */
  witnesses: {
    type: Array,
    required: true,
  },
  /** @type {PropType<{[key: string]: Team}>} */
  teams: {
    type: Object,
    default: () => ({}),
  },
  timerUp: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['open-chat', 'update-talking-to'])

/**
 * Generates the status text for a witness.
 * @param {Witness} witness - The witness object.
 * @returns {string} - The status text (e.g., "Available" or "Talking to 🕵️ Team Alpha").
 */
const getWitnessStatus = (witness) => {
  if (witness.talkingToTeamId && props.teams?.[witness.talkingToTeamId]) {
    const team = props.teams[witness.talkingToTeamId]
    return `Talking to ${team.emoji || ''} ${team.name}`
  } else if (props.timerUp) {
    return "Time's up!"
  }
  return 'Available'
}

/**
 * Returns the color for the witness status chip.
 * @param {Witness} witness - The witness object.
 * @returns {string} - Vuetify color string.
 */
const getWitnessStatusColor = (witness) => {
  if (props.timerUp) {
    return 'error'
  }
  if (witness.talkingToTeamId) {
    return 'warning'
  }
  return 'success'
}

/**
 * Returns the icon for the witness status chip.
 * @param {Witness} witness - The witness object.
 * @returns {string} - MDI icon name.
 */
const getWitnessStatusIcon = (witness) => {
  if (props.timerUp) {
    return 'mdi-timer-off-outline'
  }
  if (witness.talkingToTeamId) {
    return 'mdi-account-clock-outline'
  }
  return 'mdi-chat-processing-outline'
}

/**
 * Checks if a witness is currently disabled (i.e., busy with another team or time is up).
 * @param {string} witnessId - The ID of the witness to check.
 * @returns {boolean} - True if the witness is disabled, false otherwise.
 */
const isWitnessDisabled = (witnessId) => {
  const witness = props.witnesses.find((w) => w.id === witnessId)
  return (
    props.timerUp ||
    (witness && witness.talkingToTeamId !== null && witness.talkingToTeamId !== undefined)
  )
}
</script>

<style scoped>
.witness-card {
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.witness-avatar-wrapper {
  overflow: hidden;
  line-height: 0;
}

.witness-name {
  line-height: 1.25;
}

.witness-description {
  line-height: 1.35;
  word-break: break-word;
}

:deep(.witness-card:hover:not(.v-card--disabled)) {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

:deep(.v-card--disabled) {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
