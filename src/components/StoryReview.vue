<template>
  <!-- Crime Description -->
  <v-card class="mb-2">
    <v-card-title>The Crime</v-card-title>
    <v-card-text>{{ caseFile.crime }}</v-card-text>
    <v-card-actions v-if="gameSettings.mode === 'race'">
      <v-btn variant="text" size="small" @click="$emit('update:showSolution', !showSolution)">
        {{ showSolution ? 'Hide solution' : 'Show solution...' }}
      </v-btn>
    </v-card-actions>
  </v-card>

  <!-- Solution Display (Race Mode Only) -->
  <v-expand-transition>
    <div v-if="showSolution && gameSettings.mode === 'race'">
      <v-card class="mb-2" color="red-lighten-5">
        <v-card-title>Top Secret: The Solution</v-card-title>
        <v-card-text>
          <p><strong>Culprit:</strong> {{ caseFile.culprit }}</p>
          <p><strong>Motive:</strong> {{ caseFile.motive }}</p>
        </v-card-text>
      </v-card>
    </div>
  </v-expand-transition>

  <!-- Witness List -->
  <v-row class="pa-1" align="stretch">
    <v-col v-for="(witness, index) in localWitnesses" :key="index" cols="12" md="6" class="pa-1 d-flex">
      <v-card class="w-100 pa-2 d-flex align-center" rounded="lg" elevation="1">
        <WitnessAvatar :witness="witness" :size="80" rounded="lg" />
        <div class="pl-4 flex-grow-1">
          <div class="text-subtitle-1 font-weight-bold">{{ witness.name }}</div>
          <div v-if="witness.description" class="text-body-2 text-medium-emphasis mt-1">
            {{ witness.description }}
          </div>
        </div>
      </v-card>
    </v-col>
  </v-row>
  <!-- Control Buttons -->
  <v-alert class="mt-2 text-body-2" icon="mdi-alert-outline" variant="elevated" rounded="lg" dense>
    AI can make mistakes. Please review the generated story before starting the game.<span
      v-if="gameSettings.mode === 'race'"
    >
      As the moderator, you can view live team conversations. Especially when working with minors,
      please keep an eye on what is being discussed.</span
    >
  </v-alert>
  <v-card absolute class="d-flex flex-wrap justify-center pa-2 mt-2" rounded="lg">
    <v-btn
      v-if="!imagesGenerated"
      @click="$emit('generate-images')"
      :disabled="isGeneratingImages"
      :loading="isGeneratingImages"
      size="large"
      color="secondary"
      class="mr-2"
    >
      Generate Images
    </v-btn>
    <v-btn @click="$emit('start-game')" color="primary" size="large"> Start Game </v-btn>
  </v-card>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import WitnessAvatar from '@/components/common/WitnessAvatar.vue'

/**
 * @import {PropType} from 'vue'
 * @import {Witness, GameSettings, CaseFile} from '@/types.js'
 */
const props = defineProps({
  /** @type {PropType<CaseFile>} */
  caseFile: {
    type: Object,
    required: true,
  },
  /** @type {PropType<Witness[]>} */
  witnesses: {
    type: Array,
    required: true,
  },
  /** @type {PropType<GameSettings>} */
  gameSettings: {
    type: Object,
    required: true,
  },
  isGeneratingImages: {
    type: Boolean,
    required: false,
    default: false,
  },
  showSolution: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits([
  'generate-story',
  'generate-images',
  'start-game',
  'update:witnesses',
  'update:showSolution',
])

// Create a local, deep copy of witnesses to allow editing
const localWitnesses = ref(JSON.parse(JSON.stringify(props.witnesses)))

// Flag to prevent recursive updates
let updatingFromProp = false

// Watch for changes in the local copy and emit them upwards
watch(
  localWitnesses,
  (newValue) => {
    if (!updatingFromProp) {
      emit('update:witnesses', newValue)
    }
  },
  { deep: true },
)

// Watch for external changes to the witnesses prop (e.g., after story generation)
watch(
  () => props.witnesses,
  (newWitnesses) => {
    // Only update localWitnesses if the incoming prop is different from the current local state
    // This prevents recursive updates when the parent updates the prop based on our own emit.
    if (JSON.stringify(newWitnesses) !== JSON.stringify(localWitnesses.value)) {
      updatingFromProp = true // Set flag to prevent emitting back immediately
      localWitnesses.value = JSON.parse(JSON.stringify(newWitnesses))
      // Reset flag in the next tick to allow subsequent local edits to emit
      nextTick(() => {
        updatingFromProp = false
      })
    }
  },
  { deep: true },
)

const imagesGenerated = computed(() => {
  return props.witnesses.every((w) => w.imageUrl)
})
</script>
