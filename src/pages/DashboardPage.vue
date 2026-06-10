<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkAreaComponent } from 'echarts/components'
import { Lightning, Calendar, Sunny, TrendCharts, Top, Bottom } from '@element-plus/icons-vue'
import { energyApi } from '@/api'
import type { EnergyOverview, EnergyCurvePoint, ZoneEnergyComparison } from '@/types'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkAreaComponent])

const overview = ref<EnergyOverview | null>(null)
const curveData = ref<EnergyCurvePoint[]>([])
const zoneData = ref<ZoneEnergyComparison[]>([])
const overviewLoading = ref(true)
const curveLoading = ref(true)
const zoneLoading = ref(true)
const activePeriod = ref('today')

const currentDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

const todayChange = computed(() => {
  if (!overview.value) return { percent: 0, up: false }
  const diff = overview.value.todayUsage - overview.value.yesterdayUsage
  const percent = overview.value.yesterdayUsage ? Math.round((diff / overview.value.yesterdayUsage) * 1000) / 10 : 0
  return { percent: Math.abs(percent), up: diff >= 0 }
})

const monthChange = computed(() => {
  if (!overview.value) return { percent: 0, up: false }
  const diff = overview.value.monthUsage - overview.value.lastMonthUsage
  const percent = overview.value.lastMonthUsage ? Math.round((diff / overview.value.lastMonthUsage) * 1000) / 10 : 0
  return { percent: Math.abs(percent), up: diff >= 0 }
})

const trendChange = computed(() => {
  return todayChange.value
})

const curveOption = computed(() => {
  const times = curveData.value.map((p) => p.time)
  const values = curveData.value.map((p) => p.value)
  const peakAreas: Array<{ xAxis: string }> = []
  let i = 0
  while (i < curveData.value.length) {
    if (curveData.value[i].isPeak) {
      const start = curveData.value[i].time
      while (i < curveData.value.length && curveData.value[i].isPeak) i++
      const end = curveData.value[Math.min(i - 1, curveData.value.length - 1)].time
      peakAreas.push({ xAxis: start }, { xAxis: end })
    } else {
      i++
    }
  }

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        return `${p.axisValue}<br/>用电量: <b>${p.value}</b> kWh`
      },
    },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: times,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#666', formatter: '{value}' },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#1A6B7F', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(26,107,127,0.25)' },
              { offset: 1, color: 'rgba(26,107,127,0.02)' },
            ],
          },
        },
        markArea: peakAreas.length
          ? {
            silent: true,
            itemStyle: { color: 'rgba(255,165,0,0.12)' },
            data: peakAreas,
          }
          : undefined,
      },
    ],
  }
})

const zoneOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params: any) => {
      const p = Array.isArray(params) ? params[0] : params
      return `${p.name}<br/>用电量: <b>${p.value}</b> kWh (${zoneData.value[p.dataIndex]?.percentage}%)`
    },
  },
  grid: { left: 100, right: 30, top: 10, bottom: 20 },
  xAxis: {
    type: 'value',
    axisLabel: { color: '#666' },
    splitLine: { lineStyle: { color: '#f0f0f0' } },
  },
  yAxis: {
    type: 'category',
    data: zoneData.value.map((z) => z.zoneName),
    axisLine: { lineStyle: { color: '#ddd' } },
    axisLabel: { color: '#333' },
  },
  series: [
    {
      type: 'bar',
      data: zoneData.value.map((z) => z.usage),
      barWidth: 20,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#0F4C5C' },
            { offset: 1, color: '#1A6B7F' },
          ],
        },
      },
    },
  ],
}))

const loadOverview = async () => {
  overviewLoading.value = true
  try {
    overview.value = await energyApi.getOverview()
  } finally {
    overviewLoading.value = false
  }
}

const loadCurve = async (period: string) => {
  curveLoading.value = true
  activePeriod.value = period
  try {
    curveData.value = await energyApi.getCurve(period)
  } finally {
    curveLoading.value = false
  }
}

const loadZone = async () => {
  zoneLoading.value = true
  try {
    zoneData.value = await energyApi.getZoneComparison()
  } finally {
    zoneLoading.value = false
  }
}

