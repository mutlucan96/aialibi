<template>
  <v-container>
    <!-- Teams Display -->
    <v-row justify="center" class="mb-4">
      <v-col cols="12">
        <div class="d-flex justify-center align-center">
          <div v-for="team in game.teams" :key="team.id" class="team-avatar-container">
            <v-avatar
              :color="team.color"
              size="48"
              class="team-avatar"
              :style="getTeamAvatarStyle(team)"
            >
              {{ team.emoji }}
            </v-avatar>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Witnesses Display -->
    <v-row justify="center">
      <v-col v-for="witness in game.witnesses" :key="witness.id" cols="12" sm="6" md="3">
        <v-card
          class="witness-card"
          :disabled="isWitnessDisabled(witness.id)"
          @click="!isWitnessDisabled(witness.id) && $emit('open-chat', witness.id)"
        >
          <v-img :src="witness.imageUrl" height="150px" cover></v-img>
          <v-card-title>{{ witness.name }}</v-card-title>
          <v-card-subtitle v-if="isWitnessDisabled(witness.id)">
            Busy with another team
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- Accusation Button -->
    <v-row justify="center" class="mt-6">
      <v-col cols="auto">
        <v-btn color="error" @click="$emit('open-accusation')"> Make an Accusation </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
/**
 * @import {Game} from '@/types.js'
 * @import {PropType} from 'vue'
 */
const props = defineProps({
  /** @type {PropType<Game>} */
  game: {
    type: Object,
    required: true,
  },

  mode: {
    type: String,
    required: true,
  },
})

/**
 * Checks if a witness is currently disabled (i.e., busy with another team).
 * @param {string} witnessId - The ID of the witness to check.
 * @returns {boolean} - True if the witness is disabled, false otherwise.
 */
const isWitnessDisabled = (witnessId) => {
  return Object.values(props.game.teams).some((team) => team.talkingTo === witnessId)
}

/**
 * Generates dynamic styles for a team's avatar based on its state.
 * @param {Team} team - The team object.
 * @returns {Object} - CSS style object.
 */
const getTeamAvatarStyle = (team) => {
  if (team.talkingTo) {
    // Find the witness card position and animate the avatar
    // This part would typically involve more complex DOM manipulation or a reactive CSS framework
    // For now, we'll just return a placeholder style.
    // A more complete solution would require knowing the exact position of witness cards.
    // For demonstration, let's assume a simple translation.
    // In a real app, you'd use refs to get the witness card's position.
    return {
      transform: `translateY(50px) translateX(50px)`, // Placeholder for animation
      transition: 'transform 0.5s ease-in-out',
      zIndex: 10,
    }
  }
  return {}
}
</script>

<style scoped>
.team-avatar-container {
  margin: 0 8px;
  position: relative;
}

.team-avatar {
  position: relative;
  transition: transform 0.5s ease-in-out;
}

.witness-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.witness-card:hover:not(.v-card--disabled) {
  transform: translateY(-5px);
}

.v-card--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
