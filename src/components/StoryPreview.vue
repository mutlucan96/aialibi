<template>
  <div>
    <v-card>
      <v-card-title>Crime Description</v-card-title>
      <v-card-text>{{ game.story.crimeDescription }}</v-card-text>
    </v-card>

    <v-row class="mt-4">
      <v-col v-for="witness in game.story.witnesses" :key="witness.id" cols="6" sm="3">
        <v-card>
          <v-img :src="witness.imageUrl" height="150px"></v-img>
          <v-card-title class="text-caption">{{ witness.name }}</v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <v-btn @click="$emit('start-game')" color="success" class="mt-4">Start Game</v-btn>
  </div>
</template>

<script setup>
import { /** @type {PropType} */ PropType } from 'vue';
import '@/types.js';

defineProps({
  game: {
    type: /** @type {PropType<Game>} */ (Object),
    required: true,
  },
});

defineEmits(['start-game']);

</script>
