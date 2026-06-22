<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-bark">毛利分析</h2>
      <div class="flex items-center gap-2">
        <input v-model="dateFrom" type="date" class="rounded-btn border border-brand/20 px-3 py-1.5 text-sm" />
        <span class="text-bark/40">至</span>
        <input v-model="dateTo" type="date" class="rounded-btn border border-brand/20 px-3 py-1.5 text-sm" />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="总收入" :value="formatCurrency(profitStore.summary?.totalRevenue ?? 0)" :icon="TrendingUp" icon-bg="bg-blue-50" icon-color="text-blue-600" />
      <StatCard label="总成本" :value="formatCurrency(profitStore.summary?.totalCost ?? 0)" :icon="Wallet" icon-bg="bg-red-50" icon-color="text-red-600" />
      <StatCard label="毛利润" :value="formatCurrency(profitStore.summary?.totalMargin ?? 0)" :icon="DollarSign" icon-bg="bg-green-50" icon-color="text-green-600" />
      <StatCard label="毛利率" :value="marginRateDisplay" :icon="Percent" icon-bg="bg-accent/10" icon-color="text-accent" />
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="card">
        <h3 class="mb-3 font-medium text-bark">收入 vs 成本</h3>
        <div class="h-64">
          <v-chart :option="barOption" autoresize />
        </div>
      </div>
      <div class="card">
        <h3 class="mb-3 font-medium text-bark">毛利率趋势</h3>
        <div class="h-64">
          <v-chart :option="lineOption" autoresize />
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="mb-3 font-medium text-bark">成本构成</h3>
      <div v-if="profitStore.summary?.costComposition" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-btn border border-brand/10 p-3">
          <div class="text-sm text-bark/60">原料成本</div>
          <div class="text-lg font-bold text-bark">{{ formatCurrency(profitStore.summary.costComposition.materialCost) }}</div>
          <div class="text-xs text-bark/40">占比 {{ profitStore.summary.costComposition.materialRate }}%</div>
        </div>
        <div class="rounded-btn border border-brand/10 p-3">
          <div class="text-sm text-bark/60">耗材成本</div>
          <div class="text-lg font-bold text-bark">{{ formatCurrency(profitStore.summary.costComposition.supplyCost) }}</div>
          <div class="text-xs text-bark/40">占比 {{ profitStore.summary.costComposition.supplyRate }}%</div>
        </div>
        <div class="rounded-btn border border-brand/10 p-3">
          <div class="text-sm text-bark/60">返工成本</div>
          <div class="text-lg font-bold text-bark">{{ formatCurrency(profitStore.summary.costComposition.reworkCost) }}</div>
          <div class="text-xs text-bark/40">占比 {{ profitStore.summary.costComposition.reworkRate }}%</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="mb-3 font-medium text-bark">批次利润明细</h3>
      <DataTable :columns="recordColumns" :data="profitStore.records" :clickable="false">
        <template #revenue="{ row }">{{ formatCurrency(row.revenue) }}</template>
        <template #cost="{ row }">{{ formatCurrency(row.cost) }}</template>
        <template #margin="{ row }">
          <span :class="row.margin >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatCurrency(row.margin) }}
          </span>
        </template>
        <template #marginRate="{ row }">{{ (row.marginRate ?? 0).toFixed(1) }}%</template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { TrendingUp, Wallet, DollarSign, Percent } from 'lucide-vue-next'
import StatCard from '@/components/common/StatCard.vue'
import DataTable from '@/components/common/DataTable.vue'
import { useProfitStore } from '@/stores/profit'
import { formatCurrency } from '@/lib/utils'

use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent])

const profitStore = useProfitStore()

const dateFrom = ref('')
const dateTo = ref('')

const marginRateDisplay = computed(() => {
  const rate = profitStore.summary?.marginRate ?? 0
  return `${rate.toFixed(1)}%`
})

const recordColumns = [
  { key: 'batchNo', label: '批次号', sortable: true },
  { key: 'recipeName', label: '配方' },
  { key: 'revenue', label: '收入', sortable: true },
  { key: 'cost', label: '成本', sortable: true },
  { key: 'margin', label: '毛利', sortable: true },
  { key: 'marginRate', label: '毛利率', sortable: true },
  { key: 'date', label: '日期' },
]

const barOption = computed(() => {
  const trend = profitStore.trend
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '成本'] },
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: trend.map((t: any) => t.date) },
    yAxis: { type: 'value' },
    series: [
      { name: '收入', type: 'bar', data: trend.map((t: any) => t.revenue), itemStyle: { color: '#8B5E3C' } },
      { name: '成本', type: 'bar', data: trend.map((t: any) => t.cost), itemStyle: { color: '#D4842A' } },
    ],
  }
})

const lineOption = computed(() => {
  const trend = profitStore.trend
  return {
    tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${(v ?? 0).toFixed(1)}%` },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: trend.map((t: any) => t.date) },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${v.toFixed(0)}%` } },
    series: [
      { type: 'line', data: trend.map((t: any) => t.marginRate ?? 0), smooth: true, itemStyle: { color: '#8B5E3C' }, areaStyle: { opacity: 0.1 } },
    ],
  }
})

const loadData = async () => {
  const params: Record<string, unknown> = {}
  if (dateFrom.value) params.dateFrom = dateFrom.value
  if (dateTo.value) params.dateTo = dateTo.value
  await Promise.all([
    profitStore.loadSummary(params),
    profitStore.loadTrend(params),
    profitStore.loadRecords(params),
  ])
}

watch([dateFrom, dateTo], () => {
  loadData()
})

onMounted(() => {
  loadData()
})
</script>
