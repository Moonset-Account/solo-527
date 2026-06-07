<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Clock, Calendar, Filter, TrendingUp, Truck, Ban } from 'lucide-vue-next'
import { useDataStore } from '@/stores/data'
import { createLineChart, createBarChart } from '@/utils/charts'

const dataStore = useDataStore()

const trendChartRef = ref<HTMLElement | null>(null)
const windowChartRef = ref<HTMLElement | null>(null)
const communityChartRef = ref<HTMLElement | null>(null)

const excludeHolidays = ref(true)
const selectedPeriod = ref<'7' | '14' | '30'>('30')
const selectedCommunity = ref<string>('all')

const periods = [
  { value: '7', label: '近7天' },
  { value: '14', label: '近14天' },
  { value: '30', label: '近30天' }
]

const filteredLogs = computed(() => {
  let logs = dataStore.collectionLogs

  if (excludeHolidays.value) {
    logs = logs.filter(l => !l.isHoliday)
  }

  if (selectedCommunity.value !== 'all') {
    const binIds = new Set(
      dataStore.getBinPointsByCommunity(selectedCommunity.value).map(b => b.id)
    )
    logs = logs.filter(l => binIds.has(l.binPointId))
  }

  const days = parseInt(selectedPeriod.value)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  logs = logs.filter(l => new Date(l.planTime) >= cutoff)

  return logs
})

const trendData = computed(() => {
  const days = parseInt(selectedPeriod.value)
  const result: Array<{ date: string; value: number }> = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayLogs = filteredLogs.value.filter(l => {
      const logDate = new Date(l.planTime).toISOString().split('T')[0]
      return logDate === dateStr
    })

    const rate = dayLogs.length > 0
      ? dayLogs.filter(l => l.status === 'completed').length / dayLogs.length * 100
      : 0

    result.push({ date: dateStr, value: parseFloat(rate.toFixed(1)) })
  }

  return result
})

const timeWindowData = computed(() => {
  const windows = ['早班 06:00-08:00', '中班 12:00-14:00', '晚班 18:00-20:00']

  return windows.map(window => {
    const windowLogs = filteredLogs.value.filter(l => l.timeWindow === window)
    const rate = windowLogs.length > 0
      ? windowLogs.filter(l => l.status === 'completed').length / windowLogs.length * 100
      : 0
    return {
      label: window.split(' ')[0],
      value: parseFloat(rate.toFixed(1))
    }
  })
})

const communityEfficiency = computed(() => {
  return dataStore.communities.slice(0, 10).map(comm => {
    const binIds = new Set(dataStore.getBinPointsByCommunity(comm.id).map(b => b.id))
    const commLogs = filteredLogs.value.filter(l => binIds.has(l.binPointId))
    const rate = commLogs.length > 0
      ? commLogs.filter(l => l.status === 'completed').length / commLogs.length * 100
      : 0
    return {
      id: comm.id,
      name: comm.name,
      rate: parseFloat(rate.toFixed(1)),
      total: commLogs.length,
      completed: commLogs.filter(l => l.status === 'completed').length
    }
  }).sort((a, b) => b.rate - a.rate)
})

const summary = computed(() => {
  const logs = filteredLogs.value
  const completed = logs.filter(l => l.status === 'completed')
  const delayed = logs.filter(l => l.status === 'delayed')

  const onTimeRate = logs.length > 0
    ? (completed.length / logs.length * 100).toFixed(1)
    : '0'

  const holidayCount = dataStore.collectionLogs.filter(l => l.isHoliday).length

  const avgDelay = delayed.length > 0
    ? delayed.reduce((sum, l) => {
      if (l.actualTime && l.planTime) {
        const diff = new Date(l.actualTime).getTime() - new Date(l.planTime).getTime()
        return sum + Math.max(0, diff / 60000)
      }
      return sum
    }, 0) / delayed.length
    : 0

  return {
    total: logs.length,
    completed: completed.length,
    delayed: delayed.length,
    onTimeRate,
    holidayCount,
    avgDelay: avgDelay.toFixed(0)
  }
})

