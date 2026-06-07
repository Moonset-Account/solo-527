<script setup lang="ts">
import { computed, watch } from 'vue'
import { useFilterStore } from '@/stores/filterStore'
import { useDataStore } from '@/stores/dataStore'
import { storeToRefs } from 'pinia'
import { POLLUTANT_CONFIG, DISTRICTS } from '@/types'

const emit = defineEmits<{
  (e: 'apply'): void
}>()

const filterStore = useFilterStore()
const dataStore = useDataStore()
const { criteria } = storeToRefs(filterStore)
const { stations, linkedFilters, constructionSites } = storeToRefs(dataStore)

const pollutantOptions = computed(() => {
  return Object.entries(POLLUTANT_CONFIG).map(([key, value]) => ({
    value: key,
    label: value.name,
    color: value.color,
  }))
})

const timeRangePresets = [
  { label: '最近24小时', hours: 24 },
  { label: '最近7天', hours: 24 * 7 },
  { label: '最近30天', hours: 24 * 30 },
]

const availableStations = computed(() => {
  if (criteria.value.districts.length === 0) {
    return stations.value
  }
  return stations.value.filter(s => criteria.value.districts.includes(s.district))
})

const districtComplaintCount = computed(() => {
  if (!linkedFilters.value) return new Map()
  return linkedFilters.value.districtComplaintCounts
})

const districtConstructionCount = computed(() => {
  if (!linkedFilters.value) return new Map()
  return linkedFilters.value.districtConstructionCount
})

watch(() => criteria.value.districts, (newDistricts) => {
  if (newDistricts.length > 0) {
    const availableIds = stations.value
      .filter(s => newDistricts.includes(s.district))
      .map(s => s.id)
    const filtered = criteria.value.stations.filter(id => availableIds.includes(id))
    if (filtered.length !== criteria.value.stations.length) {
      filterStore.setStations(filtered)
    }
  }
}, { deep: true })

function toggleStation(stationId: string) {
  const current = [...criteria.value.stations]
  const idx = current.indexOf(stationId)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(stationId)
  }
  filterStore.setStations(current)
}

function togglePollutant(pollutant: string) {
  const current = [...criteria.value.pollutants]
  const idx = current.indexOf(pollutant)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(pollutant)
  }
  filterStore.setPollutants(current)
}

function toggleDistrict(district: string) {
  const current = [...criteria.value.districts]
  const idx = current.indexOf(district)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(district)
  }
  filterStore.setDistricts(current)
}

function setTimeRange(hours: number) {
  const end = new Date()
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000)
  filterStore.setTimeRange(start.toISOString(), end.toISOString())
}

function resetFilters() {
  filterStore.reset()
}

function applyFilters() {
  emit('apply')
}
</script>

