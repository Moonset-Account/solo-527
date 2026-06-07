<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFilterStore } from '@/stores/filterStore'
import { useDataStore } from '@/stores/dataStore'
import { useSystemStore } from '@/stores/systemStore'
import { storeToRefs } from 'pinia'
import HeaderBar from '@/components/HeaderBar.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import StatCard from '@/components/StatCard.vue'
import TimeSeriesChart from '@/components/TimeSeriesChart.vue'
import MapView from '@/components/MapView.vue'
import PollutantRadar from '@/components/PollutantRadar.vue'
import EventTimeline from '@/components/EventTimeline.vue'
import * as d3 from 'd3'

const router = useRouter()
const filterStore = useFilterStore()
const dataStore = useDataStore()
const systemStore = useSystemStore()

const { criteria } = storeToRefs(filterStore)
const {
  stations,
  timeSeries,
  heatmap,
  constructionSites,
  complaints,
  trafficData,
  latestReadings,
  loading,
} = storeToRefs(dataStore)
const { stationMap } = storeToRefs(dataStore)

const stationNames = computed(() => {
  const names = new Map<string, string>()
  stationMap.value.forEach((station, id) => {
    names.set(id, station.name)
  })
  return names
})

const avgAqi = computed(() => {
  const values = Array.from(latestReadings.value.values()).map(r => r.aqi).filter(v => v > 0)
  return values.length > 0 ? Math.round(d3.mean(values)!) : 0
})

const avgPm25 = computed(() => {
  const values = Array.from(latestReadings.value.values()).map(r => r.pm25).filter(v => v > 0)
  return values.length > 0 ? Math.round(d3.mean(values)!) : 0
})

const totalComplaints = computed(() => {
  return complaints.value.reduce((sum, c) => sum + c.totalCount, 0)
})

const aqiLevel = computed(() => {
  const aqi = avgAqi.value
  if (aqi <= 50) return { label: '优', color: 'text-green-600', bg: 'bg-green-100' }
  if (aqi <= 100) return { label: '良', color: 'text-yellow-600', bg: 'bg-yellow-100' }
  if (aqi <= 150) return { label: '轻度污染', color: 'text-orange-600', bg: 'bg-orange-100' }
  return { label: '中度及以上', color: 'text-red-600', bg: 'bg-red-100' }
})

function loadData() {
  dataStore.loadAll(criteria.value)
}

function handleStationClick(stationId: string) {
  router.push(`/station/${stationId}`)
}

function handleApplyFilters() {
  loadData()
}

onMounted(() => {
  filterStore.initializeFromUrl()
  systemStore.loadStatus()
  loadData()
})

watch(() => criteria.value.timeRange, () => {
  loadData()
}, { deep: true })
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <HeaderBar />

    <div class="flex-1 flex overflow-hidden">
      <FilterPanel @apply="handleApplyFilters" />

      <main class="flex-1 overflow-y-auto scrollbar-thin p-6 bg-slate-50">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="空气质量指数 (AQI)"
            :value="avgAqi"
            unit=""
            color="green"
            icon="🌿"
            trend="stable"
            trend-value="3%"
          />
          <StatCard
            title="PM2.5 平均浓度"
            :value="avgPm25"
            unit="μg/m³"
            color="amber"
            icon="💨"
            trend="down"
            trend-value="12%"
          />
          <StatCard
            title="投诉事件（聚合）"
            :value="totalComplaints"
            unit="件"
            color="blue"
            icon="📢"
          />
          <StatCard
            title="当前等级"
            :value="aqiLevel.label"
            :color="aqiLevel.color.replace('text-', '').replace('-600', '')"
            icon="🏷️"
          />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white rounded-xl p-5 card-shadow">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-slate-800">污染物浓度趋势</h3>
              <span v-if="loading.timeSeries" class="text-xs text-slate-400 animate-pulse">
                加载中...
              </span>
            </div>
            <div class="h-72">
              <TimeSeriesChart
                :data="timeSeries"
                :pollutants="criteria.pollutants"
                :station-names="stationNames"
              />
            </div>
          </div>

          <div class="bg-white rounded-xl p-5 card-shadow">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-slate-800">污染物对比分析</h3>
            </div>
            <div class="h-72">
              <PollutantRadar
                :data="timeSeries"
                :pollutants="criteria.pollutants"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div class="lg:col-span-2 bg-white rounded-xl p-5 card-shadow">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-slate-800">监测点分布地图</h3>
              <div class="flex items-center gap-4 text-xs">
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full bg-green-500"></span>
                  <span class="text-slate-600">在线</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span class="text-slate-600">异常</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full bg-slate-400 animate-pulse-slow"></span>
                  <span class="text-slate-600">离线</span>
                </div>
              </div>
            </div>
            <div class="h-96">
              <MapView
                :stations="stations"
                :heatmap="heatmap"
                @station-click="handleStationClick"
              />
            </div>
            <p class="text-xs text-slate-500 mt-3">
              提示：点击监测点标记可查看详细历史数据。离线监测点数据已暂停更新，请注意缺失值不代表空气质量改善。
            </p>
          </div>

          <div class="bg-white rounded-xl p-5 card-shadow">
            <EventTimeline
              :construction-sites="constructionSites"
              :complaints="complaints"
              :traffic-data="trafficData"
            />
          </div>
        </div>

        <footer class="mt-8 pt-6 border-t border-slate-200">
          <div class="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <span>数据来源：城市环境监测站 · 气象部门 · 交通部门 · 12345 政务热线</span>
            </div>
            <div class="flex items-center gap-4">
              <span>投诉数据已脱敏聚合处理，不包含个人信息</span>
              <span>数据更新频率：5分钟</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>
