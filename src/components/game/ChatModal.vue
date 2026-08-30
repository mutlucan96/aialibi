<template>
  <v-dialog
    :close-on-back="!loading"
    :model-value="modelValue"
    @update:model-value="!loading && $emit('close')"
    max-width="600px"
  >
    <v-card class="d-flex flex-column">
      <v-card-title class="d-flex align-center">
        <WitnessAvatar :witness="witness" :size="48" custom-class="mr-3" />
        <div class="d-flex flex-column justify-center">
          <span>{{ witness.name }}</span>
          <span
            v-if="isAiResponding"
            class="text-caption text-primary mt-1"
            style="font-size: 0.75rem; line-height: 1"
          >
            Thinking...
          </span>
        </div>
        <v-spacer></v-spacer>
        <v-btn variant="text" icon @click="!loading && $emit('close')" :disabled="loading">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text
        style="overflow-y: auto; flex-grow: 1; min-height: 200px"
        ref="chatMessagesContainer"
      >
        <TransitionGroup name="slide-up" tag="div">
          <div v-for="(message, index) in chatHistory" :key="message.id || index" class="mb-2">
            <div :class="{ 'text-right': message.sender === 'player' }">
              <div
                class="chat-bubble"
                :class="{
                  'player-message': message.sender === 'player',
                  'witness-message': message.sender !== 'player',
                }"
              >
                {{ message.text }}
              </div>
            </div>
          </div>
        </TransitionGroup>
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
          icon
          color="primary"
          @click="sendMessage"
          :disabled="!messageText.trim()"
        >
          <v-icon>mdi-send</v-icon>
        </v-btn>
        <v-btn
          v-else
          color="primary"
          @click="!props.isAiResponding && $emit('close')"
          :disabled="props.isAiResponding"
          :loading="props.isAiResponding"
        >
          {{ props.isAiResponding ? '' : 'OK' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import WitnessAvatar from '@/components/common/WitnessAvatar.vue'

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
  isAiResponding: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'send-message', 'close'])

/** @type {import('vue').Ref<string>} */
const messageText = ref('')
const messageSent = ref(false)
const loading = ref(false)
/** @type {import('vue').Ref<HTMLInputElement | null>} */
const messageInput = ref(null)
/** @type {import('vue').Ref<HTMLDivElement | null>} */
const chatMessagesContainer = ref(null)

const scrollToNewMessage = () => {
  nextTick(() => {
    const container = chatMessagesContainer.value?.$el || chatMessagesContainer.value
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

// Reset messageSent and focus input when the modal opens/closes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      messageSent.value = false
      messageText.value = ''
      nextTick(() => {
        if (messageInput.value) {
          messageInput.value.focus()
        }
        scrollToNewMessage()
      })
    }
  },
)

// Watch for changes in chatHistory and scroll to the bottom
watch(
  () => props.chatHistory,
  () => {
    nextTick(() => {
      scrollToNewMessage()
    })
  },
  { deep: true },
)

onMounted(() => {
  scrollToNewMessage()
})

const sendMessage = () => {
  if (messageText.value.trim()) {
    emit('send-message', messageText.value.trim())
    messageSent.value = true
  }
}
</script>

<style scoped>
.chat-bubble {
  padding: 8px 12px;
  border-radius: 15px;
  word-wrap: break-word;
  display: inline-block;
}

.player-message {
  background-color: #9b5a00;
  color: white;
  margin-left: auto;
}

.witness-message {
  background-color: #e0e0e0;
  color: black;
}

.slide-up-enter-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.slide-up-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>
