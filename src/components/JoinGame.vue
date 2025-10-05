<template>
  <v-card class="mb-4">
    <v-card-title>Join an Existing Game</v-card-title>
    <v-card-text>
      <v-text-field
        v-model="gameCode"
        label="Enter Game Code"
        prepend-inner-icon="mdi-key-variant"
        variant="outlined"
        maxlength="4"
        oninput="this.value=this.value.slice(0,this.maxLength)"
        pattern="[0-9]{4}"
        @keydown.enter="joinGame"
      ></v-text-field>
      <v-btn :disabled="!isGameCodeValid" color="primary" block @click="joinGame">
        Join Game
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const gameCode = ref('')
const router = useRouter()

const isGameCodeValid = computed(() => {
  const code = String(gameCode.value).trim()
  return code.length === 4 && /^\d{4}$/.test(code)
})

/**
 * @description Navigates to the game view with the entered game code.
 */
const joinGame = () => {
  const code = String(gameCode.value).trim()
  if (code.length === 4 && /^\d{4}$/.test(code)) {
    router.push({ name: 'game', params: { gameId: code } })
  } else {
    alert('Please enter a valid 4-digit game code.')
  }
}
</script>
