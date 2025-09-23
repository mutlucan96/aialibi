<template>
  <v-row align="center" justify="center" class="fill-height">
    <v-col class="text-center">
      <template v-if="loading">
        <v-progress-circular
          indeterminate
          color="primary"
          :size="70"
          :width="7"
        ></v-progress-circular>
      </template>
      <template v-else>
        <h1 class="text-h2">Game Not Found</h1>
        <p class="text-h5 mt-4">
          The game with ID "{{ gameId }}" does not exist or could not be loaded.
        </p>
      </template>
    </v-col>
  </v-row>
</template>

<script setup>
defineProps({
  gameId: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
})
</script>
