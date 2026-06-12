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
  const colors = { critical: '#d03050', high: '#f0a020', medium: '#1d6ff2', low: '#8a8f99' }
  const labels = { critical: '极高', high: '高', medium: '中', low: '低' }
  const d = props.data || {}
  const data = Object.keys(d).map((k) => ({ name: labels[k] || k, value: d[k] || 0, itemStyle: { color: (colors as any)[k] || '#8a8f99' } }))
  const total = data.reduce((s, x) => s + x.value, 0)
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 4, top: 'center', textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['50%', '72%'],
      center: ['36%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 600 } },
      labelLine: { show: false },
      data: data.length ? data : [{ name: '暂无数据', value: 1, itemStyle: { color: '#e5e7eb' } }],
    }],
    graphic: total ? {
      type: 'text',
      left: '26%',
      top: 'center',
      style: {
        text: `总缺口\n${total}`,
        textAlign: 'center',
        fill: '#1f2937',
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 22,
      },
    } : undefined,
  }
  instance.setOption(option)
}

onMounted(render)
watch(() => props.data, render, { deep: true })
</script>
