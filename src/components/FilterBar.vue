<script setup lang="ts">
import { computed } from 'vue'
import { useFilterStore } from '@/stores/filter'
import { POND_NAMES, METRIC_LABELS, POND_LIST, type MetricType } from '@/types'
import { Fish, Thermometer, Droplets, Clock } from 'lucide-vue-next'

const filterStore = useFilterStore()

const timeRangeLabel = computed(() => {
  const [start, end] = filterStore.timeRange
  const fmt = (iso: string) => {
    const d = new Date(iso)
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${m}-${day} ${h}:${min}`
  }
  return `${fmt(start)} 至 ${fmt(end)}`
})

const metricIcons: Record<MetricType, typeof Droplets> = {
  dissolved_oxygen: Droplets,
  temperature: Thermometer,
  ph: Fish,
}

function isPondSelected(pondId: string) {
  return filterStore.selectedPonds.includes(pondId)
}

function isMetricSelected(metric: MetricType) {
  return filterStore.selectedMetrics.includes(metric)
}
</script>

<template>
  <div class="bg-[#0D3B47] border-b border-[#0A2E36] px-4 py-3 shrink-0">
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2 bg-[#0A2E36] rounded-lg px-3 py-2">
        <Fish class="w-4 h-4 text-[#00B4D8] shrink-0" />
        <span class="text-xs text-gray-400 mr-2 shrink-0">塘口</span>
        <div class="flex items-center gap-2">
          <label
            v-for="pondId in POND_LIST"
            :key="pondId"
            class="flex items-center gap-1 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              :checked="isPondSelected(pondId)"
              class="accent-[#00B4D8] w-3.5 h-3.5"
              @change="filterStore.togglePond(pondId)"
            />
            <span class="text-xs" :class="isPondSelected(pondId) ? 'text-gray-200' : 'text-gray-500'">
              {{ POND_NAMES[pondId] }}
            </span>
          </label>
        </div>
      </div>

      <div class="flex items-center gap-2 bg-[#0A2E36] rounded-lg px-3 py-2">
        <Droplets class="w-4 h-4 text-[#00B4D8] shrink-0" />
        <span class="text-xs text-gray-400 mr-2 shrink-0">指标</span>
        <div class="flex items-center gap-2">
          <label
            v-for="metric in filterStore.allMetrics"
            :key="metric"
            class="flex items-center gap-1 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              :checked="isMetricSelected(metric)"
              class="accent-[#00B4D8] w-3.5 h-3.5"
              @change="filterStore.toggleMetric(metric)"
            />
            <component :is="metricIcons[metric]" class="w-3 h-3" :class="isMetricSelected(metric) ? 'text-gray-200' : 'text-gray-500'" />
            <span class="text-xs" :class="isMetricSelected(metric) ? 'text-gray-200' : 'text-gray-500'">
              {{ METRIC_LABELS[metric] }}
            </span>
          </label>
        </div>
      </div>

      <div class="flex items-center gap-2 bg-[#0A2E36] rounded-lg px-3 py-2">
        <Clock class="w-4 h-4 text-[#00B4D8] shrink-0" />
        <span class="text-xs text-gray-300">{{ timeRangeLabel }}</span>
      </div>
    </div>
  </div>
</template>
