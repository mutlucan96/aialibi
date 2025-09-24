<template>
  <v-col cols="12" md="6" style="min-height: 65vh; max-width: 500px">
    <h2 class="text-h4 mb-4 text-center">Teams in the Lobby</h2>
    <v-list v-if="teams.length > 0" dense>
      <v-list-item
        rounded
        v-for="team in teams"
        :key="team.id"
        :style="{ backgroundColor: team.color }"
      >
        <v-list-item-title class="text-h5" style="color: #fff; text-shadow: 0 0 2px BLACK"
          >{{ team.emoji }} {{ team.name }}</v-list-item-title
        >
      </v-list-item>
    </v-list>
    <p v-else class="text-h6 text-center">No teams have joined yet.</p>
  </v-col>
</template>

<script setup>
import { computed } from 'vue'

/**
 * @import {PropType} from 'vue'
 * @import {Game} from '@/types.js'
 */
const props = defineProps({
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },
})

const teams = computed(() => {
  if (!props.game || !props.game.teams) {
    return []
  }
  return Object.entries(props.game.teams).map(([id, teamData]) => ({
    id,
    ...teamData,
  }))
})
</script>

<style scoped></style>
