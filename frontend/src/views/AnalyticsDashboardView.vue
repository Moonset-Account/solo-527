<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-charter text-2xl font-bold text-deep-blue-900">统计分析看板</h1>
        <p class="mt-1 text-sm text-slate-500">全维度数据洞察，监控系统运行效果</p>
      </div>
      <div class="flex items-center space-x-2">
        <NSelect v-model:value="timeRange" :options="rangeOptions" style="width: 160px" />
        <NButton @click="handleRefresh" :loading="isAnyLoading">
          <NIcon :size="14" class="mr-1.5"><ReloadOutlined /></NIcon>
          刷新
        </NButton>
        <NButton type="primary">
          <NIcon :size="14" class="mr-1.5"><DownloadOutlined /></NIcon>
          导出报表
        </NButton>
      </div>
    </div>

    <div v-if="isAnyLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
      <NSkeleton v-for="i in 5" :key="i" :rounded="true" class="!rounded-2xl !h-32" />
    </div>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        <StatCard
          v-for="card in analytics.summaryCardList"
          :key="card.key"
          :title="card.title"
          :value="card.value"
          :suffix="card.unit"
          :mom="card.mom"
          :trend="card.trend"
          :description="card.description"
          :icon="BarChartOutlined"
          :trend-data="analytics.miniTrendData"
          :icon-bg-class="card.iconBgClass || 'bg-deep-blue-50'"
          :icon-color="card.color"
        />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <NCard class="!rounded-2xl shadow-sm xl:col-span-2" size="large">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <h3 class="font-charter font-bold text-deep-blue-900">成本拆解趋势</h3>
              </div>
              <div class="flex items-center space-x-2">
                <NButton
                  v-for="dim in dimensions"
                  :key="dim.key"
                  :type="analytics.filters.costDimension === dim.key ? 'primary' : 'default'"
                  size="small"
                  @click="analytics.setCostDimension(dim.key)"
                >
                  {{ dim.label }}
                </NButton>
              </div>
            </div>
          </template>
          <template #header-extra>
            <span class="text-xs text-slate-400">近 30 天 · {{ analytics.costBreakdown.dimensionLabel }}</span>
          </template>
          <div class="h-72">
            <v-chart :option="costStackOption" autoresize autoresize-root />
          </div>
        </NCard>

        <NCard class="!rounded-2xl shadow-sm xl:col-span-1" size="large">
          <template #header>
            <div class="flex items-center">
              <h3 class="font-charter font-bold text-deep-blue-900">驳回原因分布</h3>
            </div>
          </template>
          <template #header-extra>
            <NTag type="warning" size="small" :bordered="false" round>南丁格尔玫瑰图</NTag>
          </template>
          <div class="h-72">
            <v-chart :option="rejectPieOption" autoresize autoresize-root />
          </div>
        </NCard>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <NCard class="!rounded-2xl shadow-sm xl:col-span-3" size="large">
          <template #header>
            <div class="flex items-center">
              <h3 class="font-charter font-bold text-deep-blue-900">{{ analytics.costHeatmapData.title || '成本分布热力图' }}</h3>
            </div>
          </template>
          <template #header-extra>
            <span class="text-xs text-slate-400">近 14 天 · 单位：USD</span>
          </template>
          <div class="h-72">
            <v-chart :option="heatmapOption" autoresize autoresize-root />
          </div>
        </NCard>

        <NCard class="!rounded-2xl shadow-sm xl:col-span-2" size="large">
          <template #header>
            <div class="flex items-center">
              <h3 class="font-charter font-bold text-deep-blue-900">驳回原因散点图</h3>
            </div>
          </template>
          <template #header-extra>
            <span class="text-xs text-slate-400">气泡大小 = 累计成本影响</span>
          </template>
          <div class="h-72">
            <v-chart :option="scatterOption" autoresize autoresize-root />
          </div>
        </NCard>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <NCard class="!rounded-2xl shadow-sm" size="large">
          <template #header>
            <div class="flex items-center">
              <h3 class="font-charter font-bold text-deep-blue-900">话术版本效果</h3>
            </div>
          </template>
          <div class="h-72 overflow-auto">
            <table class="w-full text-sm">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                <tr>
                  <th class="px-3 py-2 text-left">版本</th>
                  <th class="px-3 py-2 text-left">名称</th>
                  <th class="px-3 py-2 text-right">调用量</th>
                  <th class="px-3 py-2 text-right">命中率</th>
                  <th class="px-3 py-2 text-right">平均成本</th>
                  <th class="px-3 py-2 text-right">总成本</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="row in analytics.versionTableData.items" :key="row.id" class="hover:bg-slate-50">
                  <td class="px-3 py-2 font-mono text-xs text-deep-blue-600">{{ row.version }}</td>
                  <td class="px-3 py-2 text-slate-700">{{ row.name || '-' }}</td>
                  <td class="px-3 py-2 text-right font-medium">{{ row.totalCalls }}</td>
                  <td class="px-3 py-2 text-right" :class="row.hitRate >= 80 ? 'text-emerald-600' : row.hitRate >= 60 ? 'text-amber-600' : 'text-red-600'">
                    {{ row.hitRate.toFixed(1) }}%
                  </td>
                  <td class="px-3 py-2 text-right text-slate-600">${{ row.avgCost.toFixed(3) }}</td>
                  <td class="px-3 py-2 text-right font-medium text-deep-blue-700">${{ row.totalCost.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </NCard>

        <NCard class="!rounded-2xl shadow-sm" size="large">
          <template #header>
            <div class="flex items-center">
              <h3 class="font-charter font-bold text-deep-blue-900">提示词版本效果</h3>
            </div>
          </template>
          <div class="h-72 overflow-auto">
            <table class="w-full text-sm">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                <tr>
                  <th class="px-3 py-2 text-left">版本</th>
                  <th class="px-3 py-2 text-left">名称</th>
                  <th class="px-3 py-2 text-right">调用量</th>
                  <th class="px-3 py-2 text-right">命中率</th>
                  <th class="px-3 py-2 text-right">平均成本</th>
                  <th class="px-3 py-2 text-right">总成本</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="row in analytics.promptVersionTableData.items" :key="row.id" class="hover:bg-slate-50">
                  <td class="px-3 py-2 font-mono text-xs text-purple-600">{{ row.version }}</td>
                  <td class="px-3 py-2 text-slate-700">{{ row.name || '-' }}</td>
                  <td class="px-3 py-2 text-right font-medium">{{ row.totalCalls }}</td>
                  <td class="px-3 py-2 text-right" :class="row.hitRate >= 80 ? 'text-emerald-600' : row.hitRate >= 60 ? 'text-amber-600' : 'text-red-600'">
                    {{ row.hitRate.toFixed(1) }}%
                  </td>
                  <td class="px-3 py-2 text-right text-slate-600">${{ row.avgCost.toFixed(3) }}</td>
                  <td class="px-3 py-2 text-right font-medium text-purple-700">${{ row.totalCost.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </NCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NCard, NButton, NIcon, NSelect, NTag, NSkeleton, type SelectOption
} from 'naive-ui'
import {
  BarChartOutlined, DashboardOutlined, WalletOutlined, ThunderboltOutlined,
  ReloadOutlined, DownloadOutlined
} from '@vicons/antd'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  BarChart, LineChart, PieChart, HeatmapChart, ScatterChart
} from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent, VisualMapComponent,
  DatasetComponent
} from 'echarts/components'
import StatCard from '@/components/business/StatCard.vue'
import { useAnalytics } from '@/composables/useAnalytics'
import { usePageTitle } from '@/composables/usePageTitle'
import type { CostDimension } from '@/types'

use([
  CanvasRenderer,
  BarChart, LineChart, PieChart, HeatmapChart, ScatterChart,
  GridComponent, TooltipComponent, LegendComponent, VisualMapComponent, DatasetComponent
])

usePageTitle('统计分析看板')

const analytics = useAnalytics()

const timeRange = ref('30d')
const rangeOptions: SelectOption[] = [
  { label: '近 7 天', value: '7d' },
  { label: '近 30 天', value: '30d' },
  { label: '本季度', value: 'q' },
  { label: '本年度', value: 'y' }
]

const dimensions: Array<{ key: CostDimension; label: string }> = [
  { key: 'date', label: '按日期' },
  { key: 'user', label: '按销售' },
  { key: 'reviewer', label: '按复核员' },
  { key: 'reason', label: '按驳回原因' },
]

const isAnyLoading = computed(() => {
  return Object.values(analytics.loading).some(Boolean)
})

function computeDateRange(range: string): { startDate?: string; endDate?: string } {
  const end = new Date()
  const start = new Date()
  switch (range) {
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case 'q':
      start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1)
      break
    case 'y':
      start.setMonth(0, 1)
      break
    default:
      start.setDate(start.getDate() - 30)
  }
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  }
}

