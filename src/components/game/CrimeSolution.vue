<template>
  <v-card class="mb-6">
    <v-card-actions>
      <v-btn variant="text" size="small" @click="showSolution = !showSolution">
        {{ showSolution ? 'Hide solution' : 'Show solution...' }}
      </v-btn>
    </v-card-actions>
    <v-expand-transition>
      <div v-if="showSolution">
        <v-card color="red-lighten-5">
          <v-card-title>Top Secret: The Solution</v-card-title>
          <v-card-text>
            <p><strong>Culprit:</strong> {{ caseFile.culprit }}</p>
            <p><strong>Motive:</strong> {{ caseFile.motive }}</p>
          </v-card-text>
        </v-card>
      </div>
    </v-expand-transition>
  </v-card>
</template>
<script setup>
import { ref } from 'vue'
/**
 * @import {PropType} from 'vue'
 * @import {Witness, GameSettings, CaseFile} from '@/types.js'
 */

const showSolution = ref(false)

const props = defineProps({
  /** @type {PropType<CaseFile>} */
  caseFile: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped></style>
