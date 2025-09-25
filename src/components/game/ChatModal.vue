<template>
  <v-dialog
    close-on-back
    :model-value="modelValue"
    @update:model-value="$emit('close')"
    max-width="600px"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-avatar size="48" class="mr-3">
          <v-img :src="witness.imageUrl" :alt="witness.name"></v-img>
        </v-avatar>
        <span>{{ witness.name }}</span>
        <v-spacer></v-spacer>
        <v-btn variant="text" icon @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text style="max-height: 400px; overflow-y: auto">
        <div v-for="(message, index) in chatHistory" :key="index" class="mb-2">
          <div :class="{ 'text-right': message.sender === 'player' }">
            <v-chip :color="message.sender === 'player' ? 'primary' : 'grey-lighten-1'">
              {{ message.text }}
            </v-chip>
          </div>
        </div>
        <!-- Placeholder for streaming AI response -->
        <div v-if="streamingMessage" class="mb-2">
          <v-chip color="grey-lighten-1">
            {{ streamingMessage }}
          </v-chip>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-text-field
          v-if="!messageSent"
          v-model="messageText"
          label="Your message"
          variant="outlined"
          density="compact"
          hide-details
          @keyup.enter="sendMessage"
        ></v-text-field>
        <v-btn
          v-if="!messageSent"
          color="primary"
          @click="sendMessage"
          :disabled="!messageText.trim()"
        >
          Send
        </v-btn>
        <v-btn v-else color="primary" @click="$emit('close')"> OK </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

/**
 * @import {PropType} from 'vue'
 * @import {Witness} from '@/types.js'
 */
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  /** @type {PropType<Witness>} */
  witness: {
    type: Object,
    required: true,
  },
  chatHistory: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'send-message', 'close'])

/** @type {import('vue').Ref<string>} */
const messageText = ref('')
const messageSent = ref(false)
/** @type {import('vue').Ref<string>} */
const streamingMessage = ref('')

// Reset messageSent when the modal opens/closes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      messageSent.value = false
      messageText.value = ''
      streamingMessage.value = ''
    }
  },
)

const sendMessage = () => {
  if (messageText.value.trim()) {
    emit('send-message', messageText.value.trim())
    messageSent.value = true
  }
}

// Function to simulate AI streaming response (for demonstration)
// In a real application, this would be called by the parent component
// as AI chunks arrive.
const streamAiResponse = (text) => {
  streamingMessage.value += text
}

defineExpose({ streamAiResponse }) // Expose function for parent to call
</script>

<style scoped></style>
