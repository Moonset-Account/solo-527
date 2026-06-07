<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { Eye, Leaf, TrendingDown, Clock, MapPin, BarChart3, Download, RefreshCw } from 'lucide-vue-next'
import { useDataStore } from '@/stores/data'
import { createBarChart } from '@/utils/charts'
import NavBar from '@/components/NavBar.vue'

const dataStore = useDataStore()
const chartRef = ref<HTMLElement | null>(null)
const isRefreshing = ref(false)

const publicData = computed(() => dataStore.getAggregatedPublicData())

const districtChartData = computed(() => {
  return publicData.value.districtStats.map(d => ({
    label: d.district.slice(0, 3),
    value: d.normalRate
  }))
})

const lastUpdateTime = ref(new Date().toLocaleString('zh-CN'))

function refreshData() {
  isRefreshing.value = true
  setTimeout(() => {
    lastUpdateTime.value = new Date().toLocaleString('zh-CN')
    isRefreshing.value = false
  }, 1000)
}

function drawChart() {
  if (chartRef.value) {
    createBarChart(chartRef.value, districtChartData.value, { color: '#10b981', height: 300 })
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  setTimeout(() => {
    drawChart()
    resizeObserver = new ResizeObserver(drawChart)
    if (chartRef.value) resizeObserver.observe(chartRef.value)
  }, 100)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(districtChartData, () => {
  drawChart()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex flex-col">
    <NavBar />

    <div class="flex-1 p-4 md:p-8">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
            <Eye class="w-5 h-5 text-teal-600" />
            <span class="text-sm font-medium text-gray-600">公开数据看板</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            城市垃圾分类运营数据
          </h1>
          <p class="text-gray-500">
            数据已脱敏聚合处理 · 最后更新: {{ lastUpdateTime }}
            <button
              class="ml-2 inline-flex items-center text-teal-600 hover:text-teal-700"
              :class="{ 'animate-spin': isRefreshing }"
              @click="refreshData"
            >
              <RefreshCw class="w-4 h-4" />
            </button>
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mb-3">
              <MapPin class="w-6 h-6 text-teal-600" />
            </div>
            <p class="text-sm text-gray-500 mb-1">投放点总数</p>
            <p class="text-3xl font-bold text-gray-900">{{ publicData.totalBins }}</p>
            <p class="text-xs text-gray-400 mt-1">个桶点</p>
          </div>

          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-3">
              <Leaf class="w-6 h-6 text-green-600" />
            </div>
            <p class="text-sm text-gray-500 mb-1">正常运行率</p>
            <p class="text-3xl font-bold text-green-600">{{ publicData.normalRate }}%</p>
            <p class="text-xs text-gray-400 mt-1">运行良好</p>
          </div>

          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-3">
              <TrendingDown class="w-6 h-6 text-orange-600" />
            </div>
            <p class="text-sm text-gray-500 mb-1">平均误投率</p>
            <p class="text-3xl font-bold text-orange-600">{{ publicData.avgMisuseRate }}%</p>
            <p class="text-xs text-gray-400 mt-1">持续改善中</p>
          </div>

          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-3">
              <Clock class="w-6 h-6 text-blue-600" />
            </div>
            <p class="text-sm text-gray-500 mb-1">清运准时率</p>
            <p class="text-3xl font-bold text-blue-600">{{ publicData.onTimeRate }}%</p>
            <p class="text-xs text-gray-400 mt-1">排除节假日</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">各行政区运行情况</h3>
                <p class="text-sm text-gray-500">按正常率排序</p>
              </div>
              <BarChart3 class="w-5 h-5 text-gray-400" />
            </div>
            <div ref="chartRef" class="w-full" />
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">行政区排名</h3>
                <p class="text-sm text-gray-500">按正常运行率排序</p>
              </div>
            </div>
            <div class="space-y-3">
              <div
                v-for="(district, index) in [...publicData.districtStats].sort((a, b) => b.normalRate - a.normalRate)"
                :key="district.district"
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                    index === 0 ? 'bg-amber-100 text-amber-600' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-500'
                  ]"
                >
                  {{ index + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-gray-900">{{ district.district }}</span>
                    <span class="text-sm font-bold text-teal-600">{{ district.normalRate }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2">
                    <div
                      class="h-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all"
                      :style="{ width: `${district.normalRate}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-6 md:p-8 text-white">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 class="text-xl font-bold mb-2">数据说明</h3>
              <p class="text-white/80 text-sm max-w-xl">
                本看板展示城市垃圾分类运营的聚合统计数据，所有数据均经过脱敏处理，
                不包含具体桶点位置、个人信息和巡查照片。数据每日自动更新，
                仅供公众了解垃圾分类整体运营情况。
              </p>
            </div>
            <button class="btn bg-white text-teal-700 hover:bg-gray-100 whitespace-nowrap">
              <Download class="w-4 h-4 mr-2" />
              下载公开报表
            </button>
          </div>
        </div>

        <div class="mt-8 text-center text-sm text-gray-400">
          <p>© 2024 城市智慧环卫平台 · 数据仅供参考</p>
        </div>
      </div>
    </div>
  </div>
</template>