<template>
  <aside class="w-72 bg-white border-r border-slate-200 overflow-y-auto scrollbar-thin flex-shrink-0">
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-bold text-slate-800">筛选条件</h2>
        <button
          @click="resetFilters"
          class="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          重置
        </button>
      </div>

      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">时间范围</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in timeRangePresets"
              :key="preset.hours"
              @click="setTimeRange(preset.hours); applyFilters()"
              class="px-3 py-1.5 text-xs rounded-md border transition-colors"
              :class="criteria.timeRange.end === new Date(Date.now() - preset.hours * 60 * 60 * 1000).toISOString()
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-primary-400'"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            污染物指标
            <span class="text-slate-400 font-normal">({{ criteria.pollutants.length }}项)</span>
          </label>
          <div class="space-y-1">
            <label
              v-for="opt in pollutantOptions"
              :key="opt.value"
              class="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                :checked="criteria.pollutants.includes(opt.value)"
                @change="togglePollutant(opt.value)"
                class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{ backgroundColor: opt.color }"
              ></span>
              <span class="text-sm text-slate-700">{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            行政街区
            <span class="text-slate-400 font-normal">({{ criteria.districts.length || '全部' }})</span>
          </label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="district in DISTRICTS"
              :key="district"
              @click="toggleDistrict(district)"
              class="px-2.5 py-1 text-xs rounded-full transition-colors relative group"
              :class="criteria.districts.includes(district)
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              {{ district }}
              <span
                v-if="districtComplaintCount.get(district) || districtConstructionCount.get(district)"
                class="absolute -top-1 -right-1 flex items-center justify-center"
              >
                <span
                  v-if="districtComplaintCount.get(district)"
                  class="w-2 h-2 rounded-full bg-rose-500"
                  :title="`投诉: ${districtComplaintCount.get(district)}件`"
                ></span>
                <span
                  v-if="districtConstructionCount.get(district)"
                  class="w-2 h-2 rounded-full bg-amber-500 ml-0.5"
                  :title="`工地: ${districtConstructionCount.get(district)}个`"
                ></span>
              </span>
            </button>
          </div>
          <p class="text-xs text-slate-400 mt-2">
            <span class="inline-flex items-center gap-1 mr-3">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span> 有投诉
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span> 有工地
            </span>
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            监测点
            <span class="text-slate-400 font-normal">({{ criteria.stations.length || '全部' }}/{{ availableStations.length }})</span>
          </label>
          <div class="space-y-1 max-h-48 overflow-y-auto scrollbar-thin pr-1">
            <label
              v-for="station in availableStations"
              :key="station.id"
              class="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
              :class="{ 'opacity-50': criteria.districts.length > 0 && !criteria.districts.includes(station.district) }"
            >
              <input
                type="checkbox"
                :checked="criteria.stations.includes(station.id)"
                @change="toggleStation(station.id)"
                class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span
                class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                :class="{
                  'bg-green-500': station.status === 'online',
                  'bg-yellow-500': station.status === 'warning',
                  'bg-red-500 animate-pulse-slow': station.status === 'offline',
                }"
              ></span>
              <div class="flex-1 min-w-0">
                <span class="text-sm text-slate-700 truncate block">{{ station.name }}</span>
                <span class="text-xs text-slate-400">{{ station.district }}</span>
              </div>
            </label>
          </div>
          <p v-if="criteria.districts.length > 0" class="text-xs text-slate-400 mt-2">
            已按选定街区过滤监测点
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">事件类型</label>
          <div class="space-y-1">
            <label class="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                :checked="criteria.eventTypes.includes('construction')"
                @change="() => {
                  const types = [...criteria.eventTypes]
                  const idx = types.indexOf('construction')
                  idx >= 0 ? types.splice(idx, 1) : types.push('construction')
                  filterStore.setEventTypes(types)
                }"
                class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="w-3 h-3 rounded-full bg-amber-500"></span>
              <div class="flex-1">
                <span class="text-sm text-slate-700">工地施工</span>
                <span class="text-xs text-slate-400 ml-2">{{ constructionSites.length }} 个进行中</span>
              </div>
            </label>
            <label class="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                :checked="criteria.eventTypes.includes('complaint')"
                @change="() => {
                  const types = [...criteria.eventTypes]
                  const idx = types.indexOf('complaint')
                  idx >= 0 ? types.splice(idx, 1) : types.push('complaint')
                  filterStore.setEventTypes(types)
                }"
                class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="w-3 h-3 rounded-full bg-rose-500"></span>
              <div class="flex-1">
                <span class="text-sm text-slate-700">公众投诉</span>
                <span class="text-xs text-slate-400 ml-2">仅展示聚合计数</span>
              </div>
            </label>
            <label class="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                :checked="criteria.eventTypes.includes('traffic')"
                @change="() => {
                  const types = [...criteria.eventTypes]
                  const idx = types.indexOf('traffic')
                  idx >= 0 ? types.splice(idx, 1) : types.push('traffic')
                  filterStore.setEventTypes(types)
                }"
                class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="w-3 h-3 rounded-full bg-blue-500"></span>
              <div class="flex-1">
                <span class="text-sm text-slate-700">车流量</span>
                <span class="text-xs text-slate-400 ml-2">按街区聚合</span>
              </div>
            </label>
          </div>
        </div>

        <button
          @click="applyFilters"
          class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg v-if="dataStore.loading.timeSeries" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ dataStore.loading.timeSeries ? '加载中...' : '应用筛选' }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>