onMounted(() => {
  loadOverview()
  loadCurve('today')
  loadZone()
})
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">能耗看板</h1>
      <span class="dashboard-date">{{ currentDate }}</span>
    </div>

    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <el-skeleton :loading="overviewLoading" animated>
          <template #template>
            <el-skeleton-item variant="rect" style="height: 120px; border-radius: 8px" />
          </template>
          <template #default>
            <div class="stat-card">
              <div class="stat-icon stat-icon--blue">
                <el-icon :size="24"><Lightning /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">今日用电</span>
                <span class="stat-value">{{ overview?.todayUsage ?? 0 }} <small>kWh</small></span>
                <span class="stat-compare" :class="todayChange.up ? 'is-up' : 'is-down'">
                  <el-icon v-if="todayChange.up"><Top /></el-icon>
                  <el-icon v-else><Bottom /></el-icon>
                  较昨日 {{ todayChange.up ? '↑' : '↓' }} {{ todayChange.percent }}%
                </span>
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-col>

      <el-col :span="6">
        <el-skeleton :loading="overviewLoading" animated>
          <template #template>
            <el-skeleton-item variant="rect" style="height: 120px; border-radius: 8px" />
          </template>
          <template #default>
            <div class="stat-card">
              <div class="stat-icon stat-icon--green">
                <el-icon :size="24"><Calendar /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">本月用电</span>
                <span class="stat-value">{{ overview?.monthUsage ?? 0 }} <small>kWh</small></span>
                <span class="stat-compare" :class="monthChange.up ? 'is-up' : 'is-down'">
                  <el-icon v-if="monthChange.up"><Top /></el-icon>
                  <el-icon v-else><Bottom /></el-icon>
                  较上月 {{ monthChange.up ? '↑' : '↓' }} {{ monthChange.percent }}%
                </span>
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-col>

      <el-col :span="6">
        <el-skeleton :loading="overviewLoading" animated>
          <template #template>
            <el-skeleton-item variant="rect" style="height: 120px; border-radius: 8px" />
          </template>
          <template #default>
            <div class="stat-card">
              <div class="stat-icon stat-icon--orange">
                <el-icon :size="24"><Sunny /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">尖峰用电</span>
                <span class="stat-value">{{ overview?.peakUsage ?? 0 }} <small>kWh</small></span>
                <span class="stat-compare stat-compare--orange">
                  尖峰占比 {{ overview ? (overview.peakRatio * 100).toFixed(1) : 0 }}%
                </span>
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-col>

      <el-col :span="6">
        <el-skeleton :loading="overviewLoading" animated>
          <template #template>
            <el-skeleton-item variant="rect" style="height: 120px; border-radius: 8px" />
          </template>
          <template #default>
            <div class="stat-card">
              <div class="stat-icon stat-icon--purple">
                <el-icon :size="24"><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">用电趋势</span>
                <span class="stat-value">{{ trendChange.percent }}% <small>日环比</small></span>
                <span class="stat-compare" :class="trendChange.up ? 'is-up' : 'is-down'">
                  {{ trendChange.up ? '用电上升' : '用电下降' }}
                </span>
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="16">
        <div class="chart-card">
          <div class="chart-card__header">
            <span class="chart-card__title">能耗曲线</span>
            <div class="chart-card__actions">
              <el-button-group>
                <el-button
                  :type="activePeriod === 'today' ? 'primary' : 'default'"
                  size="small"
                  @click="loadCurve('today')"
                >
                  今日
                </el-button>
                <el-button
                  :type="activePeriod === 'yesterday' ? 'primary' : 'default'"
                  size="small"
                  @click="loadCurve('yesterday')"
                >
                  昨日
                </el-button>
                <el-button
                  :type="activePeriod === 'week' ? 'primary' : 'default'"
                  size="small"
                  @click="loadCurve('week')"
                >
                  本周
                </el-button>
                <el-button
                  :type="activePeriod === 'month' ? 'primary' : 'default'"
                  size="small"
                  @click="loadCurve('month')"
                >
                  本月
                </el-button>
              </el-button-group>
            </div>
          </div>
          <el-skeleton :loading="curveLoading" animated>
            <template #template>
              <el-skeleton-item variant="rect" style="height: 320px" />
            </template>
            <template #default>
              <VChart :option="curveOption" autoresize style="height: 320px" />
            </template>
          </el-skeleton>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-card__header">
            <span class="chart-card__title">区域用电对比</span>
          </div>
          <el-skeleton :loading="zoneLoading" animated>
            <template #template>
              <el-skeleton-item variant="rect" style="height: 320px" />
            </template>
            <template #default>
              <VChart :option="zoneOption" autoresize style="height: 320px" />
            </template>
          </el-skeleton>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 24px;
}

.dashboard-header {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 24px;
}

.dashboard-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.dashboard-date {
  font-size: 14px;
  color: #8c939d;
}

.stat-row {
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  height: 120px;
  box-sizing: border-box;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon--blue {
  background: rgba(15, 76, 92, 0.1);
  color: #0F4C5C;
}

.stat-icon--green {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.stat-icon--orange {
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
}

.stat-icon--purple {
  background: rgba(114, 46, 209, 0.1);
  color: #722ed1;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #8c939d;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.2;
}

.stat-value small {
  font-size: 13px;
  font-weight: 400;
  color: #8c939d;
}

.stat-compare {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-compare.is-up {
  color: #f5222d;
}

.stat-compare.is-down {
  color: #52c41a;
}

.stat-compare--orange {
  color: #fa8c16;
}

.chart-row {
  margin-bottom: 24px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.chart-card__title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}
</style>
