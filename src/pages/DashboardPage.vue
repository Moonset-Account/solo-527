<script setup lang="ts">
import { ref, computed } from 'vue'
import AlertBanner from '@/components/AlertBanner.vue'
import RealtimeChart from '@/components/RealtimeChart.vue'
import DeviceStatus from '@/components/DeviceStatus.vue'
import DrilldownPanel from '@/components/DrilldownPanel.vue'
import { useFilterStore } from '@/stores/filter'
import { useAlertStore } from '@/stores/alerts'
import type { SensorReading, MetricType } from '@/types'
import { POND_NAMES, METRIC_LABELS } from '@/types'

const filterStore = useFilterStore()
const alertStore = useAlertStore()

const selectedReadingId = ref<string | null>(null)

const chartCombos = computed(() => {
  const combos: { pondId: string; metric: MetricType }[] = []
  for (const pondId of filterStore.selectedPonds) {
    for (const metric of filterStore.selectedMetrics) {
      combos.push({ pondId, metric })
    }
  }
  return combos
})

function handlePointClick(reading: SensorReading) {
  selectedReadingId.value = reading.id
}

function handleDrilldownClose() {
  selectedReadingId.value = null
}
</script>

<template>
  <div class="flex flex-col h-full">
    <AlertBanner />

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 p-4 overflow-y-auto">
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div
            v-for="combo in chartCombos"
            :key="`${combo.pondId}-${combo.metric}`"
            class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-3"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-medium text-[#00B4D8]">
                {{ POND_NAMES[combo.pondId] }}
              </span>
              <span class="text-xs text-gray-500">|</span>
              <span class="text-xs text-gray-400">
                {{ METRIC_LABELS[combo.metric as keyof typeof METRIC_LABELS] }}
              </span>
            </div>
            <div class="h-64">
              <RealtimeChart
                :pond-id="combo.pondId"
                :metric="combo.metric"
                @point-click="handlePointClick"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="w-80 border-l border-[#0D3B47] p-4 overflow-y-auto shrink-0">
        <DeviceStatus />
      </div>
    </div>

    <DrilldownPanel
      :reading-id="selectedReadingId"
      @close="handleDrilldownClose"
    />
  </div>
</template>
