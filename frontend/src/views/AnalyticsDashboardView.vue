<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-charter text-2xl font-bold text-deep-blue-900">统计分析看板</h1>
        <p class="mt-1 text-sm text-slate-500">全维度数据洞察，监控系统运行效果</p>
      </div>
      <div class="flex items-center space-x-2">
        <NSelect v-model:value="timeRange" :options="rangeOptions" style="width: 160px" />
        <NButton>
          <NIcon size={14} class="mr-1.5"><ReloadOutlined /></NIcon>
          刷新
        </NButton>
        <NButton type="primary">
          <NIcon size={14} class="mr-1.5"><DownloadOutlined /></NIcon>
          导出报表
        </NButton>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      <StatCard
        title="总调用量（月）"
        :value="analytics.totalCalls"
        :mom="analytics.totalCallsMom"
        :icon="BarChartOutlined"
        :trend-data="analytics.callsTrend"
        icon-bg-class="bg-deep-blue-50"
        icon-color="#0B4F8C"
      />
      <StatCard
        title="AI 命中率"
        :value="analytics.hitRate"
        suffix="%"
        :show-progress="true"
        progress-hint="模型识别准确率"
        :mom="0.5"
        :icon="TargetOutlined"
        :use-gradient="true"
        icon-bg-class="bg-emerald-50"
        icon-color="#059669"
      />
      <StatCard
        title="平均单次成本"
        :value="analytics.avgCost"
        suffix="元"
        :mom="-3.2"
        :icon="WalletOutlined"
        icon-bg-class="bg-amber-gold-50"
        icon-color="#D4A853"
      />
      <StatCard
        title="驳回率"
        :value="analytics.rejectionRate"
        suffix="%"
        :mom="-8.5"
        :icon="ThunderboltOutlined"
        icon-bg-class="bg-red-50"
        icon-color="#DC2626"
      />
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <NCard class="!rounded-2xl shadow-sm xl:col-span-1" size="large">
        <template #header>
          <div class="flex items-center">
            <h3 class="font-charter font-bold text-deep-blue-900">成本拆解趋势</h3>
          </div>
        </template>
        <template #header-extra>
          <span class="text-xs text-slate-400">近 30 天</span>
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

      <NCard class="!rounded-2xl shadow-sm xl:col-span-1" size="large">
        <template #header>
          <div class="flex items-center">
            <h3 class="font-charter font-bold text-deep-blue-900">各版本命中率</h3>
          </div>
        </template>
        <template #header-extra>
          <span class="text-xs text-slate-400">横向对比</span>
        </template>
        <div class="h-72">
          <v-chart :option="versionBarOption" autoresize autoresize-root />
        </div>
      </NCard>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-5 gap-5">
      <NCard class="!rounded-2xl shadow-sm xl:col-span-3" size="large">
        <template #header>
          <div class="flex items-center">
            <h3 class="font-charter font-bold text-deep-blue-900">复核人员成本热力图</h3>
          </div>
        </template>
        <template #header-extra>
          <span class="text-xs text-slate-400">近 14 天 · 单位：元</span>
        </template>
        <div class="h-72">
          <v-chart :option="heatmapOption" autoresize autoresize-root />
        </div>
      </NCard>

      <NCard class="!rounded-2xl shadow-sm xl:col-span-2" size="large">
        <template #header>
          <div class="flex items-center">
            <h3 class="font-charter font-bold text-deep-blue-900">TOP 5 驳回原因</h3>
          </div>
        </template>
        <template #header-extra>
          <span class="text-xs text-slate-400">气泡散点图</span>
        </template>
        <div class="h-72">
          <v-chart :option="scatterOption" autoresize autoresize-root />
        </div>
      </NCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NCard, NButton, NIcon, NSelect, NTag, type SelectOption
} from 'naive-ui'
import {
  BarChartOutlined, TargetOutlined, WalletOutlined, ThunderboltOutlined,
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

const costStackArea = computed(() =>
  analytics.buildCostStackAreaData(analytics.data.value.dailyStats, analytics.data.value.costStats)
)
const costStackOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } } },
  legend: {
    data: ['已通过', '已驳回', 'Token消耗'],
    bottom: 0, textStyle: { fontSize: 11, color: '#64748b' }
  },
  grid: { left: '3%', right: '3%', top: 20, bottom: 40, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: costStackArea.value.dates.map((d: string) => d.slice(5)),
    axisLabel: { color: '#94a3b8', fontSize: 10 }
  },
  yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 10 } },
  series: [
    {
      name: '已通过',
      type: 'line',
      stack: 'Total',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 0 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(5,150,105,0.7)' },
            { offset: 1, color: 'rgba(5,150,105,0.05)' }
          ] }
      },
      emphasis: { focus: 'series' },
      data: costStackArea.value.approved
    },
    {
      name: '已驳回',
      type: 'line',
      stack: 'Total',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 0 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(220,38,38,0.55)' },
            { offset: 1, color: 'rgba(220,38,38,0.05)' }
          ] }
      },
      data: costStackArea.value.rejected
    },
    {
      name: 'Token消耗',
      type: 'line',
      stack: 'Total2',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2, color: '#0B4F8C' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(11,79,140,0.35)' },
            { offset: 1, color: 'rgba(11,79,140,0.02)' }
          ] }
      },
      data: costStackArea.value.used
    }
  ]
}))

