<template>
  <v-card class="mb-6">
    <v-card-actions v-if="showButton">
      <v-btn variant="text" size="small" @click="showSolution = !showSolution">
        {{ showSolution ? 'Hide solution' : 'Show solution...' }}
      </v-btn>
    </v-card-actions>
    <v-expand-transition>
      <div v-if="showSolution">
        <v-card color="red-lighten-5">
          <v-card-title>The Solution</v-card-title>
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
/**
 * @import {PropType} from 'vue'
 * @import {CaseFile} from '@/types.js'
 */

import { ref, onMounted } from 'vue'
const showSolution = ref(false)
const showButton = ref(true)
const props = defineProps({
  /** @type {PropType<CaseFile>} */
  caseFile: {
    type: Object,
    required: true,
  },
  showSolution: {
    type: Boolean,
    required: false,
    default: false,
  },
})

onMounted(() => {
  showSolution.value = props.showSolution
  showButton.value = !props.showSolution
})
</script>

<style scoped></style>
