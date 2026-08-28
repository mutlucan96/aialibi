<template>
  <v-card class="crime-description-card mb-4" rounded="lg" elevation="2">
    <v-card-item class="pb-1">
      <template #prepend>
        <v-icon color="primary" class="mr-2">mdi-shield-search-outline</v-icon>
      </template>
      <v-card-title class="text-subtitle-1 font-weight-bold">
        The Crime
      </v-card-title>
    </v-card-item>
    <v-card-text class="crime-text text-body-1 pt-1 pb-3">
      {{ crime }}
    </v-card-text>
  </v-card>
</template>

<script setup>
/**
 * CrimeDescription component renders the main case brief and crime scene overview.
 */
defineProps({
  crime: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.crime-text {
  line-height: 1.6;
}
</style>
