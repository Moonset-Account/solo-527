<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useFilterStore } from '@/stores/filter'
import { Calendar, RefreshCw, Download, Settings } from 'lucide-vue-next'

const route = useRoute()
const filterStore = useFilterStore()

const showDatePicker = ref(false)

const pageTitle = computed(() => (route.meta?.title as string) || '样本质量监控')

const timeRangeText = computed(() => {
  const { start, end } = filterStore.timeRange
  return `${start} ~ ${end}`
})
</script>

<template>
  <header class="h-16 bg-survey-surface border-b border-survey-border flex items-center justify-between px-6">
    <div class="flex items-center gap-4">
      <h2 class="text-lg font-semibold text-survey-text-primary">{{ pageTitle }}</h2>
      <div class="flex items-center gap-2 px-3 py-1.5 bg-survey-bg rounded-md border border-survey-border cursor-pointer hover:border-survey-primary/50 transition-colors">
        <Calendar class="w-4 h-4 text-survey-text-muted" />
        <span class="text-sm text-survey-text-secondary">{{ timeRangeText }}</span>
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
  </header>
</template>
