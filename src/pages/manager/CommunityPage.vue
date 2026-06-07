<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Building2, Trophy, Filter, BarChart3, ArrowUpDown } from 'lucide-vue-next'
import { useDataStore } from '@/stores/data'
import { createBarChart } from '@/utils/charts'

const dataStore = useDataStore()

const chartRef = ref<HTMLElement | null>(null)
const sortBy = ref<'misuseRate' | 'onTimeRate' | 'inspectionRate'>('misuseRate')
const sortOrder = ref<'asc' | 'desc'>('desc')
const excludeHolidays = ref(true)

const communityRankings = computed(() => {
  return dataStore.communities.map(comm => {
    const stats = dataStore.getCommunityStats(comm.id, excludeHolidays.value)

    return {
      id: comm.id,
      name: comm.name,
      district: comm.district,
      householdCount: comm.householdCount,
      binCount: stats.binCount,
      avgMisuseRate: stats.avgMisuseRate,
      onTimeRate: stats.onTimeRate,
      inspectionRate: stats.inspectionRate,
      alertCount: stats.alertCount,
      pendingAlertCount: stats.pendingAlertCount
    }
  }).sort((a, b) => {
    let comparison = 0
    switch (sortBy.value) {
      case 'misuseRate':
        comparison = a.avgMisuseRate - b.avgMisuseRate
        break
      case 'onTimeRate':
        comparison = a.onTimeRate - b.onTimeRate
        break
      case 'inspectionRate':
        comparison = a.inspectionRate - b.inspectionRate
        break
    }
    return sortOrder.value === 'desc' ? -comparison : comparison
  })
})

const chartData = computed(() => {
  return communityRankings.value.slice(0, 10).map(c => ({
    label: c.name.slice(0, 4),
    value: sortBy.value === 'misuseRate' ? c.avgMisuseRate :
           sortBy.value === 'onTimeRate' ? c.onTimeRate : c.inspectionRate
  }))
})

const chartColor = computed(() => {
  return sortBy.value === 'misuseRate' ? '#ef4444' :
         sortBy.value === 'onTimeRate' ? '#3b82f6' : '#10b981'
})

const sortLabels = {
  misuseRate: '误投率',
  onTimeRate: '清运准时率',
  inspectionRate: '巡查覆盖率'
}

function toggleSort(field: typeof sortBy.value) {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = field === 'misuseRate' ? 'desc' : 'desc'
  }
}

function drawChart() {
  if (chartRef.value) {
    createBarChart(chartRef.value, chartData.value, { color: chartColor.value, height: 320, horizontal: true })
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

watch([sortBy, sortOrder, excludeHolidays], () => {
  drawChart()
})
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 class="w-7 h-7 text-purple-500" />
          社区对比排名
        </h1>
        <p class="text-gray-500 mt-1">
          <Trophy class="w-4 h-4 inline mr-1 text-amber-500" />
          基于审核通过的数据计算排名
        </p>
      </div>
    </div>

    <div class="card p-4 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-gray-400" />
          <span class="text-sm text-gray-600">排序指标</span>
          <div class="flex gap-1">
            <button
              v-for="(label, key) in sortLabels"
              :key="key"
              :class="[
                'px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1',
                sortBy === key
                  ? 'bg-teal-100 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              ]"
              @click="toggleSort(key as any)"
            >
              {{ label }}
              <ArrowUpDown class="w-3 h-3" />
            </button>
          </div>
        </div>

        <label class="flex items-center gap-2 cursor-pointer ml-auto">
          <input
            v-model="excludeHolidays"
            type="checkbox"
            class="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span class="text-sm text-gray-600">排除节假日数据</span>
        </label>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div class="lg:col-span-2 card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">社区{{ sortLabels[sortBy] }}排名 TOP 10</h3>
        <div ref="chartRef" class="w-full" />
      </div>

      <div class="card p-5 bg-gradient-to-br from-amber-50 to-orange-50">
        <div class="flex items-center gap-3 mb-4">
          <Trophy class="w-8 h-8 text-amber-500" />
          <div>
            <h3 class="font-semibold text-gray-900">前三名</h3>
            <p class="text-sm text-gray-500">最佳表现社区</p>
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-for="(comm, index) in communityRankings.slice(0, 3)"
            :key="comm.id"
            class="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm"
          >
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                index === 0 ? 'bg-amber-100 text-amber-600' :
                index === 1 ? 'bg-gray-100 text-gray-600' :
                'bg-orange-100 text-orange-600'
              ]"
            >
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">{{ comm.name }}</p>
              <p class="text-xs text-gray-500">{{ comm.district }}</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-gray-900">
                {{ sortBy === 'misuseRate' ? `${comm.avgMisuseRate}%` :
                   sortBy === 'onTimeRate' ? `${comm.onTimeRate}%` :
                   `${comm.inspectionRate}%` }}
              </p>
              <p class="text-xs text-gray-500">{{ sortLabels[sortBy] }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600">排名</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">社区</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">行政区</th>
              <th
                class="text-right px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                @click="toggleSort('misuseRate')"
              >
                <span class="flex items-center justify-end gap-1">
                  平均误投率
                  <ArrowUpDown class="w-3 h-3" />
                </span>
              </th>
              <th
                class="text-right px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                @click="toggleSort('onTimeRate')"
              >
                <span class="flex items-center justify-end gap-1">
                  清运准时率
                  <ArrowUpDown class="w-3 h-3" />
                </span>
              </th>
              <th
                class="text-right px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                @click="toggleSort('inspectionRate')"
              >
                <span class="flex items-center justify-end gap-1">
                  巡查覆盖率
                  <ArrowUpDown class="w-3 h-3" />
                </span>
              </th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">桶点数</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">待处理报警</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(comm, index) in communityRankings" :key="comm.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <span
                  :class="[
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold inline-flex',
                    index === 0 ? 'bg-amber-100 text-amber-600' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-500'
                  ]"
                >
                  {{ index + 1 }}
                </span>
              </td>
              <td class="px-4 py-3 font-medium text-gray-900">{{ comm.name }}</td>
              <td class="px-4 py-3 text-gray-600">{{ comm.district }}</td>
              <td class="px-4 py-3 text-right">
                <span
                  :class="[
                    'font-medium',
                    comm.avgMisuseRate < 10 ? 'text-green-600' :
                    comm.avgMisuseRate < 15 ? 'text-amber-600' : 'text-red-600'
                  ]"
                >
                  {{ comm.avgMisuseRate }}%
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <span
                  :class="[
                    'font-medium',
                    comm.onTimeRate >= 95 ? 'text-green-600' :
                    comm.onTimeRate >= 85 ? 'text-amber-600' : 'text-red-600'
                  ]"
                >
                  {{ comm.onTimeRate }}%
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <span
                  :class="[
                    'font-medium',
                    comm.inspectionRate >= 90 ? 'text-green-600' :
                    comm.inspectionRate >= 70 ? 'text-amber-600' : 'text-red-600'
                  ]"
                >
                  {{ comm.inspectionRate }}%
                </span>
              </td>
              <td class="px-4 py-3 text-right text-gray-600">{{ comm.binCount }}</td>
              <td class="px-4 py-3 text-right">
                <span v-if="comm.pendingAlertCount > 0" class="badge-warning">
                  {{ comm.pendingAlertCount }}
                </span>
                <span v-else class="text-gray-400">0</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
