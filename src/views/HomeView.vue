<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" class="text-center">
        <page-header />
        <create-game />
        <join-game />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import PageHeader from '@/components/PageHeader.vue';
import CreateGame from '@/components/CreateGame.vue';
import JoinGame from '@/components/JoinGame.vue';

export default {
  name: 'HomeView',
  components: {
    PageHeader,
    CreateGame,
    JoinGame,
  },
};
</script>

<style scoped>
.fill-height {
  min-height: 100%;
}
</style>