function drawCharts() {
  if (trendChartRef.value) {
    createLineChart(trendChartRef.value, trendData.value, { color: '#3b82f6', height: 280 })
  }

  if (windowChartRef.value) {
    createBarChart(windowChartRef.value, timeWindowData.value, { color: '#0f766e', height: 250 })
  }

  if (communityChartRef.value) {
    const data = communityEfficiency.value.slice(0, 8).map(c => ({
      label: c.name.slice(0, 4),
      value: c.rate
    }))
    createBarChart(communityChartRef.value, data, { color: '#8b5cf6', height: 300, horizontal: true })
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  setTimeout(() => {
    drawCharts()

    resizeObserver = new ResizeObserver(() => {
      drawCharts()
    })

    if (trendChartRef.value) resizeObserver.observe(trendChartRef.value)
    if (windowChartRef.value) resizeObserver.observe(windowChartRef.value)
    if (communityChartRef.value) resizeObserver.observe(communityChartRef.value)
  }, 100)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch([excludeHolidays, selectedPeriod, selectedCommunity], () => {
  drawCharts()
})
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Clock class="w-7 h-7 text-blue-500" />
        清运效率分析
      </h1>
      <p class="text-gray-500 mt-1">分析垃圾清运准时率和时间窗执行情况</p>
    </div>
  </div>

  <div class="card p-4 mb-6">
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <Calendar class="w-4 h-4 text-gray-400" />
        <span class="text-sm text-gray-600">时间范围</span>
        <div class="flex bg-gray-100 rounded-lg p-0.5">
          <button
            v-for="p in periods"
            :key="p.value"
            :class="[
              'px-3 py-1 text-sm rounded-md transition-colors',
              selectedPeriod === p.value
                ? 'bg-white text-teal-700 font-medium shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            ]"
            @click="selectedPeriod = p.value as any"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Filter class="w-4 h-4 text-gray-400" />
        <span class="text-sm text-gray-600">社区</span>
        <select v-model="selectedCommunity" class="select !py-1 !text-sm !w-40">
          <option value="all">全部社区</option>
          <option v-for="c in dataStore.communities" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>

      <label class="flex items-center gap-2 cursor-pointer ml-auto">
        <div :class="[
          'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
          excludeHolidays ? 'bg-teal-600' : 'bg-gray-200'
        ]">
          <input
            v-model="excludeHolidays"
            type="checkbox"
            class="sr-only"
          />
          <span
            :class="[
              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              excludeHolidays ? 'translate-x-4' : 'translate-x-0'
            ]"
          />
        </div>
        <Ban class="w-4 h-4 text-gray-500" />
        <span class="text-sm text-gray-600">排除节假日停运</span>
      </label>
    </div>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div class="card p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Truck class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">清运总次数</p>
          <p class="text-xl font-bold text-gray-900">{{ summary.total }}</p>
        </div>
      </div>
    </div>
    <div class="card p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <TrendingUp class="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">准时率</p>
          <p class="text-xl font-bold text-green-600">{{ summary.onTimeRate }}%</p>
        </div>
      </div>
    </div>
    <div class="card p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Clock class="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">平均延误</p>
          <p class="text-xl font-bold text-amber-600">{{ summary.avgDelay }} 分</p>
        </div>
      </div>
    </div>
    <div class="card p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <Ban class="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">延误次数</p>
          <p class="text-xl font-bold text-red-600">{{ summary.delayed }}</p>
        </div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <div class="card p-5">
      <h3 class="font-semibold text-gray-900 mb-4">清运准时率趋势</h3>
      <p class="text-sm text-gray-500 mb-4">
        {{ excludeHolidays ? '已排除节假日数据' : '包含所有日期' }}
      </p>
      <div ref="trendChartRef" class="w-full" />
    </div>

    <div class="card p-5">
      <h3 class="font-semibold text-gray-900 mb-4">各时段清运准时率</h3>
      <div ref="windowChartRef" class="w-full" />
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-5">
      <h3 class="font-semibold text-gray-900 mb-4">社区准时率排名</h3>
      <div ref="communityChartRef" class="w-full" />
    </div>

    <div class="card p-5">
      <h3 class="font-semibold text-gray-900 mb-4">详细数据</h3>
      <div class="overflow-auto max-h-80">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="text-left px-3 py-2 font-medium text-gray-600">排名</th>
              <th class="text-left px-3 py-2 font-medium text-gray-600">社区</th>
              <th class="text-right px-3 py-2 font-medium text-gray-600">准时率</th>
              <th class="text-right px-3 py-2 font-medium text-gray-600">完成/总计</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(comm, index) in communityEfficiency" :key="comm.id" class="hover:bg-gray-50">
              <td class="px-3 py-2.5">
                <span
                  :class="[
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold inline-flex',
                    index === 0 ? 'bg-green-100 text-green-600' :
                    index === 1 ? 'bg-teal-100 text-teal-600' :
                    index === 2 ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  ]"
                >
                  {{ index + 1 }}
                </span>
              </td>
              <td class="px-3 py-2.5 font-medium text-gray-900">{{ comm.name }}</td>
              <td class="px-3 py-2.5 text-right">
                <span
                  :class="[
                    'font-medium',
                    comm.rate >= 95 ? 'text-green-600' :
                    comm.rate >= 85 ? 'text-amber-600' : 'text-red-600'
                  ]"
                >
                  {{ comm.rate }}%
                </span>
              </td>
              <td class="px-3 py-2.5 text-right text-gray-600">
                {{ comm.completed }} / {{ comm.total }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
</template>
