<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ComparisonChart from '@/components/ComparisonChart.vue'
import { useFilterStore } from '@/stores/filter'
import { fetchBatches } from '@/services/api'
import { POND_NAMES, METRIC_LABELS, type MetricType } from '@/types'

const filterStore = useFilterStore()

const currentMetric = ref<MetricType>('dissolved_oxygen')
const batches = ref<any[]>([])

onMounted(async () => {
  batches.value = await fetchBatches()
})

const activeBatches = computed(() => batches.value.filter(b => b.status === 'active'))

function toggleBatch(batchId: string) {
  filterStore.toggleBatch(batchId)
}
</script>

<template>
  <div class="h-full flex flex-col p-6 overflow-hidden">
    <div class="flex items-center gap-6 mb-4">
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-400 shrink-0">选择批次</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="batch in activeBatches"
            :key="batch.id"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
            :class="filterStore.selectedBatches.includes(batch.id)
              ? 'bg-[#00B4D8]/20 text-[#00B4D8] border-[#00B4D8]/30'
              : 'bg-[#0A2E36] text-gray-500 border-[#0D3B47] hover:text-gray-300 hover:border-gray-600'"
            @click="toggleBatch(batch.id)"
          >
            {{ batch.batch_name }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-400 shrink-0">指标</label>
        <select
          v-model="currentMetric"
          class="bg-[#0A2E36] border border-[#0D3B47] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#00B4D8]/50"
        >
          <option v-for="m in filterStore.allMetrics" :key="m" :value="m">
            {{ METRIC_LABELS[m] }}
          </option>
        </select>
      </div>
    </div>

    <div class="flex-1 bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-4 min-h-0">
      <ComparisonChart
        :batch-ids="filterStore.selectedBatches"
        :metric="currentMetric"
      />
    </div>
  </div>
</template>