function handleRefresh() {
  const { startDate, endDate } = computeDateRange(timeRange.value)
  analytics.setDateRange(startDate, endDate)
}

watch(timeRange, (val) => {
  const { startDate, endDate } = computeDateRange(val)
  analytics.setDateRange(startDate, endDate)
})

const costStackOption = computed(() => {
  const data = analytics.costStackAreaData
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } } },
    legend: {
      data: data.legendData || [],
      bottom: 0,
      textStyle: { fontSize: 11, color: '#64748b' }
    },
    grid: { left: '3%', right: '3%', top: 20, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.xData || [],
      axisLabel: { color: '#94a3b8', fontSize: 10 }
    },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '${value}' } },
    series: data.seriesData || []
  }
})

const rejectPieOption = computed(() => {
  const data = analytics.rejectBarData
  const items = data.items || []
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { fontSize: 10, color: '#64748b' },
      itemWidth: 10,
      itemHeight: 10
    },
    color: ['#0B4F8C', '#1469B9', '#D4A853', '#DC2626', '#F59E0B', '#94A3B8'],
    series: [
      {
        name: '驳回原因',
        type: 'pie',
        radius: [30, 110],
        center: ['50%', '45%'],
        roseType: 'area',
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 10, color: '#475569' },
        labelLine: { length: 8, length2: 6 },
        data: items.map((i: any) => ({
          name: i.name || i.code,
          value: i.count,
          percentage: i.percentage,
        }))
      }
    ]
  }
})

