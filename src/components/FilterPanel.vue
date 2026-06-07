<script setup lang="ts">
import { computed } from 'vue'
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
const { stations } = storeToRefs(dataStore)

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
              @click="setTimeRange(preset.hours)"
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
            监测点
            <span class="text-slate-400 font-normal">({{ criteria.stations.length || '全部' }})</span>
          </label>
          <div class="space-y-1 max-h-48 overflow-y-auto scrollbar-thin pr-1">
            <label
              v-for="station in stations"
              :key="station.id"
              class="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
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
              <span class="text-sm text-slate-700 truncate">{{ station.name }}</span>
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
              class="px-2.5 py-1 text-xs rounded-full transition-colors"
              :class="criteria.districts.includes(district)
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              {{ district }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">事件类型</label>
          <div class="space-y-1">
            <label class="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                :checked="criteria.eventTypes.includes('construction')"
                @change="() => {}"
                class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="w-3 h-3 rounded-full bg-amber-500"></span>
              <span class="text-sm text-slate-700">工地施工</span>
            </label>
            <label class="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                :checked="criteria.eventTypes.includes('complaint')"
                @change="() => {}"
                class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="w-3 h-3 rounded-full bg-rose-500"></span>
              <span class="text-sm text-slate-700">公众投诉</span>
            </label>
            <label class="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                :checked="criteria.eventTypes.includes('traffic')"
                @change="() => {}"
                class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="w-3 h-3 rounded-full bg-blue-500"></span>
              <span class="text-sm text-slate-700">车流量</span>
            </label>
          </div>
        </div>

        <button
          @click="applyFilters"
          class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          应用筛选
        </button>
      </div>
    </div>
  </aside>
</template>
