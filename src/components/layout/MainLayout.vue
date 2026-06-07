<script setup lang="ts">
import { computed } from 'vue';
import Sidebar from './Sidebar.vue';
import FilterBar from '@/components/filters/FilterBar.vue';
import DrillDownPanel from '@/components/common/DrillDownPanel.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const isStudent = computed(() => authStore.userRole === 'student');
const canDrillDown = computed(() => authStore.hasPermission('drill_down'));
</script>

<template>
  <div class="flex min-h-screen bg-slate-50">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <header v-if="!isStudent" class="bg-white border-b border-slate-200 px-6 py-3 shadow-sm z-10">
        <FilterBar />
      </header>
      <header v-else class="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10">
        <div class="text-sm text-slate-500">
          欢迎使用图书馆座位预约系统 · 个人中心
        </div>
      </header>
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
    <DrillDownPanel v-if="canDrillDown" />
  </div>
</template>
