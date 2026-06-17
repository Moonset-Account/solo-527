<template>
  <div class="yield-stats-page">
    <n-space vertical :size="20" style="width: 100%">
      <n-card :bordered="false" size="small">
        <n-space :size="16">
          <n-date-picker
            v-model:value="dateRange"
            type="daterange"
            placeholder="选择统计时间范围"
            clearable
            style="width: 280px"
          />
          <n-button type="primary" @click="loadStats">统计</n-button>
        </n-space>
      </n-card>

      <n-grid :cols="3" :x-gap="16">
        <n-grid-item>
          <n-card hoverable>
            <n-statistic label="预测总产量" :value="stats.total_predicted || 0" :precision="2" suffix="kg" value-style="color: #2080f0" />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card hoverable>
            <n-statistic label="实际总产量" :value="stats.total_actual || 0" :precision="2" suffix="kg" value-style="color: #18a058" />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card hoverable>
            <n-statistic
              label="完成率"
              :value="completionRate"
              :precision="1"
              suffix="%"
              :value-style="{ color: completionRate >= 100 ? '#18a058' : '#f0a020' }"
            />
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-grid :cols="2" :x-gap="16">
        <n-grid-item>
          <n-card title="按品种统计" :bordered="false" size="small">
            <div ref="varietyChartRef" style="width: 100%; height: 320px" />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="按地块统计" :bordered="false" size="small">
            <div ref="plotChartRef" style="width: 100%; height: 320px" />
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-card title="月度趋势" :bordered="false" size="small">
        <div ref="monthChartRef" style="width: 100%; height: 320px" />
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { useApi } from '@/composables/useApi'

const { get } = useApi()

const dateRange = ref<[number, number] | null>(null)
const stats = ref<any>({
  total_predicted: 0,
  total_actual: 0,
  by_variety: [],
  by_plot: [],
  by_month: [],
})

const varietyChartRef = ref<HTMLElement | null>(null)
const plotChartRef = ref<HTMLElement | null>(null)
const monthChartRef = ref<HTMLElement | null>(null)

let varietyChart: echarts.ECharts | null = null
let plotChart: echarts.ECharts | null = null
let monthChart: echarts.ECharts | null = null

const completionRate = computed(() => {
  if (!stats.value.total_predicted) return 0
  return (stats.value.total_actual / stats.value.total_predicted) * 100
})

async function loadStats() {
  try {
    const params: any = {}
    if (dateRange.value) {
      params.start_date = new Date(dateRange.value[0]).toISOString().split('T')[0]
      params.end_date = new Date(dateRange.value[1]).toISOString().split('T')[0]
    }
    stats.value = await get('/batches/stats/yield', params)
    renderCharts()
  } catch (e) {
    console.error(e)
  }
}

function renderCharts() {
  renderVarietyChart()
  renderPlotChart()
  renderMonthChart()
}

function renderVarietyChart() {
  if (!varietyChartRef.value) return
  if (!varietyChart) {
    varietyChart = echarts.init(varietyChartRef.value)
  }
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} kg ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: stats.value.by_variety?.map((item: any) => ({ name: item.name, value: item.value })) || [],
        color: ['#18a058', '#2080f0', '#f0a020', '#d03050', '#8a2be2', '#ff6347'],
      },
    ],
  }
  varietyChart.setOption(option)
}

function renderPlotChart() {
  if (!plotChartRef.value) return
  if (!plotChart) {
    plotChart = echarts.init(plotChartRef.value)
  }
  const data = stats.value.by_plot || []
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map((d: any) => d.name), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: '产量(kg)' },
    series: [
      {
        type: 'bar',
        data: data.map((d: any) => d.value),
        itemStyle: { color: '#2080f0', borderRadius: [4, 4, 0, 0] },
        barWidth: '50%',
      },
    ],
  }
  plotChart.setOption(option)
}

function renderMonthChart() {
  if (!monthChartRef.value) return
  if (!monthChart) {
    monthChart = echarts.init(monthChartRef.value)
  }
  const data = (stats.value.by_month || []).sort((a: any, b: any) => a.name.localeCompare(b.name))
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['实际产量'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: data.map((d: any) => d.name) },
    yAxis: { type: 'value', name: '产量(kg)' },
    series: [
      {
        name: '实际产量',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#18a058' },
        lineStyle: { color: '#18a058', width: 2 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(24, 160, 88, 0.3)' },
          { offset: 1, color: 'rgba(24, 160, 88, 0.05)' },
        ]) },
        data: data.map((d: any) => d.value),
      },
    ],
  }
  monthChart.setOption(option)
}

watch(
  () => stats.value,
  () => {
    nextTick(() => {
      renderCharts()
    })
  }
)

onMounted(async () => {
  await loadStats()
  await nextTick()
  renderCharts()

  window.addEventListener('resize', () => {
    varietyChart?.resize()
    plotChart?.resize()
    monthChart?.resize()
  })
})
</script>

<style scoped>
</style>
