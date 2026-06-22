<template>
  <div class="flex h-screen overflow-hidden bg-cream">
    <Sidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <AppHeader />
      <main class="flex-1 overflow-y-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import AppHeader from './AppHeader.vue'
</script>
