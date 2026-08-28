<template>
  <v-card class="mb-4">
    <v-card-title>The Crime</v-card-title>
    <v-card-text>{{ crime }}</v-card-text>
  </v-card>
</template>

<script setup>
/**
 * CrimeDescription component renders the crime overview.
 */
defineProps({
  crime: {
    type: String,
    required: true,
  },
})
</script>

<style scoped></style>

