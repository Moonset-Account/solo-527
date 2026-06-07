<script setup lang="ts">
import { ref, provide } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import FilterBar from '@/components/FilterBar.vue'

const sidebarPinned = ref(false)

provide('sidebarPinned', sidebarPinned)
</script>

<template>
  <div class="flex h-screen bg-[#071E25] text-gray-100 overflow-hidden">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-auto">
      <FilterBar />

      <main class="flex-1 p-4 md:p-6 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
