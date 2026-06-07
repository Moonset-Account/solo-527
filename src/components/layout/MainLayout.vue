<script setup lang="ts">
import Sidebar from './Sidebar.vue';
import FilterBar from '@/components/filters/FilterBar.vue';
import DrillDownPanel from '@/components/common/DrillDownPanel.vue';
</script>

<template>
  <div class="flex min-h-screen bg-slate-50">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="bg-white border-b border-slate-200 px-6 py-3 shadow-sm z-10">
        <FilterBar />
      </header>
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
    <DrillDownPanel />
  </div>
</template>
