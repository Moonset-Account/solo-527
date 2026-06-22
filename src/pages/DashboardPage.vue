<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="总批次" :value="profitStore.summary?.totalBatchCount ?? 0" :icon="Package" icon-bg="bg-blue-50" icon-color="text-blue-600" />
      <StatCard label="毛利率" :value="marginRateDisplay" :icon="TrendingUp" icon-bg="bg-green-50" icon-color="text-green-600" />
      <StatCard label="毛利额" :value="formatCurrency(profitStore.summary?.totalMargin ?? 0)" :icon="DollarSign" icon-bg="bg-amber-50" icon-color="text-amber-600" />
      <StatCard label="异常数" :value="anomalyStore.list.length" :icon="AlertCircle" icon-bg="bg-accent/10" icon-color="text-accent" />
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="card">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-medium text-bark">成本异常警报</h3>
          <button
            class="rounded-btn bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
            :disabled="detecting"
            @click="handleDetect"
          >
            {{ detecting ? '检测中...' : '异常检测' }}
          </button>
        </div>
        <div v-if="anomalyStore.list.length === 0" class="text-sm text-bark/40">暂无异常</div>
        <div v-else class="space-y-2">
          <div
            v-for="a in anomalyStore.list.slice(0, 5)"
            :key="a._id"
            class="flex items-center justify-between rounded-btn border border-red-200 bg-red-50/50 p-3"
          >
            <div class="flex items-center gap-2">
              <StatusBadge :status="a.severity" />
              <span class="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                {{ typeLabelMap[a.type] ?? a.type }}
              </span>
              <span class="text-sm text-bark">{{ a.description }}</span>
            </div>
            <router-link :to="`/anomalies/${a._id}`" class="text-xs text-accent hover:underline">
              查看
            </router-link>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-3 font-medium text-bark">今日排产</h3>
        <DataTable
          :columns="scheduleColumns"
          :data="todaySchedules"
        >
          <template #batches="{ row }">
            <div class="space-y-1">
              <div v-for="b in row.batches" :key="b.batchId" class="text-xs">
                <span class="font-medium text-bark">{{ b.recipeName }}</span>
                <span class="ml-1 text-bark/60">{{ b.plannedQty }}{{ b.unit }}</span>
              </div>
            </div>
          </template>
          <template #status="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </DataTable>
      </div>
    </div>

    <div class="card">
      <h3 class="mb-3 font-medium text-bark">毛利趋势（近30天）</h3>
      <div class="h-72">
        <v-chart :option="chartOption" autoresize />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { Package, TrendingUp, DollarSign, AlertCircle } from 'lucide-vue-next'
import StatCard from '@/components/common/StatCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DataTable from '@/components/common/DataTable.vue'
import { useAnomalyStore } from '@/stores/anomaly'
import { useScheduleStore } from '@/stores/schedule'
import { useProfitStore } from '@/stores/profit'
import { formatCurrency } from '@/lib/utils'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const anomalyStore = useAnomalyStore()
const scheduleStore = useScheduleStore()
const profitStore = useProfitStore()

const detecting = ref(false)

const typeLabelMap: Record<string, string> = {
  cost_spike: '成本飙升',
  low_stock: '低库存',
  high_scrap: '高报损',
  over_cost: '成本超支',
  frequent_rework: '频繁返工',
  budget_exceeded: '超预算',
}

const marginRateDisplay = computed(() => {
  const rate = profitStore.summary?.marginRate
  return rate != null ? `${(rate * 100).toFixed(1)}%` : '0%'
})

const todaySchedules = computed(() => scheduleStore.list)

const scheduleColumns = [
  { key: 'date', label: '日期' },
  { key: 'teamName', label: '班组' },
  { key: 'batches', label: '排产批次' },
  { key: 'status', label: '状态' },
]

const chartOption = computed(() => {
  const trend = profitStore.trend
  const dates = trend.map((t: any) => t.date)
  const revenues = trend.map((t: any) => t.revenue)
  const costs = trend.map((t: any) => t.cost)
  const margins = trend.map((t: any) => t.margin)
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '成本', '毛利'] },
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value' },
    series: [
      { name: '收入', type: 'line', data: revenues, smooth: true, itemStyle: { color: '#8B5E3C' } },
      { name: '成本', type: 'line', data: costs, smooth: true, itemStyle: { color: '#D4842A' } },
      { name: '毛利', type: 'line', data: margins, smooth: true, itemStyle: { color: '#4CAF50' } },
    ],
  }
})

const handleDetect = async () => {
  detecting.value = true
  try {
    await anomalyStore.detect()
  } finally {
    detecting.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      anomalyStore.loadList({ status: 'open' }),
      scheduleStore.loadList(),
      profitStore.loadTrend(),
      profitStore.loadSummary(),
    ])
  } catch {}
})
</script>
