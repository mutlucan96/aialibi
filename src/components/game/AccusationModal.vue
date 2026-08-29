<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-card-title class="headline">Make Your Accusation!</v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedCulprit"
          :items="witnessesList"
          item-title="name"
          item-value="id"
          label="Choose the Culprit"
          variant="outlined"
          class="mb-4"
        >
          <template #selection="{ item }">
            <div class="d-flex align-center">
              <WitnessAvatar :witness="item.raw" :size="28" custom-class="mr-2" />
              <span>{{ item.raw.name }}</span>
            </div>
          </template>
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :title="item.raw.name">
              <template #prepend>
                <WitnessAvatar :witness="item.raw" :size="36" custom-class="mr-3" />
              </template>
            </v-list-item>
          </template>
        </v-select>

        <v-textarea
          v-model="motive"
          label="Type your motive here"
          variant="outlined"
          rows="3"
          class="mb-4"
        ></v-textarea>

        <v-alert type="warning" dense class="mb-4">
          An incorrect accusation will result in a 2-minute penalty!
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-darken-1" text @click="closeModal" :disabled="isLoading">Cancel</v-btn>
        <v-btn
          color="blue-darken-1"
          text
          @click="submitAccusation"
          :disabled="!selectedCulprit || !motive || isLoading || isDisabled"
          :loading="isLoading"
          >Submit</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import WitnessAvatar from '@/components/common/WitnessAvatar.vue'

/**
 * @import {Game, Witness} from '@/types.js'
 * @import {PropType} from 'vue'
 */
const props = defineProps({
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit-accusation', 'close', 'update:modelValue'])

const dialog = ref(props.modelValue)
const selectedCulprit = ref(null)
const motive = ref('')

const witnessesList = computed(() => {
  if (!props.game?.witnesses) return []
  return Array.isArray(props.game.witnesses)
    ? props.game.witnesses
    : Object.values(props.game.witnesses)
})

watch(
  () => props.modelValue,
  (newVal) => {
    dialog.value = newVal
    if (newVal) {
      // Reset form when modal opens
      selectedCulprit.value = null
      motive.value = ''
    }
  },
)

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
})

const closeModal = () => {
  dialog.value = false
  emit('close')
}

const submitAccusation = () => {
  if (selectedCulprit.value && motive.value) {
    emit('submit-accusation', { culprit: selectedCulprit.value, motive: motive.value })
  }
}
</script>

<style scoped></style>