const rejectPie = computed(() => analytics.buildRejectReasonPieData())
const rejectPieOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: {
    orient: 'horizontal',
    bottom: 0,
    textStyle: { fontSize: 10, color: '#64748b' },
    itemWidth: 10, itemHeight: 10
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
      data: rejectPie.value
    }
  ]
}))

const versionBar = computed(() => analytics.buildVersionHitBarData())
const versionBarOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}%' },
  grid: { left: '3%', right: '3%', top: 20, bottom: 30, containLabel: true },
  xAxis: {
    type: 'category',
    data: versionBar.value.versions,
    axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 0 }
  },
  yAxis: {
    type: 'value',
    min: 60,
    max: 100,
    axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' },
    splitLine: { lineStyle: { color: '#f1f5f9' } }
  },
  series: [
    {
      name: '命中率',
      type: 'bar',
      barWidth: 28,
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#0B4F8C' },
            { offset: 1, color: '#72A5D5' }
          ]
        }
      },
      emphasis: {
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#D4A853' },
              { offset: 1, color: '#EFDAB3' }
            ]
          }
        }
      },
      label: {
        show: true, position: 'top', formatter: '{c}%',
        color: '#0B4F8C', fontSize: 11, fontWeight: 'bold'
      },
      data: versionBar.value.rates
    }
  ]
}))

const heatmapData = computed(() => analytics.buildCostHeatmapData())
const heatmapOption = computed(() => ({
  tooltip: {
    position: 'top',
    formatter: (params: any) => `${heatmapData.value.persons[params.value[1]]} · ${heatmapData.value.days[params.value[0]]}<br/>成本：<b>¥${params.value[2]}</b>`
  },
  grid: { left: '12%', right: '3%', top: 30, bottom: '10%' },
  xAxis: {
    type: 'category',
    data: heatmapData.value.days,
    axisLabel: { color: '#94a3b8', fontSize: 10 },
    splitArea: { show: true }
  },
  yAxis: {
    type: 'category',
    data: heatmapData.value.persons,
    axisLabel: { color: '#64748b', fontSize: 11 },
    splitArea: { show: true }
  },
  visualMap: {
    min: 0,
    max: 18,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: 0,
    textStyle: { fontSize: 10, color: '#64748b' },
    inRange: {
      color: ['#E8F0F8', '#72A5D5', '#0B4F8C', '#D4A853']
    },
    itemWidth: 12, itemHeight: 120
  },
  series: [
    {
      name: '成本',
      type: 'heatmap',
      data: heatmapData.value.data,
      label: {
        show: true, fontSize: 10, color: '#0f172a',
        formatter: (p: any) => p.value[2]
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }
  ]
}))

const scatterData = computed(() => analytics.buildRejectScatterData())
const scatterOption = computed(() => ({
  tooltip: {
    formatter: (params: any) => {
      return `<b>${params.name}</b><br/>发生次数：${params.value[0]}<br/>严重程度：${params.value[1]}/10<br/>累计影响：${params.value[2]}`
    }
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
    name: '严重程度',
    nameTextStyle: { color: '#94a3b8', fontSize: 10 },
    axisLabel: { color: '#94a3b8', fontSize: 10 },
    min: 0, max: 10
  },
  series: [
    {
      symbolSize: (data: number[]) => Math.sqrt(data[2]) * 2.2,
      type: 'scatter',
      data: scatterData.value,
      label: {
        show: true, formatter: '{b}', position: 'top',
        fontSize: 10, color: '#475569'
      },
      itemStyle: {
        color: (params: any) => {
          const severity = params.value[1]
          if (severity >= 8) return 'rgba(220,38,38,0.7)'
          if (severity >= 6) return 'rgba(212,168,83,0.75)'
          return 'rgba(11,79,140,0.7)'
        },
        shadowBlur: 10,
        shadowColor: 'rgba(11,79,140,0.3)'
      },
      emphasis: { scale: 1.15 }
    }
  ]
}))
</script>
