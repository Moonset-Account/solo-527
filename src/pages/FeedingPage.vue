<script setup lang="ts">
import { ref, computed } from 'vue'
import FeedingChart from '@/components/FeedingChart.vue'
import { useFilterStore } from '@/stores/filter'
import { mockFeedingRecords, mockBatches } from '@/mock/data'
import { POND_NAMES } from '@/types'

const filterStore = useFilterStore()

const selectedPond = ref('pond-1')

const pondRecords = computed(() =>
  mockFeedingRecords
    .filter(r => r.pondId === selectedPond.value)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
)

function formatTime(iso: string) {
  const d = new Date(iso)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}-${day} ${h}:${min}`
}
</script>

<template>
  <div class="h-full flex flex-col p-6 overflow-hidden">
    <div class="flex items-center gap-4 mb-4">
      <label class="text-sm text-gray-400">选择塘口</label>
      <select
        v-model="selectedPond"
        class="bg-[#0A2E36] border border-[#0D3B47] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#00B4D8]/50"
      >
        <option v-for="pondId in filterStore.allPonds" :key="pondId" :value="pondId">
          {{ POND_NAMES[pondId] }}
        </option>
      </select>
    </div>

    <div class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-4 mb-4" style="height: 400px;">
      <FeedingChart :pond-id="selectedPond" />
    </div>

    <div class="flex-1 bg-[#0A2E36] rounded-xl border border-[#0D3B47] overflow-hidden">
      <div class="px-4 py-3 border-b border-[#0D3B47]">
        <h3 class="text-sm font-medium text-gray-200">投喂记录</h3>
      </div>
      <div class="overflow-y-auto max-h-[calc(100%-48px)]">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-xs text-gray-500 border-b border-[#0D3B47]">
              <th class="text-left px-4 py-2 font-medium">时间</th>
              <th class="text-left px-4 py-2 font-medium">投喂量(kg)</th>
              <th class="text-left px-4 py-2 font-medium">饲料类型</th>
              <th class="text-left px-4 py-2 font-medium">策略变更</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="record in pondRecords"
              :key="record.id"
              class="border-b border-[#0D3B47]/50 hover:bg-[#0D3B47]/30 transition-colors"
              :class="{ 'border-l-2 border-l-purple-500': record.strategyChange }"
            >
              <td class="px-4 py-2.5 text-gray-300">{{ formatTime(record.timestamp) }}</td>
              <td class="px-4 py-2.5 text-gray-300">{{ record.amount }}</td>
              <td class="px-4 py-2.5 text-gray-300">{{ record.feedType }}</td>
              <td class="px-4 py-2.5">
                <span v-if="record.strategyChange" class="relative group">
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400 cursor-help">
                    变更
                  </span>
                  <span
                    class="absolute left-0 bottom-full mb-2 px-2 py-1 rounded text-xs text-gray-200 bg-[#0D3B47] border border-purple-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                  >
                    {{ record.strategyNote }}
                  </span>
                </span>
                <span v-else class="text-gray-600">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
