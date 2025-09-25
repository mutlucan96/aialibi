<template>
  <v-card class="ma-2">
    <v-card-title>The Crime</v-card-title>
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
