<script setup lang="ts">
import type { DashboardStats } from '~/shared/types'

definePageMeta({ layout: 'admin' })

const stats = ref<DashboardStats | null>(null)
const loading = ref(true)
const refreshing = ref(false)

async function loadStats() {
  loading.value = !stats.value
  refreshing.value = !!stats.value
  try {
    stats.value = await $fetch<DashboardStats>('/api/stats/dashboard')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(() => {
  loadStats()
})

const statCards = computed(() => {
  if (!stats.value) return []
  return [
    { label: '总房间数', value: stats.value.totalRooms, icon: '🏠', color: 'bg-pine' },
    { label: '可售房间', value: stats.value.availableRooms, icon: '✅', color: 'bg-pine-light' },
    { label: '空置率', value: `${stats.value.vacancyRate?.toFixed(1)}%`, icon: '📊', color: 'bg-amber' },
    { label: '待办事项', value: stats.value.pendingTodos, icon: '📋', color: 'bg-brick' },
  ]
})

const maxVacancyRate = computed(() => {
  if (!stats.value?.vacancyTrend.length) return 1
  return Math.max(...stats.value.vacancyTrend.map((v) => v.rate), 1)
})

function formatTrendDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<template>
  <div>
    <div
      v-if="stats?.p0Reminders && stats.p0Reminders > 0"
      class="bg-brick text-white rounded-xl px-6 py-4 mb-6 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span class="font-semibold">您有 {{ stats.p0Reminders }} 条 P0 紧急提醒</span>
      </div>
      <NuxtLink to="/admin/reminders" class="text-sm underline underline-offset-2 hover:no-underline">查看详情</NuxtLink>
    </div>

    <h1 class="font-serif text-2xl font-bold text-pine mb-2">仪表盘</h1>

    <div class="flex items-center justify-between mb-6">
      <p class="text-slate text-sm">实时运营数据概览</p>
      <button
        @click="loadStats"
        :disabled="refreshing"
        class="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5"
      >
        <svg
          class="w-4 h-4"
          :class="{ 'animate-spin': refreshing }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0115.357-2m-2H4v.582z" />
        </svg>
        {{ refreshing ? '刷新中...' : '刷新数据' }}
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="inline-block w-8 h-8 border-2 border-pine/20 border-t-pine rounded-full animate-spin" />
    </div>

    <template v-else-if="stats">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div
          v-for="card in statCards"
          :key="card.label"
          class="bg-white rounded-xl p-5 shadow-sm border border-cream-dark/50 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-slate font-medium">{{ card.label }}</span>
            <span class="text-xl">{{ card.icon }}</span>
          </div>
          <div class="text-3xl font-bold text-pine">{{ card.value }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-cream-dark/50">
          <h2 class="font-serif text-lg font-semibold text-pine mb-5">空置率趋势（近7日）</h2>
          <div class="flex items-end gap-3 h-48">
            <div
              v-for="item in stats.vacancyTrend"
              :key="item.date"
              class="flex-1 flex flex-col items-center justify-end h-full"
            >
              <span class="text-xs text-pine font-semibold mb-1">
                {{ item.rate.toFixed(0) }}%
              </span>
              <div
                class="w-full rounded-t-md transition-all duration-500"
                :class="item.rate > 50 ? 'bg-pine' : item.rate > 20 ? 'bg-amber' : 'bg-brick'"
                :style="{ height: `${(item.rate / maxVacancyRate) * 100}%` }"
              />
              <span class="text-xs text-slate mt-2">{{ formatTrendDate(item.date) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-cream-dark/50">
          <h2 class="font-serif text-lg font-semibold text-pine mb-5">今日动态</h2>
          <div class="space-y-4">
            <div class="flex items-center gap-4 p-4 rounded-lg bg-pine/5">
              <div class="w-12 h-12 rounded-full bg-pine/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-pine" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <div class="text-2xl font-bold text-pine">{{ stats.todayCheckIns }}</div>
                <div class="text-sm text-slate">今日入住</div>
              </div>
            </div>
            <div class="flex items-center gap-4 p-4 rounded-lg bg-amber/5">
              <div class="w-12 h-12 rounded-full bg-amber/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <div class="text-2xl font-bold text-amber">{{ stats.todayCheckOuts }}</div>
                <div class="text-sm text-slate">今日退房</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
