<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
</script>

<template>
  <div class="flex min-h-screen bg-bg-primary">
    <Sidebar />
    <div class="flex-1 flex flex-col">
      <Header />
      <main class="flex-1 p-6 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
