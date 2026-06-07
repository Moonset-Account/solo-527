<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFilterStore } from '@/stores/filter'
import { useQualityStore, type TimeWindow } from '@/stores/quality'
import { Calendar, RefreshCw, Download, Settings, ChevronDown, Check, Database } from 'lucide-vue-next'
import dayjs from 'dayjs'

const route = useRoute()
const filterStore = useFilterStore()
const qualityStore = useQualityStore()

const showDatePicker = ref(false)

const timePresets: { key: TimeWindow; label: string; days: number }[] = [
  { key: '24h', label: '近 24 小时', days: 1 },
  { key: '7d', label: '近 7 天', days: 7 },
  { key: '30d', label: '近 30 天', days: 30 },
  { key: '90d', label: '近 90 天', days: 90 },
]

const selectedPreset = computed(() => qualityStore.timeWindow)

const pageTitle = computed(() => (route.meta?.title as string) || '样本质量监控')

const timeRangeText = computed(() => {
  const { start, end } = filterStore.timeRange
  return `${start} ~ ${end}`
})

function selectPreset(key: TimeWindow, days: number) {
  const end = dayjs().format('YYYY-MM-DD')
  const start = dayjs().subtract(days, 'day').format('YYYY-MM-DD')
  filterStore.setTimeRange(start, end)
  qualityStore.setTimeWindow(key)
  showDatePicker.value = false
}

function toggleDatePicker() {
  showDatePicker.value = !showDatePicker.value
}
</script>

<template>
  <header class="h-16 bg-survey-surface border-b border-survey-border flex items-center justify-between px-6 relative">
    <div class="flex items-center gap-4">
      <h2 class="text-lg font-semibold text-survey-text-primary">{{ pageTitle }}</h2>
      <div class="relative">
        <button
          @click="toggleDatePicker"
          class="flex items-center gap-2 px-3 py-1.5 bg-survey-bg rounded-md border border-survey-border hover:border-survey-primary/50 transition-colors"
        >
          <Calendar class="w-4 h-4 text-survey-text-muted" />
          <span class="text-sm text-survey-text-secondary">{{ timeRangeText }}</span>
          <ChevronDown class="w-3.5 h-3.5 text-survey-text-muted" :class="{ 'rotate-180': showDatePicker }" />
        </button>

        <div
          v-if="showDatePicker"
          class="absolute top-full left-0 mt-2 bg-survey-surface border border-survey-border rounded-lg shadow-lg z-50 py-2 min-w-[180px]"
        >
          <button
            v-for="preset in timePresets"
            :key="preset.key"
            @click="selectPreset(preset.key, preset.days)"
            class="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-survey-surface-hover transition-colors"
            :class="selectedPreset === preset.key ? 'text-survey-primary' : 'text-survey-text-primary'"
          >
            <span>{{ preset.label }}</span>
            <Check v-if="selectedPreset === preset.key" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button class="p-2 rounded-md hover:bg-survey-surface-hover transition-colors text-survey-text-secondary hover:text-survey-text-primary">
        <RefreshCw class="w-5 h-5" />
      </button>
      <button class="p-2 rounded-md hover:bg-survey-surface-hover transition-colors text-survey-text-secondary hover:text-survey-text-primary">
        <Download class="w-5 h-5" />
      </button>
      <button class="p-2 rounded-md hover:bg-survey-surface-hover transition-colors text-survey-text-secondary hover:text-survey-text-primary">
        <Settings class="w-5 h-5" />
      </button>
    </div>

    <div
      v-if="showDatePicker"
      class="fixed inset-0 z-40"
      @click="showDatePicker = false"
    ></div>
  </header>
</template>
