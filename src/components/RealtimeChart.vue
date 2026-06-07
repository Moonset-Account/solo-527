<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
  VisualMapComponent,
  DataZoomComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { getMockReadings, mockThresholds, mockFeedingRecords } from '@/mock/data'
import type { MetricType, SensorReading } from '@/types'
import { METRIC_LABELS, METRIC_COLORS, METRIC_UNITS } from '@/types'

use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, MarkAreaComponent, VisualMapComponent, DataZoomComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  pondId: string
  metric: MetricType
}>()

const emit = defineEmits<{
  'point-click': [reading: SensorReading]
}>()

const readings = computed(() => getMockReadings(props.pondId, props.metric))

const threshold = computed(() =>
  mockThresholds.find(t => t.pondId === props.pondId && t.metric === props.metric)
)

const strategyFeedings = computed(() =>
  mockFeedingRecords.filter(f => f.pondId === props.pondId && f.strategyChange)
)

const offlineSegments = computed(() => {
  const segments: { start: string; end: string }[] = []
  let start: string | null = null
  for (const r of readings.value) {
    if (r.quality === 'offline') {
      if (!start) start = r.timestamp
    } else {
      if (start) {
        segments.push({ start, end: r.timestamp })
        start = null
      }
    }
  }
  if (start) {
    segments.push({ start, end: readings.value[readings.value.length - 1].timestamp })
  }
  return segments
})

const qualityLabel: Record<string, string> = {
  good: '正常',
  suspect: '可疑',
  offline: '离线'
}

const option = computed(() => {
  const lineData = readings.value.map(r => {
    if (r.isAnomaly) {
      return {
        value: [r.timestamp, r.value],
        symbolSize: 14,
        itemStyle: { color: '#ef4444', borderColor: '#fff', borderWidth: 2 }
      }
    }
    return {
      value: [r.timestamp, r.quality === 'offline' ? NaN : r.value],
      symbolSize: 4
    }
  })

  const markAreaData = offlineSegments.value.map(seg => ([
    {
      xAxis: seg.start,
      itemStyle: { color: 'rgba(128,128,128,0.15)' },
      label: { show: true, formatter: '设备离线', color: '#999', fontSize: 11, position: 'insideTop' }
    },
    { xAxis: seg.end }
  ]))

  const thresholdMarkLines: any[] = []
  if (threshold.value) {
    const th = threshold.value
    thresholdMarkLines.push(
      { yAxis: th.warningHigh, lineStyle: { color: '#F59E0B', type: 'dashed', width: 1 }, label: { formatter: '预警上限', color: '#F59E0B', fontSize: 10, position: 'insideEndTop' } },
      { yAxis: th.warningLow, lineStyle: { color: '#F59E0B', type: 'dashed', width: 1 }, label: { formatter: '预警下限', color: '#F59E0B', fontSize: 10, position: 'insideEndTop' } },
      { yAxis: th.criticalHigh, lineStyle: { color: '#ef4444', type: 'dashed', width: 1 }, label: { formatter: '严重上限', color: '#ef4444', fontSize: 10, position: 'insideEndTop' } },
      { yAxis: th.criticalLow, lineStyle: { color: '#ef4444', type: 'dashed', width: 1 }, label: { formatter: '严重下限', color: '#ef4444', fontSize: 10, position: 'insideEndTop' } }
    )
  }

  const feedingMarkLines = strategyFeedings.value.map(f => ({
    xAxis: f.timestamp,
    lineStyle: { color: '#8B5CF6', type: 'dashed', width: 1 },
    label: {
      show: false,
      formatter: f.strategyNote || '策略变更',
      color: '#8B5CF6',
      fontSize: 10,
      position: 'insideEndTop'
    },
    emphasis: {
      label: { show: true, formatter: f.strategyNote || '策略变更', color: '#8B5CF6', fontSize: 11, position: 'insideEndTop' }
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
        const p = params?.[0]
        if (!p) return ''
        const idx = p.dataIndex
        const r = readings.value[idx]
        if (!r) return ''
        const val = isNaN(r.value) ? '--' : r.value
        return [
          `<div style="font-weight:bold;margin-bottom:4px">${METRIC_LABELS[props.metric]}</div>`,
          `时间: ${new Date(r.timestamp).toLocaleString('zh-CN')}<br/>`,
          `数值: ${val} ${METRIC_UNITS[props.metric]}<br/>`,
          `质量: ${qualityLabel[r.quality] || r.quality}<br/>`,
          `传感器: ${r.sensorId}`
        ].join('')
      }
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
    series: [{
      type: 'line',
      name: METRIC_LABELS[props.metric],
      data: lineData,
      connectNulls: false,
      smooth: true,
      showSymbol: true,
      lineStyle: { color: METRIC_COLORS[props.metric], width: 2 },
      itemStyle: { color: METRIC_COLORS[props.metric] },
      emphasis: {
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: METRIC_COLORS[props.metric]
        },
        scale: 1.5
      },
      markArea: {
        silent: true,
        data: markAreaData
      },
      markLine: {
        silent: true,
        symbol: 'none',
        data: [...thresholdMarkLines, ...feedingMarkLines]
      }
    }]
  }
})

const handleClick = (params: any) => {
  if (params.componentType === 'series' && params.dataIndex !== undefined) {
    const r = readings.value[params.dataIndex]
    if (r) emit('point-click', r)
  }
}
</script>

<template>
  <VChart :option="option" autoresize style="height: 100%; width: 100%;" @click="handleClick" />
</template>
