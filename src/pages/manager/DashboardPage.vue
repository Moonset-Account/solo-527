<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  TrendingDown,
  AlertCircle,
  Clock,
  MapPinCheck,
  Building2,
  Image,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from 'lucide-vue-next'
import { useDataStore } from '@/stores/data'
import { createLineChart, createBarChart } from '@/utils/charts'

const dataStore = useDataStore()
const router = useRouter()

const misuseChartRef = ref<HTMLElement | null>(null)
const collectionChartRef = ref<HTMLElement | null>(null)

const quickLinks = [
  { name: '误投趋势', path: '/manager/misuse', icon: TrendingDown, color: 'from-orange-500 to-red-500' },
  { name: '桶满报警', path: '/manager/full-alert', icon: AlertCircle, color: 'from-red-500 to-pink-500' },
  { name: '清运效率', path: '/manager/efficiency', icon: Clock, color: 'from-blue-500 to-cyan-500' },
  { name: '巡查覆盖', path: '/manager/inspection', icon: MapPinCheck, color: 'from-green-500 to-emerald-500' },
  { name: '社区对比', path: '/manager/community', icon: Building2, color: 'from-purple-500 to-violet-500' },
  { name: '照片审核', path: '/audit', icon: Image, color: 'from-amber-500 to-orange-500' }
]

const keyMetrics = computed(() => {
  const bins = dataStore.binPoints
  const approvedMisuse = dataStore.approvedMisuseRecords
  const nonHolidayLogs = dataStore.collectionLogs.filter(l => !l.isHoliday)
  const photos = dataStore.inspectionPhotos

  const avgMisuseRate = approvedMisuse.length > 0
    ? approvedMisuse.reduce((sum, r) => sum + r.misuseRate, 0) / approvedMisuse.length
    : 0

  const onTimeRate = nonHolidayLogs.length > 0
    ? nonHolidayLogs.filter(l => l.status === 'completed').length / nonHolidayLogs.length * 100
    : 0

  const inspectedBins = new Set(photos.map(p => p.binPointId)).size
  const inspectionRate = bins.length > 0 ? inspectedBins / bins.length * 100 : 0

  const normalRate = bins.length > 0
    ? bins.filter(b => b.status === 'normal').length / bins.length * 100
    : 0

  return [
    {
      label: '平均误投率',
      value: `${avgMisuseRate.toFixed(1)}%`,
      change: '-2.3%',
      trend: 'down' as const,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      label: '清运准时率',
      value: `${onTimeRate.toFixed(1)}%`,
      change: '+1.5%',
      trend: 'up' as const,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: '巡查覆盖率',
      value: `${inspectionRate.toFixed(1)}%`,
      change: '+5.2%',
      trend: 'up' as const,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: '桶点正常率',
      value: `${normalRate.toFixed(1)}%`,
      change: '+0.8%',
      trend: 'up' as const,
      color: 'text-teal-600',
      bg: 'bg-teal-50'
    }
  ]
})

const pendingTasks = computed(() => {
  return [
    {
      type: '待审核照片',
      count: dataStore.pendingPhotos.length,
      path: '/audit',
      urgency: dataStore.pendingPhotos.length > 10 ? 'high' : 'medium'
    },
    {
      type: '待处理报警',
      count: dataStore.pendingAlerts.length,
      path: '/manager/full-alert',
      urgency: dataStore.pendingAlerts.length > 5 ? 'high' : 'medium'
    },
    {
      type: '待回访桶点',
      count: dataStore.returnVisits.filter(v => v.status === 'pending').length,
      path: '/manager/inspection',
      urgency: 'low'
    }
  ]
})

