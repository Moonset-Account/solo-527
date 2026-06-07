<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { TrendingDown, Filter, Calendar, PieChart } from 'lucide-vue-next'
import { useDataStore } from '@/stores/data'
import { createLineChart, createBarChart, createPieChart } from '@/utils/charts'
import type { MisuseType } from '@/types'

const dataStore = useDataStore()

const trendChartRef = ref<HTMLElement | null>(null)
const typeChartRef = ref<HTMLElement | null>(null)
const communityChartRef = ref<HTMLElement | null>(null)

const selectedPeriod = ref<'7' | '14' | '30'>('30')
const selectedCommunity = ref<string>('all')
const selectedType = ref<MisuseType | 'all'>('all')
const onlyApproved = ref(true)

const periods = [
  { value: '7', label: '近7天' },
  { value: '14', label: '近14天' },
  { value: '30', label: '近30天' }
]

const misuseTypes: Array<{ value: MisuseType | 'all'; label: string; color: string }> = [
  { value: 'all', label: '全部类型', color: '#6b7280' },
  { value: 'recyclable', label: '可回收物', color: '#3b82f6' },
  { value: 'hazardous', label: '有害垃圾', color: '#ef4444' },
  { value: 'kitchen', label: '厨余垃圾', color: '#22c55e' },
  { value: 'other', label: '其他垃圾', color: '#f59e0b' }
]

const filteredRecords = computed(() => {
  let records = dataStore.misuseRecords

  if (onlyApproved.value) {
    records = records.filter(r => r.auditStatus === 'approved')
  }

  if (selectedCommunity.value !== 'all') {
    const binIds = new Set(
      dataStore.getBinPointsByCommunity(selectedCommunity.value).map(b => b.id)
    )
    records = records.filter(r => binIds.has(r.binPointId))
  }

  if (selectedType.value !== 'all') {
    records = records.filter(r => r.misuseType === selectedType.value)
  }

  const days = parseInt(selectedPeriod.value)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  records = records.filter(r => r.recordDate >= cutoffStr)

  return records
})

const trendData = computed(() => {
  const days = parseInt(selectedPeriod.value)
  const result: Array<{ date: string; value: number }> = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayRecords = filteredRecords.value.filter(r => r.recordDate === dateStr)
    const avgRate = dayRecords.length > 0
      ? dayRecords.reduce((sum, r) => sum + r.misuseRate, 0) / dayRecords.length
      : 0

    result.push({ date: dateStr, value: parseFloat(avgRate.toFixed(1)) })
  }

  return result
})

const typeDistribution = computed(() => {
  const typeMap = new Map<MisuseType, number>()
  filteredRecords.value.forEach(r => {
    typeMap.set(r.misuseType, (typeMap.get(r.misuseType) || 0) + 1)
  })

  return misuseTypes.filter(t => t.value !== 'all').map(t => ({
    label: t.label,
    value: typeMap.get(t.value as MisuseType) || 0,
    color: t.color
  }))
})

const communityRank = computed(() => {
  const commMap = new Map<string, { total: number; sum: number }>()

  filteredRecords.value.forEach(r => {
    const bin = dataStore.getBinPointById(r.binPointId)
    if (bin) {
      const comm = dataStore.getCommunityById(bin.communityId)
      if (comm) {
        const existing = commMap.get(comm.id) || { total: 0, sum: 0 }
        existing.total++
        existing.sum += r.misuseRate
        commMap.set(comm.id, existing)
      }
    }
  })

  return Array.from(commMap.entries())
    .map(([commId, data]) => {
      const comm = dataStore.getCommunityById(commId)
      return {
        id: commId,
        name: comm?.name || '未知',
        avgRate: data.total > 0 ? parseFloat((data.sum / data.total).toFixed(1)) : 0,
        count: data.total
      }
    })
    .sort((a, b) => b.avgRate - a.avgRate)
    .slice(0, 8)
})

