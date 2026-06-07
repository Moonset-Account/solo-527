<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { fetchReadings, fetchBatches } from '@/services/api'
import type { MetricType } from '@/types'
import { METRIC_LABELS, METRIC_UNITS, POND_NAMES } from '@/types'

use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, LegendComponent, CanvasRenderer])

const PALETTE = ['#00B4D8', '#F59E0B', '#10B981', '#8B5CF6']

const props = defineProps<{
  batchIds: string[]
  metric: MetricType
}>()

const batches = ref<any[]>([])
const readingsMap = ref<Record<string, any[]>>({})

const batchPondMap = computed(() => {
  const map = new Map<string, string>()
  for (const batchId of props.batchIds) {
    const batch = batches.value.find((b: any) => b.id === batchId)
    if (batch) {
      map.set(batchId, batch.pond_id)
    }
  }
  return map
})

async function fetchData() {
  const batchesRes: any[] = await fetchBatches()
  batches.value = batchesRes

  const pondIds = new Set<string>()
  for (const batchId of props.batchIds) {
    const batch = batchesRes.find((b: any) => b.id === batchId)
    if (batch) pondIds.add(batch.pond_id)
  }

  const newMap: Record<string, any[]> = {}
  await Promise.all(
    [...pondIds].map(async pondId => {
      newMap[pondId] = await fetchReadings({ pondId, metric: props.metric })
    })
  )
  readingsMap.value = newMap
}

watch(() => [props.batchIds, props.metric], fetchData, { immediate: true })

const seriesData = computed(() => {
  return props.batchIds.map((batchId, idx) => {
    const pondId = batchPondMap.value.get(batchId)
    if (!pondId) return null
    const readings = readingsMap.value[pondId] || []
    const data = readings.map((r: any) => ({
      value: [r.ts, r.quality === 'offline' ? NaN : r.value],
      symbolSize: r.is_anomaly ? 10 : 3,
      itemStyle: r.is_anomaly ? { color: '#ef4444', borderColor: '#fff', borderWidth: 2 } : {}
    }))
    return {
      batchId,
      pondId,
      name: POND_NAMES[pondId] || pondId,
      data,
      color: PALETTE[idx % PALETTE.length]
    }
  }).filter(Boolean) as { batchId: string; pondId: string; name: string; data: any[]; color: string }[]
})

const option = computed(() => {
  const series = seriesData.value.map(item => ({
    type: 'line' as const,
    name: item.name,
    data: item.data,
    connectNulls: false,
    smooth: true,
    showSymbol: true,
    lineStyle: { color: item.color, width: 2 },
    itemStyle: { color: item.color },
    emphasis: {
      itemStyle: { borderColor: '#fff', borderWidth: 2, shadowBlur: 10, shadowColor: item.color },
      scale: 1.5
    }
  }))

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
          const val = p.value?.[1]
          const displayVal = val !== undefined && val !== null && !isNaN(val) ? val : '--'
          html += `${p.marker} ${p.seriesName}: ${displayVal} ${METRIC_UNITS[props.metric]}<br/>`
        }
        return html
      }
    },
    legend: {
      data: seriesData.value.map(item => item.name),
      textStyle: { color: '#999', fontSize: 11 },
      top: 5
    },
    grid: {
      left: 60,
      right: 30,
      top: 40,
      bottom: 60
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisLabel: { color: '#999', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
    },
    yAxis: {
      type: 'value',
      name: METRIC_LABELS[props.metric],
      nameTextStyle: { color: '#999', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisLabel: { color: '#999', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
    },
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
    series
  }
})
</script>

<template>
  <VChart :option="option" autoresize style="height: 100%; width: 100%;" />
</template>
