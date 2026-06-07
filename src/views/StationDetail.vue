<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import { storeToRefs } from 'pinia'
import HeaderBar from '@/components/HeaderBar.vue'
import TimeSeriesChart from '@/components/TimeSeriesChart.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()

const { stations, timeSeries, latestReadings } = storeToRefs(dataStore)

const timeRange = ref('24h')
const timeRangeOptions = [
  { label: '24小时', value: '24h', hours: 24 },
  { label: '7天', value: '7d', hours: 24 * 7 },
  { label: '30天', value: '30d', hours: 24 * 30 },
]

const stationId = computed(() => route.params.id as string)

const station = computed(() => {
  return stations.value.find(s => s.id === stationId.value)
})

const stationReadings = computed(() => {
  return timeSeries.value.filter(r => r.stationId === stationId.value)
})

const latestReading = computed(() => {
  return latestReadings.value.get(stationId.value)
})

const statusConfig = {
  online: { label: '在线', color: 'bg-green-100 text-green-700 border-green-200' },
  warning: { label: '异常', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  offline: { label: '离线', color: 'bg-red-100 text-red-700 border-red-200' },
}

function goBack() {
  router.push('/')
}

function loadTimeData() {
  const opt = timeRangeOptions.find(o => o.value === timeRange.value)
  if (opt) {
    const end = new Date()
    const start = new Date(end.getTime() - opt.hours * 60 * 60 * 1000)
    dataStore.loadTimeSeries({
      stations: [stationId.value],
      pollutants: ['pm25', 'pm10', 'ozone', 'no2', 'aqi'],
      timeRange: { start: start.toISOString(), end: end.toISOString() },
    })
  }
}

onMounted(() => {
  if (stations.value.length === 0) {
    dataStore.loadStations()
  }
  loadTimeData()
})
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <HeaderBar />

    <main class="flex-1 overflow-y-auto scrollbar-thin bg-slate-50">
      <div class="max-w-6xl mx-auto p-6">
        <button
          @click="goBack"
          class="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-6 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          返回仪表盘
        </button>

        <div v-if="station" class="bg-white rounded-xl p-6 card-shadow mb-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-2xl font-bold text-slate-800">{{ station.name }}</h1>
                <span
                  class="px-3 py-1 text-sm font-medium rounded-full border"
                  :class="statusConfig[station.status].color"
                >
                  {{ statusConfig[station.status].label }}
                </span>
              </div>
              <p class="text-slate-500 mt-2">
                所属区域：{{ station.district }}
                <span class="mx-2">·</span>
                最后上报：{{ dayjs(station.lastUpdate).format('YYYY-MM-DD HH:mm:ss') }}
              </p>
            </div>

            <div v-if="latestReading" class="flex gap-6">
              <div class="text-center">
                <div class="text-4xl font-bold font-mono text-primary-600">{{ latestReading.aqi }}</div>
                <div class="text-sm text-slate-500 mt-1">AQI</div>
              </div>
              <div class="text-center">
                <div class="text-4xl font-bold font-mono text-red-500">{{ latestReading.pm25 }}</div>
                <div class="text-sm text-slate-500 mt-1">PM2.5</div>
              </div>
              <div class="text-center">
                <div class="text-4xl font-bold font-mono text-green-500">{{ latestReading.ozone }}</div>
                <div class="text-sm text-slate-500 mt-1">臭氧</div>
              </div>
            </div>
          </div>

          <div v-if="station.status === 'offline'" class="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p class="text-amber-800 font-medium">该监测点当前处于离线状态</p>
                <p class="text-amber-700 text-sm mt-1">数据更新已暂停，缺失的数据不代表空气质量有所改善，请参考其他在线监测点的数据。</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 card-shadow">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-slate-800">历史数据趋势</h2>
            <div class="flex gap-2">
              <button
                v-for="opt in timeRangeOptions"
                :key="opt.value"
                @click="timeRange = opt.value; loadTimeData()"
                class="px-4 py-2 text-sm rounded-lg transition-colors"
                :class="timeRange === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="h-96">
            <TimeSeriesChart
              :data="stationReadings"
              :pollutants="['pm25', 'pm10', 'ozone', 'no2', 'aqi']"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
