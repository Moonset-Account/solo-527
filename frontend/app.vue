<template>
  <NaiveProvider>
    <main class="app">
      <NuxtPage />
    </main>
  </NaiveProvider>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

if (process.client) {
  authStore.init()
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
.app {
  min-height: 100vh;
}
</style>