const summary = computed(() => {
  const records = filteredRecords.value
  const avgRate = records.length > 0
    ? records.reduce((sum, r) => sum + r.misuseRate, 0) / records.length
    : 0

  const typeCounts = new Map<MisuseType, number>()
  records.forEach(r => {
    typeCounts.set(r.misuseType, (typeCounts.get(r.misuseType) || 0) + 1)
  })

  let topType: MisuseType = 'other'
  let maxCount = 0
  typeCounts.forEach((count, type) => {
    if (count > maxCount) {
      maxCount = count
      topType = type
    }
  })

  const typeLabel = misuseTypes.find(t => t.value === topType)?.label || '未知'

  return {
    totalRecords: records.length,
    avgMisuseRate: avgRate.toFixed(1),
    topMisuseType: typeLabel,
    approvedCount: records.filter(r => r.auditStatus === 'approved').length
  }
})

function drawCharts() {
  if (trendChartRef.value) {
    createLineChart(trendChartRef.value, trendData.value, { color: '#f97316', height: 280 })
  }

  if (typeChartRef.value) {
    createPieChart(typeChartRef.value, typeDistribution.value, { height: 280 })
  }

  if (communityChartRef.value) {
    const data = communityRank.value.map(c => ({
      label: c.name.slice(0, 4),
      value: c.avgRate
    }))
    createBarChart(communityChartRef.value, data, { color: '#ef4444', height: 300, horizontal: true })
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
    if (typeChartRef.value) resizeObserver.observe(typeChartRef.value)
    if (communityChartRef.value) resizeObserver.observe(communityChartRef.value)
  }, 100)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch([selectedPeriod, selectedCommunity, selectedType, onlyApproved], () => {
  drawCharts()
})
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingDown class="w-7 h-7 text-orange-500" />
          误投趋势分析
        </h1>
        <p class="text-gray-500 mt-1">分析各区域垃圾分类误投情况</p>
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

        <div class="flex items-center gap-2">
          <PieChart class="w-4 h-4 text-gray-400" />
          <span class="text-sm text-gray-600">类型</span>
          <select v-model="selectedType" class="select !py-1 !text-sm !w-32">
            <option v-for="t in misuseTypes" :key="t.value" :value="t.value">
              {{ t.label }}
            </option>
          </select>
        </div>

        <label class="flex items-center gap-2 cursor-pointer ml-auto">
          <input
            v-model="onlyApproved"
            type="checkbox"
            class="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span class="text-sm text-gray-600">仅显示已审核数据</span>
        </label>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="card p-4">
        <p class="text-sm text-gray-500 mb-1">误投记录数</p>
        <p class="text-2xl font-bold text-gray-900">{{ summary.totalRecords }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500 mb-1">平均误投率</p>
        <p class="text-2xl font-bold text-orange-600">{{ summary.avgMisuseRate }}%</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500 mb-1">最高误投类型</p>
        <p class="text-2xl font-bold text-red-600">{{ summary.topMisuseType }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500 mb-1">已审核记录</p>
        <p class="text-2xl font-bold text-green-600">{{ summary.approvedCount }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">误投率趋势</h3>
        <div ref="trendChartRef" class="w-full" />
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">误投类型分布</h3>
        <div ref="typeChartRef" class="w-full" />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">社区误投率排名（由高到低）</h3>
        <div ref="communityChartRef" class="w-full" />
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">详细数据</h3>
        <div class="overflow-auto max-h-80">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="text-left px-3 py-2 font-medium text-gray-600">社区</th>
                <th class="text-right px-3 py-2 font-medium text-gray-600">平均误投率</th>
                <th class="text-right px-3 py-2 font-medium text-gray-600">记录数</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(comm, index) in communityRank" :key="comm.id" class="hover:bg-gray-50">
                <td class="px-3 py-2.5">
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                        index === 0 ? 'bg-red-100 text-red-600' :
                        index === 1 ? 'bg-orange-100 text-orange-600' :
                        index === 2 ? 'bg-amber-100 text-amber-600' :
                        'bg-gray-100 text-gray-600'
                      ]"
                    >
                      {{ index + 1 }}
                    </span>
                    {{ comm.name }}
                  </div>
                </td>
                <td class="px-3 py-2.5 text-right font-medium text-orange-600">
                  {{ comm.avgRate }}%
                </td>
                <td class="px-3 py-2.5 text-right text-gray-600">
                  {{ comm.count }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
