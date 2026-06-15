<template>
  <div class="card p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-semibold text-slate-800">{{ title }}</h3>
      <div class="flex items-center gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
          :class="activeTab === tab.value ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-100'"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
    <div ref="chartRef" class="h-72"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  title: string
  data: { date: string; value: number }[]
  compareData?: { date: string; value: number }[]
  unit?: string
  color?: string
}>()

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const tabs = [
  { value: 'trend', label: '趋势' },
  { value: 'compare', label: '同比对比' }
]

const activeTab = ref('trend')

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance) return

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        color: '#334155',
        fontSize: 12
      },
      formatter: (params: any) => {
        const date = params[0].axisValue
        let html = `<div class="font-medium mb-1">${date}</div>`
        params.forEach((item: any) => {
          html += `<div class="flex items-center gap-2">
            <span style="background:${item.color};width:8px;height:8px;border-radius:50%;display:inline-block;"></span>
            <span>${item.seriesName}:</span>
            <span class="font-medium">${item.value.toLocaleString()} ${props.unit || ''}</span>
          </div>`
        })
        return html
      }
    },
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: props.data.map(d => d.date.slice(5)),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11
      }
    },
    series: [
      {
        name: '本期',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        data: props.data.map(d => d.value),
        lineStyle: {
          color: props.color || '#0F3460',
          width: 2.5
        },
        itemStyle: {
          color: props.color || '#0F3460'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: (props.color || '#0F3460') + '25' },
            { offset: 1, color: (props.color || '#0F3460') + '03' }
          ])
        }
      }
    ]
  }

  if (props.compareData && props.compareData.length > 0 && activeTab.value === 'compare') {
    option.series?.push({
      name: '同期',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      showSymbol: false,
      data: props.compareData.map(d => d.value),
      lineStyle: {
        color: '#cbd5e1',
        width: 1.5,
        type: 'dashed'
      },
      itemStyle: {
        color: '#cbd5e1'
      }
    } as any)
  }

  chartInstance.setOption(option, true)
}

onMounted(() => {
  nextTick(() => {
    initChart()
  })

  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

watch(() => [props.data, props.compareData], () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

watch(activeTab, () => {
  nextTick(() => {
    updateChart()
  })
})
</script>
