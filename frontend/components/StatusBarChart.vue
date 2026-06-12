<template>
  <div ref="chartRef" style="width: 100%; height: 260px;"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{ data?: Record<string, number> }>()
const chartRef = ref<HTMLElement | null>(null)
let instance: any = null

function render() {
  if (!chartRef.value) return
  if (!instance) instance = echarts.init(chartRef.value)
  const labelMap: Record<string, string> = {
    draft: '草稿', submitted: '已提交', under_review: '审核中',
    lawyer_reviewed: '律师已审', reviewer_approved: '复核通过',
    rejected: '已驳回', closed: '已关闭',
  }
  const colorMap: Record<string, string> = {
    draft: '#8a8f99', submitted: '#1d6ff2', under_review: '#f0a020',
    lawyer_reviewed: '#2080f0', reviewer_approved: '#18a058',
    rejected: '#d03050', closed: '#6b7280',
  }
  const d = props.data || {}
  const entries = Object.entries(d)
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 50, right: 24, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: entries.map(([k]) => labelMap[k] || k),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { fontSize: 11, color: '#6b7280', interval: 0 },
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { fontSize: 11, color: '#6b7280' } },
    series: [{
      type: 'bar',
      barWidth: 28,
      data: entries.map(([k, v]) => ({
        value: v,
        itemStyle: { color: colorMap[k] || '#2d8a5e', borderRadius: [6, 6, 0, 0] },
      })),
      label: { show: true, position: 'top', fontSize: 12, color: '#1f2937', fontWeight: 500 },
    }],
  }
  instance.setOption(option)
}

onMounted(render)
watch(() => props.data, render, { deep: true })
</script>
