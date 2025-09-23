<template>
  <v-row align="center" justify="center">
    <!-- Left Column: Game Code and QR Code -->
    <v-col cols="12" md="6" class="text-center">
      <p class="text-h6 text-center mb-4">Waiting for the host to start the game...</p>
      <h1 class="text-h3 mb-4">Join the Game!</h1>
      <div class="text-h1 font-weight-bold mb-8">
        {{ gameId }}
      </div>
      <p class="ma-4 text-h6">Scan to join</p>
      <div class="d-flex justify-center">
        <qrcode-vue :value="joinGameUrl" :size="200" level="H"></qrcode-vue>
      </div>
      <p class="mt-2 text-body-1">
        <a :href="joinGameUrl">{{ joinGameUrl }}</a>
      </p>
    </v-col>

    <!-- Right Column: Teams in the Lobby -->
    <v-col cols="12" md="6">
      <h2 class="text-h4 mb-4 text-center">Teams in the Lobby</h2>
      <v-list v-if="teams.length > 0" dense>
        <v-list-item v-for="team in teams" :key="team.id">
          <v-list-item-title class="text-h5"
            >{{ team.emoji }} {{ team.name }}</v-list-item-title
          >
        </v-list-item>
      </v-list>
      <p v-else class="text-h6 text-center">No teams have joined yet.</p>
    </v-col>
  </v-row>
</template>

<script setup>
import QrcodeVue from 'qrcode.vue'
import { computed } from 'vue'

const props = defineProps({
  gameId: {
    type: String,
    required: true,
  },
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

const joinGameUrl = computed(() => {
  return `${window.location.origin}/game/${props.gameId}`
})
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
