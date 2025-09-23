<template>
  <v-container>
    <!-- Crime Description -->
    <v-card class="mb-6">
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
        <v-card class="mb-6" color="red-lighten-5">
          <v-card-title>Top Secret: The Solution</v-card-title>
          <v-card-text>
            <p><strong>Culprit:</strong> {{ caseFile.culprit }}</p>
            <p><strong>Motive:</strong> {{ caseFile.motive }}</p>
          </v-card-text>
        </v-card>
      </div>
    </v-expand-transition>

    <!-- Witness List -->
    <v-row>
      <v-col v-for="(witness, index) in localWitnesses" :key="index" cols="12" md="6">
        <v-card>
          <div class="d-flex align-center pa-4">
            <v-avatar
              v-if="witness.imageUrl"
              :image="witness.imageUrl"
              size="96"
              class="mr-4"
            ></v-avatar>
            <v-avatar v-else size="96" class="mr-4" color="grey-lighten-1">
              <span class="text-h3">{{ witness.name.charAt(0) }}</span>
            </v-avatar>
            <v-card-title class="pl-0">{{ witness.name }}</v-card-title>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <!-- Control Buttons -->
  <v-footer absolute class="d-flex flex-wrap justify-center pa-2 ga-2">
    <v-btn
      v-if="!imagesGenerated"
      @click="$emit('generate-images')"
      :disabled="isGeneratingImages"
      :loading="isGeneratingImages"
      color="secondary"
    >
      Generate Images
    </v-btn>
    <v-btn @click="$emit('start-game')" color="primary" size="large"> Start Game </v-btn>
  </v-footer>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

/**
 * @import {PropType} from 'vue'
 * @import {Witness, GameSettings} from '@/types.js'
 */
const props = defineProps({
  /** @type {PropType<Witness>} */
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
