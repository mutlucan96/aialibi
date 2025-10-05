<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <page-header />
        <join-game />
        <moderator-panel />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'
import JoinGame from '@/components/JoinGame.vue'
import ModeratorPanel from '@/components/ModeratorPanel.vue'
</script>

<style scoped></style>
