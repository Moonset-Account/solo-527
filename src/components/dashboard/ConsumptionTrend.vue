<script setup lang="ts">
import { ref, computed } from 'vue'
import { TrendingUp } from 'lucide-vue-next'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useDashboardStore } from '@/stores/dashboard'

use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer])

const dashboardStore = useDashboardStore()
const range = ref<'7d' | '30d'>('7d')

const chartOption = computed(() => {
  const trend = range.value === '7d'
    ? dashboardStore.data?.consumptionTrend7d || []
    : dashboardStore.data?.consumptionTrend30d || []
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#B76E7930',
      textStyle: { color: '#666', fontSize: 12 },
      formatter: (params: any) => `${params[0].axisValue}<br/>消耗金额: ¥${params[0].value.toLocaleString()}`,
    },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: trend.map((t) => t.date),
      axisLine: { lineStyle: { color: '#B76E7920' } },
      axisLabel: { color: '#9E8A8F', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#B76E7910' } },
      axisLabel: { color: '#9E8A8F', fontSize: 11, formatter: (v: number) => `¥${v}` },
    },
    series: [{
      type: 'line',
      data: trend.map((t) => t.amount),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#B76E79', width: 2 },
      itemStyle: { color: '#B76E79' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#B76E7920' },
            { offset: 1, color: '#B76E7905' },
          ],
        },
      },
    }],
  }
})
</script>

<template>
  <div class="bg-white rounded-xl border border-rosegold/10 p-5">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <TrendingUp class="w-5 h-5 text-rosegold" />
        <h3 class="text-sm font-medium text-gray-800">消耗趋势</h3>
      </div>
      <div class="flex items-center bg-warmwhite rounded-lg p-0.5">
        <button
          :class="['px-3 py-1 text-xs rounded-md transition-colors', range === '7d' ? 'bg-rosegold text-white' : 'text-grayrose hover:text-rosegold']"
          @click="range = '7d'"
        >
          近7天
        </button>
        <button
          :class="['px-3 py-1 text-xs rounded-md transition-colors', range === '30d' ? 'bg-rosegold text-white' : 'text-grayrose hover:text-rosegold']"
          @click="range = '30d'"
        >
          近30天
        </button>
      </div>
    </div>
    <div class="h-64">
      <VChart :option="chartOption" autoresize class="w-full h-full" />
    </div>
  </div>
</template>
