<template>
  <v-card>
    <v-col cols="12" md="12" style="min-height: 65vh">
      <v-list v-if="teams.length > 0" dense rounded>
        <v-list-item
          rounded
          v-for="team in teams"
          :key="team.id"
          class="ma-1"
          :style="{ backgroundColor: team.color }"
        >
          <v-list-item-title class="text-h5" style="color: #fff; text-shadow: 0 0 2px BLACK">
            <v-chip
              v-if="team.result"
              density="compact"
              class="text-h5 pa-1"
              size="x-large"
              variant="text"
            >
              {{ getOrdinalWord(team.result.placement) }}
            </v-chip>
            {{ team.emoji }} {{ team.name }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
      <p v-else class="text-h6 text-center">No teams have joined yet.</p>
    </v-col>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { getOrdinalWord } from '@/utils/formatters.js'

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
  const allTeams = Object.entries(props.game.teams).map(([id, teamData]) => ({
    id,
    ...teamData,
    result: props.game.results[id] || null,
  }))

  return allTeams.sort((a, b) => {
    if (a.result && !b.result) return -1
    if (!a.result && b.result) return 1
    if (a.result && b.result) {
      return a.result.placement - b.result.placement
    }
    return a.name.localeCompare(b.name)
  })
})
</script>

<style scoped></style>
