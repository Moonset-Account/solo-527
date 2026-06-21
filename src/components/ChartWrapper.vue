<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  PieChart,
  BarChart,
  LineChart,
  GaugeChart,
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
} from 'echarts/components'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
])

const props = defineProps<{
  option: Record<string, any>
  height?: string
}>()

const chartRef = ref<InstanceType<typeof VChart> | null>(null)
const chartHeight = props.height || '300px'

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (chartRef.value?.$el) {
    resizeObserver = new ResizeObserver(() => {
      chartRef.value?.resize()
    })
    resizeObserver.observe(chartRef.value.$el)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(() => props.option, () => {
  chartRef.value?.resize()
}, { deep: true })
</script>

<template>
  <div class="chart-wrapper">
    <VChart
      ref="chartRef"
      :option="option"
      :autoresize="true"
      :style="{ height: chartHeight, width: '100%' }"
      theme="dark"
    />
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
  min-height: 200px;
}
</style>
