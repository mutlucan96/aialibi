<template>
  <v-row justify="center" class="mt-10">
    <v-col cols="auto">
      <v-btn color="error" @click="$emit('open-accusation')" :disabled="isDisabled">
        {{ isDisabled ? `Try again in ${cooldownText}` : 'Make an Accusation' }}
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup>
const props = defineProps({
  isDisabled: {
    type: Boolean,
    default: false,
  },
  cooldownText: {
    type: String,
    default: '',
  },
})

defineEmits(['open-accusation'])
</script>
