<template>
  <div class="environment-page">
    <n-space vertical :size="20" style="width: 100%">
      <n-card :bordered="false" size="small">
        <n-space :size="16">
          <div style="min-width: 200px">
            <label class="filter-label">选择地块</label>
            <n-select v-model:value="selectedPlot" :options="plotOptions" placeholder="全部地块" clearable />
          </div>
          <div style="min-width: 160px">
            <label class="filter-label">时间范围</label>
            <n-select v-model:value="timeRange" :options="timeRangeOptions" />
          </div>
          <div style="min-width: 160px">
            <label class="filter-label">监测指标</label>
            <n-select v-model:value="metrics" multiple :options="metricOptions" />
          </div>
        </n-space>
      </n-card>

      <n-grid :cols="4" :x-gap="16" :y-gap="16">
        <n-grid-item v-for="metric in metricCards" :key="metric.key">
          <n-card hoverable>
            <div class="metric-card">
              <div class="metric-info">
                <div class="metric-label">{{ metric.label }}</div>
                <div class="metric-value" :class="{ danger: metric.isAbnormal }">
                  {{ metric.value }}
                  <span class="metric-unit">{{ metric.unit }}</span>
                </div>
              </div>
              <div class="metric-icon" :style="{ background: metric.color }">
                {{ metric.icon }}
              </div>
            </div>
            <div v-if="metric.isAbnormal" class="metric-warning">
              <n-tag size="small" type="warning">异常</n-tag>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-card title="环境趋势" :bordered="false" size="small">
        <n-tabs v-model:value="activeTab" type="line" size="small">
          <n-tab-pane name="temperature" tab="温度趋势" />
          <n-tab-pane name="humidity" tab="湿度趋势" />
          <n-tab-pane name="soil_moisture" tab="土壤湿度" />
          <n-tab-pane name="light_intensity" tab="光照强度" />
        </n-tabs>
        <div ref="chartRef" style="width: 100%; height: 360px; margin-top: 16px" />
      </n-card>

      <n-card title="数据明细" :bordered="false" size="small">
        <n-data-table
          :columns="dataColumns"
          :data="environmentData"
          :bordered="false"
          :pagination="{ pageSize: 10 }"
          size="small"
        />
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { NTag } from 'naive-ui'
import * as echarts from 'echarts'
import { useApi } from '@/composables/useApi'
import { useFormat } from '@/composables/useFormat'

const { get } = useApi()
const { formatDateTime } = useFormat()

const selectedPlot = ref<number | null>(null)
const timeRange = ref('24h')
const metrics = ref(['temperature', 'humidity'])
const activeTab = ref('temperature')
const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const plotOptions = ref<any[]>([])
const environmentData = ref<any[]>([])
const latestData = ref<any>({})

const timeRangeOptions = [
  { label: '最近24小时', value: '24h' },
  { label: '最近7天', value: '7d' },
  { label: '最近30天', value: '30d' },
]

const metricOptions = [
  { label: '温度', value: 'temperature' },
  { label: '湿度', value: 'humidity' },
  { label: '土壤湿度', value: 'soil_moisture' },
  { label: '光照', value: 'light_intensity' },
]

const dataColumns = [
  { title: '记录时间', key: 'record_time', width: 180, render: (row: any) => formatDateTime(row.record_time) },
  { title: '地块', key: 'plot_name', width: 120 },
  { title: '温度(℃)', key: 'temperature', width: 100 },
  { title: '湿度(%)', key: 'humidity', width: 100 },
  { title: '土壤湿度(%)', key: 'soil_moisture', width: 110 },
  { title: '光照(Lux)', key: 'light_intensity', width: 110 },
  { title: 'CO₂(ppm)', key: 'co2_concentration', width: 110 },
]

const metricCards = computed(() => [
  { key: 'temperature', label: '温度', value: latestData.value.temperature ?? '--', unit: '℃', icon: '🌡️', color: '#ffebee', isAbnormal: false },
  { key: 'humidity', label: '湿度', value: latestData.value.humidity ?? '--', unit: '%', icon: '💧', color: '#e3f2fd', isAbnormal: false },
  { key: 'soil_moisture', label: '土壤湿度', value: latestData.value.soil_moisture ?? '--', unit: '%', icon: '🌱', color: '#e8f5e9', isAbnormal: false },
  { key: 'light_intensity', label: '光照强度', value: latestData.value.light_intensity ?? '--', unit: 'Lux', icon: '☀️', color: '#fff8e1', isAbnormal: false },
])

async function loadPlots() {
  try {
    const plots: any = await get('/plots', { status: 'active' })
    plotOptions.value = plots.map((p: any) => ({ label: p.name, value: p.id }))
  } catch (e) {
    console.error(e)
  }
}

async function loadLatestData() {
  try {
    const params: any = {}
    if (selectedPlot.value) params.plot_id = selectedPlot.value
    const data: any = await get('/environment/data', { ...params, limit: 1 })
    if (data.length > 0) {
      latestData.value = data[0]
    }
  } catch (e) {
    console.error(e)
  }
}

async function loadEnvironmentData() {
  try {
    const params: any = { limit: 200 }
    if (selectedPlot.value) params.plot_id = selectedPlot.value
    const data: any = await get('/environment/data', params)
    environmentData.value = data
  } catch (e) {
    console.error(e)
  }
}

async function loadTrendData() {
  if (!selectedPlot.value && plotOptions.value.length > 0) {
    selectedPlot.value = plotOptions.value[0].value
  }
  if (!selectedPlot.value) return

  try {
    const hours = timeRange.value === '24h' ? 24 : timeRange.value === '7d' ? 168 : 720
    const data: any = await get('/environment/data/trend', {
      plot_id: selectedPlot.value,
      metric: activeTab.value,
      hours,
    })
    renderChart(data)
  } catch (e) {
    console.error(e)
  }
}

function renderChart(data: any) {
  if (!chartRef.value) return

  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  const metricLabels: Record<string, string> = {
    temperature: '温度 (℃)',
    humidity: '湿度 (%)',
    soil_moisture: '土壤湿度 (%)',
    light_intensity: '光照强度 (Lux)',
  }

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.data?.map((d: any) => {
        const t = new Date(d.time)
        return `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`
      }) || [],
    },
    yAxis: { type: 'value', name: metricLabels[activeTab.value] },
    series: [
      {
        name: metricLabels[activeTab.value],
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#18a058' },
        lineStyle: { color: '#18a058' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(24, 160, 88, 0.3)' },
          { offset: 1, color: 'rgba(24, 160, 88, 0.05)' },
        ]) },
        data: data.data?.map((d: any) => d.value) || [],
      },
    ],
  }

  chart.setOption(option)
}

watch(activeTab, () => {
  loadTrendData()
})

watch(selectedPlot, () => {
  loadLatestData()
  loadEnvironmentData()
  loadTrendData()
})

watch(timeRange, () => {
  loadTrendData()
})

onMounted(async () => {
  await loadPlots()
  await loadLatestData()
  await loadEnvironmentData()
  await nextTick()
  loadTrendData()

  window.addEventListener('resize', () => {
    chart?.resize()
  })
})
</script>

<style scoped>
.filter-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.metric-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-info {
  flex: 1;
}

.metric-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.metric-value.danger {
  color: #d03050;
}

.metric-unit {
  font-size: 14px;
  font-weight: normal;
  color: #999;
  margin-left: 4px;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.metric-warning {
  margin-top: 8px;
}
</style>