const heatmapOption = computed(() => {
  const data = analytics.costHeatmapData
  return {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const yLabel = (data.yData || [])[params.value[1]] || ''
        const xLabel = (data.xData || [])[params.value[0]] || ''
        return `${yLabel} · ${xLabel}<br/>成本：<b>$${params.value[2].toFixed(3)}</b>`
      }
    },
    grid: { left: '15%', right: '3%', top: 30, bottom: '15%' },
    xAxis: {
      type: 'category',
      data: data.xData || [],
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: data.yData || [],
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: data.max || 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { fontSize: 10, color: '#64748b' },
      inRange: {
        color: ['#E8F0F8', '#72A5D5', '#0B4F8C', '#D4A853']
      },
      itemWidth: 12,
      itemHeight: 120
    },
    series: [
      {
        name: '成本',
        type: 'heatmap',
        data: data.data || [],
        label: {
          show: true,
          fontSize: 10,
          color: '#0f172a',
          formatter: (p: any) => p.value[2].toFixed(2)
        },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
      }
    ]
  }
})

const scatterOption = computed(() => {
  const data = analytics.rejectScatterData
  return {
    tooltip: {
      formatter: (params: any) => {
        const name = params.name || (data.items || [])[params.dataIndex]?.name || ''
        const category = (data.items || [])[params.dataIndex]?.category || ''
        return `<b>${name}</b><br/>分类：${category}<br/>发生次数：${params.value[0]}<br/>占比：${params.value[1]}%<br/>累计成本：$${params.value[2]}`
      }
    },
    legend: {
      data: data.legendData || [],
      top: 0,
      textStyle: { fontSize: 10, color: '#64748b' },
    },
    grid: { left: '8%', right: '3%', top: 30, bottom: '15%' },
    xAxis: {
      type: 'value',
      name: '发生次数',
      nameTextStyle: { color: '#94a3b8', fontSize: 10 },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    yAxis: {
      type: 'value',
      name: '占比 (%)',
      nameTextStyle: { color: '#94a3b8', fontSize: 10 },
      axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' },
      min: 0,
      max: Math.max(20, data.maxY || 0)
    },
    series: data.series || []
  }
})

analytics.loadAll()
</script>
