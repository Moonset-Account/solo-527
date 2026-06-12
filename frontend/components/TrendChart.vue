<template>
  <div ref="chartRef" style="width: 100%; height: 320px;"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{ data?: any }>()
const chartRef = ref<HTMLElement | null>(null)
let instance: any = null

function render() {
  if (!chartRef.value) return
  if (!instance) instance = echarts.init(chartRef.value)
  const list = props.data?.last_14_days || []
  const dates = list.map((x: any) => x.date.slice(5))
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新提交', '新缺口', '完成数'], right: 0, top: 0, textStyle: { fontSize: 12 } },
    grid: { left: 36, right: 16, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { fontSize: 11, color: '#6b7280' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { fontSize: 11, color: '#6b7280' } },
    series: [
      { name: '新提交', type: 'line', smooth: true, data: list.map((x: any) => x.submission_count), itemStyle: { color: '#2d8a5e' }, lineStyle: { width: 2.5 }, areaStyle: { color: 'rgba(45,138,94,0.1)' } },
      { name: '新缺口', type: 'line', smooth: true, data: list.map((x: any) => x.gap_count), itemStyle: { color: '#d03050' }, lineStyle: { width: 2.5 }, areaStyle: { color: 'rgba(208,48,80,0.08)' } },
      { name: '完成数', type: 'bar', data: list.map((x: any) => x.completed_count), itemStyle: { color: '#1d6ff2', borderRadius: [4,4,0,0] }, barWidth: 10 },
    ],
  }
  instance.setOption(option)
}

onMounted(render)
watch(() => props.data, render, { deep: true })
</script>
