<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  DataZoomComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { fetchReadings, fetchFeedingRecords } from '@/services/api'
import { METRIC_LABELS, METRIC_COLORS } from '@/types'

use([LineChart, BarChart, GridComponent, TooltipComponent, MarkLineComponent, DataZoomComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  pondId: string
}>()

const readings = ref<any[]>([])
const feedings = ref<any[]>([])

async function fetchData() {
  const [readingsRes, feedingsRes] = await Promise.all([
    fetchReadings({ pondId: props.pondId, metric: 'dissolved_oxygen' }),
    fetchFeedingRecords(props.pondId)
  ])
  readings.value = readingsRes
  feedings.value = feedingsRes
}

watch(() => props.pondId, fetchData, { immediate: true })

const strategyFeedings = computed(() =>
  feedings.value.filter((f: any) => f.strategy_change)
)

const option = computed(() => {
  const lineData = readings.value.map((r: any) => ({
    value: [r.ts, r.quality === 'offline' ? NaN : r.value],
    symbolSize: r.is_anomaly ? 14 : 4,
    itemStyle: r.is_anomaly ? { color: '#ef4444', borderColor: '#fff', borderWidth: 2 } : {}
  }))

  const barData = feedings.value.map((f: any) => ({
    value: [f.ts, f.amount],
    itemStyle: {
      color: f.strategy_change
        ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#8B5CF6' }, { offset: 1, color: 'rgba(139,92,246,0.3)' }] }
        : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#F59E0B' }, { offset: 1, color: 'rgba(245,158,11,0.3)' }] }
    }
  }))

  const feedingMarkLines: any[] = []
  for (const f of strategyFeedings.value) {
    feedingMarkLines.push([
      { coord: [f.ts, 0], lineStyle: { color: '#8B5CF6', type: 'dashed', width: 1 } },
      { coord: [f.ts, 'max'], label: { show: false, formatter: f.strategy_note || '策略变更', color: '#8B5CF6', fontSize: 10, position: 'insideEndTop' }, emphasis: { label: { show: true, formatter: f.strategy_note || '策略变更', color: '#8B5CF6', fontSize: 11, position: 'insideEndTop' } } }
    ])
  }

  return {
    backgroundColor: '#0A2E36',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,46,54,0.95)',
      borderColor: '#00B4D8',
      textStyle: { color: '#e0e0e0', fontSize: 12 },
      formatter: (params: any) => {
        if (!params || params.length === 0) return ''
        const time = params[0]?.axisValueLabel || ''
        let html = `<div style="font-weight:bold;margin-bottom:4px">${new Date(time).toLocaleString('zh-CN')}</div>`
        for (const p of params) {
          if (p.seriesType === 'line') {
            const idx = p.dataIndex
            const r = readings.value[idx]
            const val = r && !isNaN(r.value) ? r.value : '--'
            html += `${p.marker} ${p.seriesName}: ${val} mg/L<br/>`
          } else if (p.seriesType === 'bar') {
            const val = p.value?.[1] ?? '--'
            html += `${p.marker} ${p.seriesName}: ${val} kg<br/>`
          }
        }
        return html
      }
    },
    legend: {
      data: [METRIC_LABELS['dissolved_oxygen'], '投喂量'],
      textStyle: { color: '#999', fontSize: 11 },
      top: 5
    },
    grid: {
      left: 60,
      right: 60,
      top: 40,
      bottom: 60
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisLabel: { color: '#999', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
    },
    yAxis: [
      {
        type: 'value',
        name: METRIC_LABELS['dissolved_oxygen'],
        nameTextStyle: { color: '#999', fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
        axisLabel: { color: '#999', fontSize: 10, formatter: '{value} mg/L' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
      },
      {
        type: 'value',
        name: '投喂量 (kg)',
        nameTextStyle: { color: '#999', fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
        axisLabel: { color: '#999', fontSize: 10, formatter: '{value} kg' },
        splitLine: { show: false }
      }
    ],
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 20,
        bottom: 10,
        borderColor: 'rgba(255,255,255,0.1)',
        fillerColor: 'rgba(0,180,216,0.15)',
        handleStyle: { color: '#00B4D8' },
        textStyle: { color: '#999' }
      }
    ],
    series: [
      {
        type: 'line',
        name: METRIC_LABELS['dissolved_oxygen'],
        yAxisIndex: 0,
        data: lineData,
        connectNulls: false,
        smooth: true,
        showSymbol: true,
        lineStyle: { color: METRIC_COLORS['dissolved_oxygen'], width: 2 },
        itemStyle: { color: METRIC_COLORS['dissolved_oxygen'] },
        emphasis: {
          itemStyle: { borderColor: '#fff', borderWidth: 2, shadowBlur: 10, shadowColor: METRIC_COLORS['dissolved_oxygen'] },
          scale: 1.5
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: feedingMarkLines
        }
      },
      {
        type: 'bar',
        name: '投喂量',
        yAxisIndex: 1,
        data: barData,
        barWidth: '20%',
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(245,158,11,0.5)' }
        }
      }
    ]
  }
})
</script>

<template>
  <VChart :option="option" autoresize style="height: 100%; width: 100%;" />
</template>
