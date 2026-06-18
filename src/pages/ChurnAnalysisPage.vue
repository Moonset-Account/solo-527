<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart, LineChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { churnApi } from '@/api'
import DataTable from '@/components/common/DataTable.vue'

use([PieChart, LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const stats = ref({ totalChurned: 0, churnRateThisMonth: 0, potentialRecalls: 0 })
const reasons = ref<{ reason: string; count: number }[]>([])
const trend = ref<{ month: string; churned: number; total: number; rate: number }[]>([])
const warnings = ref<any[]>([])

const donutOption = ref<Record<string, unknown>>({})
const trendOption = ref<Record<string, unknown>>({})

const warningColumns = [
  { key: 'leadName', label: '线索名称' },
  { key: 'riskIndicators', label: '风险指标' },
  { key: 'suggestedAction', label: '建议操作' },
  { key: 'daysSinceContact', label: '失联天数' },
]

function buildDonutOption(data: { reason: string; count: number }[]) {
  donutOption.value = {
    tooltip: { trigger: 'item' as const },
    legend: { orient: 'vertical' as const, right: 10, top: 'center', textStyle: { color: '#64748B', fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      data: data.map((d) => ({ name: d.reason, value: d.count })),
      itemStyle: { borderRadius: 4 },
      color: ['#EF4444', '#F59E0B', '#64748B', '#10B981', '#3B82F6', '#8B5CF6'],
    }],
  }
}

function buildTrendOption(data: { month: string; rate: number }[]) {
  trendOption.value = {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category' as const, data: data.map((d) => d.month), axisLabel: { color: '#64748B', fontSize: 11 } },
    yAxis: { type: 'value' as const, axisLabel: { color: '#64748B', formatter: '{value}%' } },
    series: [{
      type: 'line',
      data: data.map((d) => d.rate),
      smooth: true,
      lineStyle: { color: '#EF4444', width: 2 },
      areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.2)' }, { offset: 1, color: 'rgba(239,68,68,0)' }] } },
      itemStyle: { color: '#EF4444' },
    }],
  }
}

async function fetchData() {
  const [statsRes, reasonsRes, trendRes, warningsRes] = await Promise.all([
    churnApi.stats(),
    churnApi.reasons(),
    churnApi.trend(),
    churnApi.warnings(),
  ])
  stats.value = statsRes.data
  reasons.value = reasonsRes.data
  trend.value = trendRes.data
  warnings.value = warningsRes.data
  buildDonutOption(reasons.value)
  buildTrendOption(trend.value)
}

onMounted(fetchData)
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold text-slate-800">流失分析</h1>

    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <p class="text-sm text-slate-500">总流失数</p>
        <p class="text-2xl font-bold text-red-600 mt-1">{{ stats.totalChurned }}</p>
      </div>
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <p class="text-sm text-slate-500">本月流失率</p>
        <p class="text-2xl font-bold text-amber-600 mt-1">{{ stats.churnRateThisMonth }}%</p>
      </div>
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <p class="text-sm text-slate-500">可挽回数</p>
        <p class="text-2xl font-bold text-emerald-600 mt-1">{{ stats.potentialRecalls }}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <h3 class="font-medium text-slate-800 mb-4">流失原因分布</h3>
        <VChart v-if="reasons.length" :option="donutOption" style="height: 300px" autoresize />
        <div v-else class="text-center text-slate-400 py-8">暂无数据</div>
      </div>
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <h3 class="font-medium text-slate-800 mb-4">月度流失趋势</h3>
        <VChart v-if="trend.length" :option="trendOption" style="height: 300px" autoresize />
        <div v-else class="text-center text-slate-400 py-8">暂无数据</div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 p-5">
      <h3 class="font-medium text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-red-500 rounded-full"></span>
        流失预警
      </h3>
      <DataTable
        :columns="warningColumns"
        :data="warnings"
      >
        <template #riskIndicators="{ row }">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="ind in (row as any).riskIndicators?.slice(0, 3)"
              :key="ind"
              class="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-xs"
            >
              {{ ind }}
            </span>
          </div>
        </template>
        <template #daysSinceContact="{ row }">
          <span class="text-sm" :class="(row as any).daysSinceContact > 7 ? 'text-red-600 font-medium' : 'text-slate-600'">
            {{ (row as any).daysSinceContact }}天
          </span>
        </template>
      </DataTable>
    </div>
  </div>
</template>
