<template>
  <v-dialog
    :close-on-back="!loading"
    :model-value="modelValue"
    @update:model-value="!loading && $emit('close')"
    max-width="600px"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-avatar size="48" class="mr-3">
          <v-img :src="witness.imageUrl" :alt="witness.name"></v-img>
        </v-avatar>
        <span>{{ witness.name }}</span>
        <v-spacer></v-spacer>
        <v-btn variant="text" icon @click="!loading && $emit('close')" :disabled="loading">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text style="max-height: 400px; overflow-y: auto">
        <div v-for="(message, index) in chatHistory" :key="index" class="mb-2">
          <div :class="{ 'text-right': message.sender === 'player' }">
            <div
              :class="[
                'chat-bubble',
                message.sender === 'player' ? 'player-message' : 'witness-message',
              ]"
            >
              {{ message.text }}
            </div>
          </div>
        </div>
        <!-- Placeholder for streaming AI response -->
        <div v-if="streamingMessage" class="mb-2">
          <div class="chat-bubble witness-message">
            {{ streamingMessage }}
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-text-field
          v-if="!messageSent"
          ref="messageInput"
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
        <v-btn
          v-else
          color="primary"
          @click="!loading && $emit('close')"
          :disabled="loading"
          :loading="loading && !streamingComplete"
        >
          {{ streamingComplete ? 'OK' : '' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

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
const loading = ref(false) // New ref for loading state
const streamingComplete = ref(false) // New ref to track streaming completion
/** @type {import('vue').Ref<string>} */
const streamingMessage = ref('')
const messageInput = ref(null) // Ref for the text input

// Reset messageSent and focus input when the modal opens/closes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      messageSent.value = false
      messageText.value = ''
      streamingMessage.value = ''
      loading.value = false // Reset loading state
      streamingComplete.value = false // Reset streaming completion
      nextTick(() => {
        if (messageInput.value) {
          messageInput.value.focus()
        }
      })
    }
  },
)

const sendMessage = () => {
  if (messageText.value.trim()) {
    emit('send-message', messageText.value.trim())
    messageSent.value = true
    loading.value = true // Set loading to true when message is sent
  }
}

// Function to simulate AI streaming response (for demonstration)
// In a real application, this would be called by the parent component
// as AI chunks arrive.
const streamAiResponse = (text, done = false) => {
  streamingMessage.value += text
  if (done) {
    loading.value = false // Set loading to false when streaming is complete
    streamingComplete.value = true // Set streamingComplete to true
  }
}

defineExpose({ streamAiResponse }) // Expose function for parent to call
</script>

<style scoped>
.chat-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 15px;
  word-wrap: break-word;
  display: inline-block; /* Ensures it only takes up necessary width */
}

.player-message {
  background-color: #1976d2;
  color: white;
  margin-left: auto;
}

.witness-message {
  background-color: #e0e0e0;
  color: black;
  margin-right: auto;
}
</style>