function initCharts() {
  if (misuseChartRef.value) {
    const last14Days: Array<{ date: string; value: number }> = []
    const today = new Date()

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayRecords = dataStore.approvedMisuseRecords.filter(r => r.recordDate === dateStr)
      const avgRate = dayRecords.length > 0
        ? dayRecords.reduce((sum, r) => sum + r.misuseRate, 0) / dayRecords.length
        : 0

      last14Days.push({ date: dateStr, value: parseFloat(avgRate.toFixed(1)) })
    }

    createLineChart(misuseChartRef.value, last14Days, { color: '#f97316', height: 180 })
  }

  if (collectionChartRef.value) {
    const districts = [...new Set(dataStore.communities.map(c => c.district))]
    const districtData = districts.slice(0, 6).map(district => {
      const commIds = new Set(dataStore.communities.filter(c => c.district === district).map(c => c.id))
      const logs = dataStore.collectionLogs.filter(l => commIds.has(l.binPointId) && !l.isHoliday)
      const rate = logs.length > 0
        ? logs.filter(l => l.status === 'completed').length / logs.length * 100
        : 0
      return { label: district.slice(0, 3), value: parseFloat(rate.toFixed(1)) }
    })

    createBarChart(collectionChartRef.value, districtData, { color: '#3b82f6', height: 180 })
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  setTimeout(() => {
    initCharts()

    resizeObserver = new ResizeObserver(() => {
      initCharts()
    })

    if (misuseChartRef.value) resizeObserver.observe(misuseChartRef.value)
    if (collectionChartRef.value) resizeObserver.observe(collectionChartRef.value)
  }, 100)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">项目经理工作台</h1>
      <p class="text-gray-500 mt-1">实时掌握垃圾分类运营情况</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div
        v-for="metric in keyMetrics"
        :key="metric.label"
        class="card p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between mb-2">
          <span class="text-sm text-gray-500">{{ metric.label }}</span>
          <div :class="[metric.bg, 'w-8 h-8 rounded-lg flex items-center justify-center']">
            <component :is="metric.trend === 'up' ? ArrowUp : ArrowDown" :class="['w-4 h-4', metric.color]" />
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-900 mb-1">{{ metric.value }}</p>
        <div class="flex items-center gap-1">
          <span :class="['text-xs font-medium', metric.trend === 'up' ? 'text-green-600' : 'text-red-600']">
            {{ metric.change }}
          </span>
          <span class="text-xs text-gray-400">较上周</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <div
        v-for="link in quickLinks"
        :key="link.path"
        class="card-hover p-4 cursor-pointer"
        @click="router.push(link.path)"
      >
        <div :class="['w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', link.color]">
          <component :is="link.icon" class="w-5 h-5 text-white" />
        </div>
        <h3 class="text-sm font-semibold text-gray-900 mb-1">{{ link.name }}</h3>
        <p class="text-xs text-gray-500">点击查看详情</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-semibold text-gray-900">误投率趋势</h3>
              <p class="text-sm text-gray-500">近14天平均误投率变化</p>
            </div>
            <button
              class="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
              @click="router.push('/manager/misuse')"
            >
              查看详情 <ChevronRight class="w-4 h-4" />
            </button>
          </div>
          <div ref="misuseChartRef" class="w-full" />
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-semibold text-gray-900">各行政区清运准时率</h3>
              <p class="text-sm text-gray-500">排除节假日数据</p>
            </div>
            <button
              class="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
              @click="router.push('/manager/efficiency')"
            >
              查看详情 <ChevronRight class="w-4 h-4" />
            </button>
          </div>
          <div ref="collectionChartRef" class="w-full" />
        </div>
      </div>

      <div class="space-y-6">
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-4">待办事项</h3>
          <div class="space-y-3">
            <div
              v-for="task in pendingTasks"
              :key="task.type"
              class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              @click="router.push(task.path)"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-2 h-2 rounded-full',
                    task.urgency === 'high' ? 'bg-red-500 animate-pulse' :
                    task.urgency === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                  ]"
                />
                <span class="text-sm text-gray-700">{{ task.type }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  :class="[
                    'text-sm font-bold',
                    task.urgency === 'high' ? 'text-red-600' :
                    task.urgency === 'medium' ? 'text-amber-600' : 'text-green-600'
                  ]"
                >
                  {{ task.count }}
                </span>
                <ChevronRight class="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div class="card p-5 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-100">
          <h3 class="font-semibold text-gray-900 mb-2">快捷操作</h3>
          <p class="text-sm text-gray-600 mb-4">常用功能快速访问</p>
          <div class="space-y-2">
            <button
              class="w-full btn-primary justify-start"
              @click="router.push('/audit')"
            >
              <Image class="w-4 h-4 mr-2" />
              快速审核照片 ({{ dataStore.pendingPhotos.length }} 待审)
            </button>
            <button
              class="w-full btn-secondary justify-start"
              @click="router.push('/manager/full-alert')"
            >
              <AlertCircle class="w-4 h-4 mr-2" />
              处理桶满报警 ({{ dataStore.pendingAlerts.length }} 待处理)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
