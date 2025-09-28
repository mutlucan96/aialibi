<template>
  <v-card>
    <v-card-text>{{ crime }}</v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  crime: {
    type: String,
    required: true,
  },
})
</script>

<style scoped></style>
