<script setup lang="ts">
import { useSystemStore } from '@/stores/systemStore'
import { useDataStore } from '@/stores/dataStore'
import { storeToRefs } from 'pinia'

const systemStore = useSystemStore()
const dataStore = useDataStore()
const { status, formattedLastUpdate } = storeToRefs(systemStore)
const { offlineStations } = storeToRefs(dataStore)
</script>

<template>
  <header class="bg-slate-900 text-white px-6 py-3 flex items-center justify-between card-shadow z-50">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <svg class="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
        <h1 class="text-xl font-bold tracking-wide">城市空气质量公开仪表盘</h1>
      </div>
      <span class="h-6 w-px bg-slate-700"></span>
      <div class="flex items-center gap-2 text-sm text-slate-300">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>数据更新：</span>
        <span class="font-mono text-primary-300">{{ formattedLastUpdate }}</span>
      </div>
    </div>

    <div class="flex items-center gap-6">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span class="text-sm text-slate-300">在线监测点</span>
          <span class="font-mono font-bold text-green-400">{{ status?.onlineStations || 0 }}</span>
          <span class="text-slate-500">/</span>
          <span class="font-mono text-slate-400">{{ status?.totalStations || 0 }}</span>
        </div>

        <div v-if="offlineStations.length > 0" class="flex items-center gap-2 pl-3 border-l border-slate-700">
          <span class="relative flex h-3 w-3">
            <span class="animate-pulse-slow absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span class="text-sm text-red-400">{{ offlineStations.length }} 个离线</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <router-link
          to="/export"
          class="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          数据导出
        </router-link>
      </div>
    </div>
  </header>
</template>
