<template>
  <v-row justify="center" class="mb-4">
    <v-col cols="12">
      <div class="d-flex justify-center align-center">
        <div v-for="team in teams" :key="team.id" class="team-avatar-container">
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
</template>

<script setup>
/**
 * @import {Team} from '@/types.js'
 * @import {PropType} from 'vue'
 */
const props = defineProps({
  /** @type {PropType<Team[]>} */
  teams: {
    type: Array,
    required: true,
  },
});

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
    };
  }
  return {};
};
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
</style>
