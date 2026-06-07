import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MetricType, FilterState } from '@/types'
import { POND_LIST } from '@/types'

const now = new Date()
const DAY = 86400000

function formatTs(d: Date): string {
  return d.toISOString()
}

export const useFilterStore = defineStore('filter', () => {
  const timeRange = ref<[string, string]>([
    formatTs(new Date(now.getTime() - DAY)),
    formatTs(now),
  ])
  const selectedPonds = ref<string[]>(['pond-1', 'pond-2'])
  const selectedMetrics = ref<MetricType[]>(['dissolved_oxygen', 'temperature', 'ph'])
  const selectedBatches = ref<string[]>(['batch-1', 'batch-2'])

  const allPonds = POND_LIST
  const allMetrics: MetricType[] = ['dissolved_oxygen', 'temperature', 'ph']

  function setTimeRange(range: [string, string]) {
    timeRange.value = range
  }

  function togglePond(pondId: string) {
    const idx = selectedPonds.value.indexOf(pondId)
    if (idx >= 0) {
      selectedPonds.value = selectedPonds.value.filter(p => p !== pondId)
    } else {
      selectedPonds.value = [...selectedPonds.value, pondId]
    }
  }

  function toggleMetric(metric: MetricType) {
    const idx = selectedMetrics.value.indexOf(metric)
    if (idx >= 0) {
      selectedMetrics.value = selectedMetrics.value.filter(m => m !== metric)
    } else {
      selectedMetrics.value = [...selectedMetrics.value, metric]
    }
  }

  function toggleBatch(batchId: string) {
    const idx = selectedBatches.value.indexOf(batchId)
    if (idx >= 0) {
      selectedBatches.value = selectedBatches.value.filter(b => b !== batchId)
    } else {
      selectedBatches.value = [...selectedBatches.value, batchId]
    }
  }

  function setSelectedPonds(ponds: string[]) {
    selectedPonds.value = ponds
  }

  function setSelectedBatches(batches: string[]) {
    selectedBatches.value = batches
  }

  return {
    timeRange,
    selectedPonds,
    selectedMetrics,
    selectedBatches,
    allPonds,
    allMetrics,
    setTimeRange,
    togglePond,
    toggleMetric,
    toggleBatch,
    setSelectedPonds,
    setSelectedBatches,
  }
})
