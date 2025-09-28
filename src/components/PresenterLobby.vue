<template>
  <v-row align="center" justify="center">
    <!-- Left Column: Game Code and QR Code -->
    <v-col cols="8" md="6" class="text-center">
      <p class="text-h6 text-center mb-4">Waiting for the host to start the game...</p>
      <h1 class="text-h3 mb-4">Join the Game!</h1>
      <div class="text-h1 font-weight-bold mb-8">
        {{ gameId }}
      </div>
      <p class="ma-4 text-h5">Scan to join</p>
      <div class="d-flex justify-center">
        <qrcode-vue :value="joinGameUrl" :size="200" level="H"></qrcode-vue>
      </div>
      <p class="mt-2 text-h5">
        <a :href="joinGameUrl">{{ joinGameUrl }}</a>
      </p>
    </v-col>
    <v-col cols="4" md="4">
      <TeamList :game="game" />
    </v-col>
  </v-row>
</template>

<script setup>
import QrcodeVue from 'qrcode.vue'
import TeamList from '@/components/TeamList.vue'
import { computed } from 'vue'

/**
 * @import {PropType} from 'vue'
 * @import {Game} from '@/types.js'
 */
const props = defineProps({
  gameId: {
    type: String,
    required: true,
  },
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },
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
