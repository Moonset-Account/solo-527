<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Bell, RefreshCw, User } from 'lucide-vue-next'
import { useEnergyStore } from '@/stores/energy'

const route = useRoute()
const energyStore = useEnergyStore()

const pageTitle = computed(() => route.meta?.title || '能耗分析平台')
const alertCount = computed(() => energyStore.openAlerts.length)

function refreshData() {
  energyStore.refreshData()
}
</script>

<template>
  <header class="h-16 bg-bg-secondary border-b border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-10">
    <div>
      <h2 class="font-display font-semibold text-xl text-white">{{ pageTitle }}</h2>
    </div>

    <div class="flex items-center gap-4">
      <button
        @click="refreshData"
        class="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-bg-tertiary/50 rounded-lg transition-colors"
      >
        <RefreshCw class="w-4 h-4" />
        <span class="text-sm">刷新数据</span>
      </button>

      <button class="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-bg-tertiary/50 rounded-lg transition-colors">
        <Bell class="w-5 h-5" />
        <span
          v-if="alertCount > 0"
          class="absolute -top-1 -right-1 w-5 h-5 bg-status-danger text-white text-xs font-bold rounded-full flex items-center justify-center"
        >
          {{ alertCount > 9 ? '9+' : alertCount }}
        </span>
      </button>

      <div class="flex items-center gap-3 pl-4 border-l border-slate-700/50">
        <div class="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center">
          <User class="w-5 h-5 text-white" />
        </div>
        <div class="hidden md:block">
          <p class="text-sm font-medium text-slate-200">能源管理员</p>
          <p class="text-xs text-slate-400">admin@building.com</p>
        </div>
      </div>
    </div>
  </header>
</template>
