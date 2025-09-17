<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" class="text-center">
        <page-header />
        <create-game />
        <join-game />
      </v-col>
    </v-row>
    <page-footer />
  </v-container>
</template>

<script>
import PageHeader from '@/components/PageHeader.vue';
import CreateGame from '@/components/CreateGame.vue';
import JoinGame from '@/components/JoinGame.vue';
import PageFooter from '@/components/PageFooter.vue';

export default {
  name: 'HomeView',
  components: {
    PageHeader,
    CreateGame,
    JoinGame,
    PageFooter,
  },
};
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
