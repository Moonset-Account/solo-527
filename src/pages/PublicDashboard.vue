<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Eye, Leaf, TrendingDown, Clock, MapPin, BarChart3, Download, RefreshCw, FileText, ShieldCheck, Loader2 } from 'lucide-vue-next'
import { createBarChart } from '@/utils/charts'
import { api } from '@/services/api'
import NavBar from '@/components/NavBar.vue'

const chartRef = ref<HTMLElement | null>(null)
const isRefreshing = ref(false)
const downloading = ref(false)
const loading = ref(true)
const lastSQL = ref('')

const publicData = ref<any>(null)
const districtChartData = ref<Array<{ label: string; value: number }>>([])

async function loadPublicData() {
  loading.value = true
  try {
    const res = await api.public.getReport()
    publicData.value = res.data
    lastSQL.value = res.sql
    districtChartData.value = (res.data.districts || []).map((d: any) => ({
      label: d.district.slice(0, 3),
      value: d.normalRate
    }))
  } catch (e) {
    console.error('Failed to load public report from ClickHouse API:', e)
  } finally {
    loading.value = false
  }
}

function refreshData() {
  isRefreshing.value = true
  loadPublicData().finally(() => { isRefreshing.value = false })
}

function downloadReport() {
  downloading.value = true
  const url = api.public.downloadCSV()
  const link = document.createElement('a')
  link.href = url
  link.download = `垃圾分类运营公开报表_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => { downloading.value = false }, 500)
}

function drawChart() {
  if (chartRef.value) {
    createBarChart(chartRef.value, districtChartData.value, { color: '#10b981', height: 300 })
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await loadPublicData()
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
            数据已脱敏聚合处理 · ClickHouse 实时查询
            <button
              class="ml-2 inline-flex items-center text-teal-600 hover:text-teal-700"
              :class="{ 'animate-spin': isRefreshing }"
              @click="refreshData"
            >
              <RefreshCw class="w-4 h-4" />
            </button>
          </p>
        </div>

        <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <ShieldCheck class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-sm font-medium text-amber-800">数据脱敏声明</p>
            <p class="text-xs text-amber-700 mt-1">
              本看板仅展示行政区级别的聚合统计数据，不含桶点精确定位、巡查照片、操作人员等敏感信息。
              所有误投率数据仅来源于审核通过的记录，清运准时率已自动排除节假日临时停运。
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mb-3">
              <MapPin class="w-6 h-6 text-teal-600" />
            </div>
            <p class="text-sm text-gray-500 mb-1">投放点总数</p>
            <p class="text-3xl font-bold text-gray-900">{{ publicData?.summary?.totalBins || '-' }}</p>
            <p class="text-xs text-gray-400 mt-1">个桶点</p>
          </div>

          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-3">
              <Leaf class="w-6 h-6 text-green-600" />
            </div>
            <p class="text-sm text-gray-500 mb-1">正常运行率</p>
            <p class="text-3xl font-bold text-green-600">{{ publicData?.summary?.normalRate || '-' }}%</p>
            <p class="text-xs text-gray-400 mt-1">运行良好</p>
          </div>

          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-3">
              <TrendingDown class="w-6 h-6 text-orange-600" />
            </div>
            <p class="text-sm text-gray-500 mb-1">平均误投率</p>
            <p class="text-3xl font-bold text-orange-600">{{ publicData?.summary?.avgMisuseRate || '-' }}%</p>
            <p class="text-xs text-gray-400 mt-1">仅审核通过数据</p>
          </div>

          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-3">
              <Clock class="w-6 h-6 text-blue-600" />
            </div>
            <p class="text-sm text-gray-500 mb-1">清运准时率</p>
            <p class="text-3xl font-bold text-blue-600">{{ publicData?.summary?.onTimeRate || '-' }}%</p>
            <p class="text-xs text-gray-400 mt-1">排除节假日停运</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">各行政区运行情况</h3>
                <p class="text-sm text-gray-500">按正常率排序 · 脱敏聚合数据</p>
              </div>
              <BarChart3 class="w-5 h-5 text-gray-400" />
            </div>
            <div ref="chartRef" class="w-full" />
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">行政区排名</h3>
                <p class="text-sm text-gray-500">按正常运行率排序 · 不含照片</p>
              </div>
            </div>
            <div class="space-y-3">
              <div
                v-for="(district, index) in [...(publicData?.districts || [])].sort((a, b) => b.normalRate - a.normalRate)"
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

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">各行政区误投率</h4>
            <div class="space-y-2">
              <div
                v-for="d in (publicData?.districts || [])"
                :key="d.district"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-600">{{ d.district }}</span>
                <span class="font-medium text-orange-600">{{ d.avgMisuseRate }}%</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">各行政区清运准时率</h4>
            <div class="space-y-2">
              <div
                v-for="d in (publicData?.districts || [])"
                :key="d.district"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-600">{{ d.district }}</span>
                <span class="font-medium text-blue-600">{{ d.onTimeRate }}%</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">各行政区桶点数</h4>
            <div class="space-y-2">
              <div
                v-for="d in (publicData?.districts || [])"
                :key="d.district"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-600">{{ d.district }}</span>
                <span class="font-medium text-gray-900">{{ d.binCount }} 个</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-6 md:p-8 text-white">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 class="text-xl font-bold mb-2">数据说明与报表下载</h3>
              <p class="text-white/80 text-sm max-w-xl">
                本看板展示城市垃圾分类运营的聚合统计数据，所有数据均经过脱敏处理，
                不包含具体桶点位置、个人信息和巡查照片。报表仅输出行政区级聚合数据。
              </p>
            </div>
            <button
              class="btn bg-white text-teal-700 hover:bg-gray-100 whitespace-nowrap"
              :disabled="downloading"
              @click="downloadReport"
            >
              <Download class="w-4 h-4 mr-2" />
              {{ downloading ? '生成中...' : '下载公开报表 (CSV)' }}
            </button>
          </div>
          <div class="mt-4 p-3 bg-white/10 rounded-lg">
            <div class="flex items-start gap-2">
              <FileText class="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p class="text-xs text-white/70">
                报表内容：行政区、桶点数、正常率、平均误投率（仅审核通过数据）、清运准时率（排除节假日）。
                不含：桶点坐标、巡查照片、操作人员信息、具体桶点名称。
              </p>
            </div>
          </div>
        </div>

        <div class="mt-8 text-center text-sm text-gray-400">
          <p>© 2024 城市智慧环卫平台 · 数据仅供参考 · 误投率仅统计审核通过记录 · 清运准时率已排除节假日临时停运</p>
        </div>
      </div>
    </div>
  </div>
</template>
