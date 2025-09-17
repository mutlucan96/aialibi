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

<style scoped>
</style>
