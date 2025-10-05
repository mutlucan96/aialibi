<template>
  <v-app>
    <v-main>
      <RouterView />
    </v-main>
    <page-footer />
  </v-app>
</template>

<script setup>
import { RouterView } from 'vue-router'
import PageFooter from '@/components/PageFooter.vue'
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto+Slab&display=swap');
</style>
