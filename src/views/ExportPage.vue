<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import { storeToRefs } from 'pinia'
import HeaderBar from '@/components/HeaderBar.vue'
import { exportData } from '@/api/aggregateApi'
import { POLLUTANT_CONFIG, DISTRICTS } from '@/types'

const router = useRouter()
const dataStore = useDataStore()
const { stations } = storeToRefs(dataStore)

const selectedStations = ref<string[]>([])
const selectedPollutants = ref<string[]>(['pm25', 'ozone', 'aqi'])
const selectedDistricts = ref<string[]>([])
const exportFormat = ref<'csv' | 'json'>('csv')
const dateRange = ref({
  start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0],
})

const isExporting = ref(false)
const exportPreview = ref<any[]>([])
const showPreview = ref(false)

const pollutantOptions = computed(() => {
  return Object.entries(POLLUTANT_CONFIG).map(([key, value]) => ({
    value: key,
    label: `${value.name} (${value.unit})`,
  }))
})

function goBack() {
  router.push('/')
}

function toggleStation(id: string) {
  const idx = selectedStations.value.indexOf(id)
  if (idx >= 0) {
    selectedStations.value.splice(idx, 1)
  } else {
    selectedStations.value.push(id)
  }
}

function togglePollutant(p: string) {
  const idx = selectedPollutants.value.indexOf(p)
  if (idx >= 0) {
    selectedPollutants.value.splice(idx, 1)
  } else {
    selectedPollutants.value.push(p)
  }
}

function toggleDistrict(d: string) {
  const idx = selectedDistricts.value.indexOf(d)
  if (idx >= 0) {
    selectedDistricts.value.splice(idx, 1)
  } else {
    selectedDistricts.value.push(d)
  }
}

async function generatePreview() {
  showPreview.value = true
  const stationIds = selectedStations.value.length > 0
    ? selectedStations.value
    : stations.value.slice(0, 3).map(s => s.id)

  const result = await exportData({
    stations: stationIds,
    timeRange: {
      start: `${dateRange.value.start}T00:00:00Z`,
      end: `${dateRange.value.end}T23:59:59Z`,
    },
    pollutants: selectedPollutants.value,
  }, exportFormat.value)

  if (exportFormat.value === 'json') {
    exportPreview.value = JSON.parse(result.content).slice(0, 5)
  } else {
    const lines = result.content.split('\n').slice(0, 6)
    exportPreview.value = lines.map(line => line.split(','))
  }
}

async function handleExport() {
  if (selectedPollutants.value.length === 0) {
    alert('请至少选择一项污染物指标')
    return
  }

  isExporting.value = true
  try {
    const stationIds = selectedStations.value.length > 0
      ? selectedStations.value
      : stations.value.map(s => s.id)

    const result = await exportData({
      stations: stationIds,
      timeRange: {
        start: `${dateRange.value.start}T00:00:00Z`,
        end: `${dateRange.value.end}T23:59:59Z`,
      },
      pollutants: selectedPollutants.value,
    }, exportFormat.value)

    const blob = new Blob([result.content], {
      type: exportFormat.value === 'csv' ? 'text/csv' : 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    isExporting.value = false
  }
}

onMounted(() => {
  if (stations.value.length === 0) {
    dataStore.loadStations()
  }
})
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <HeaderBar />

    <main class="flex-1 overflow-y-auto scrollbar-thin bg-slate-50">
      <div class="max-w-4xl mx-auto p-6">
        <button
          @click="goBack"
          class="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-6 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          返回仪表盘
        </button>

        <div class="bg-white rounded-xl p-6 card-shadow mb-6">
          <h1 class="text-2xl font-bold text-slate-800 mb-2">数据导出</h1>
          <p class="text-slate-500">
            配置导出参数，系统将自动进行脱敏处理。投诉记录仅包含聚合统计数据，不包含任何个人可识别信息。
          </p>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-xl p-6 card-shadow">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">导出配置</h2>

            <div class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">日期范围</label>
                <div class="flex items-center gap-3">
                  <input
                    v-model="dateRange.start"
                    type="date"
                    class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span class="text-slate-400">至</span>
                  <input
                    v-model="dateRange.end"
                    type="date"
                    class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  监测点
                  <span class="text-slate-400 font-normal">(不选则导出全部)</span>
                </label>
                <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin p-1">
                  <label
                    v-for="station in stations"
                    :key="station.id"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors"
                    :class="selectedStations.includes(station.id)
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedStations.includes(station.id)"
                      @change="toggleStation(station.id)"
                      class="sr-only"
                    />
                    <span class="text-sm">{{ station.name }}</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">污染物指标</label>
                <div class="flex flex-wrap gap-2">
                  <label
                    v-for="opt in pollutantOptions"
                    :key="opt.value"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors"
                    :class="selectedPollutants.includes(opt.value)
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedPollutants.includes(opt.value)"
                      @change="togglePollutant(opt.value)"
                      class="sr-only"
                    />
                    <span class="text-sm">{{ opt.label }}</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">导出格式</label>
                <div class="flex gap-3">
                  <label
                    class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors"
                    :class="exportFormat === 'csv'
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'"
                  >
                    <input
                      type="radio"
                      v-model="exportFormat"
                      value="csv"
                      class="sr-only"
                    />
                    <span class="text-sm font-medium">CSV</span>
                  </label>
                  <label
                    class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors"
                    :class="exportFormat === 'json'
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'"
                  >
                    <input
                      type="radio"
                      v-model="exportFormat"
                      value="json"
                      class="sr-only"
                    />
                    <span class="text-sm font-medium">JSON</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-sky-50 border border-sky-200 rounded-xl p-5">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sky-800 font-medium">隐私保护说明</p>
                <p class="text-sky-700 text-sm mt-1">
                  所有导出数据均已自动脱敏。公众投诉数据仅包含按日期和区域聚合的统计数量，不包含任何个人身份信息、联系方式或投诉原文内容。
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <button
              @click="generatePreview"
              class="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              预览数据
            </button>
            <button
              @click="handleExport"
              :disabled="isExporting || selectedPollutants.length === 0"
              class="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg v-if="isExporting" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isExporting ? '正在生成...' : '开始导出' }}</span>
            </button>
          </div>

          <div v-if="showPreview && exportPreview.length > 0" class="bg-white rounded-xl p-6 card-shadow">
            <h3 class="text-sm font-semibold text-slate-700 mb-3">数据预览（前5行）</h3>
            <div class="overflow-x-auto">
              <table v-if="exportFormat === 'csv'" class="w-full text-sm">
                <thead>
                  <tr>
                    <th
                      v-for="(cell, idx) in exportPreview[0]"
                      :key="idx"
                      class="text-left px-3 py-2 bg-slate-50 font-medium text-slate-600 border-b"
                    >
                      {{ cell }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIdx) in exportPreview.slice(1)" :key="rowIdx">
                    <td
                      v-for="(cell, cellIdx) in row"
                      :key="cellIdx"
                      class="px-3 py-2 border-b border-slate-100 text-slate-700 font-mono"
                    >
                      {{ cell }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <pre v-else class="text-xs bg-slate-50 p-4 rounded-lg overflow-x-auto">
{{ JSON.stringify(exportPreview, null, 2) }}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
