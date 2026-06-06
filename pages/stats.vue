<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">统计报表</h2>
      <button @click="exportExcel" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        📥 导出报表
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">总任务数</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">{{ stats?.summary?.totalTasks || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            📊
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">完成率</p>
            <p class="text-3xl font-bold text-green-600 mt-1">
              {{ completionRate }}%
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
            ✅
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">点位数量</p>
            <p class="text-3xl font-bold text-teal-600 mt-1">{{ stats?.summary?.activePoints || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-2xl">
            📍
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">活跃用户</p>
            <p class="text-3xl font-bold text-purple-600 mt-1">{{ stats?.summary?.totalUsers || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
            👥
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">问题类型分布</h3>
        <div class="space-y-4">
          <div v-for="item in typeStats" :key="item._id" class="flex items-center">
            <span class="w-24 text-gray-600">{{ item.label }}</span>
            <div class="flex-1 mx-4">
              <div class="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="item.color"
                  :style="{ width: item.percentage + '%' }"
                ></div>
              </div>
            </div>
            <span class="w-16 text-right text-sm font-medium text-gray-700">{{ item.count }} ({{ item.percentage }}%)</span>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">状态分布</h3>
        <div class="space-y-4">
          <div v-for="item in statusStats" :key="item.label" class="flex items-center">
            <span class="w-24 text-gray-600">{{ item.label }}</span>
            <div class="flex-1 mx-4">
              <div class="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="item.color"
                  :style="{ width: item.percentage + '%' }"
                ></div>
              </div>
            </div>
            <span class="w-16 text-right text-sm font-medium text-gray-700">{{ item.count }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">社区统计</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">社区</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">总任务</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">已完成</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">完成率</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">误投</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">桶满</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">点位破损</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in communityStatsDetail" :key="item._id" class="border-b border-gray-100">
            <td class="py-3 px-4 text-sm text-gray-800 font-medium">{{ item._id }}</td>
            <td class="py-3 px-4 text-sm text-gray-700">{{ item.total }}</td>
            <td class="py-3 px-4 text-sm text-green-600">{{ item.closed }}</td>
            <td class="py-3 px-4">
              <div class="flex items-center space-x-2">
                <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full bg-green-500 rounded-full" :style="{ width: item.completionRate + '%' }"></div>
                </div>
                <span class="text-sm text-gray-600">{{ item.completionRate }}%</span>
              </div>
            </td>
            <td class="py-3 px-4 text-sm text-yellow-600">{{ item.missedSort || 0 }}</td>
            <td class="py-3 px-4 text-sm text-blue-600">{{ item.binFull || 0 }}</td>
            <td class="py-3 px-4 text-sm text-red-600">{{ item.pointDamaged || 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">近7日趋势</h3>
      <div class="h-64 flex items-end justify-around">
        <div v-for="item in stats?.dailyTrend" :key="item._id" class="flex flex-col items-center">
          <div class="flex flex-col items-end space-y-1 h-48 justify-end">
            <div class="w-8 bg-green-400 rounded-t" :style="{ height: (item.closed / maxDaily) * 150 + 'px' }"></div>
            <div class="w-8 bg-blue-400" :style="{ height: ((item.submitted - item.closed) / maxDaily * 150 + 'px' }"></div>
          </div>
          <span class="text-xs text-gray-500 mt-2">{{ item._id?.slice(5) }}</span>
        </div>
      </div>
      <div class="flex justify-center space-x-6 mt-4">
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 bg-blue-400"></div>
          <span class="text-sm text-gray-600">新增</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 bg-green-400"></div>
          <span class="text-sm text-gray-600">完成</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TaskType, TaskStatus, TaskTypeLabels, TaskStatusLabels } from '~/types'

const stats = ref<any>(null)

const fetchStats = async () => {
  try {
    stats.value = await $fetch('/api/stats/overview')
  } catch (e) {
    console.error('Failed to fetch stats:', e)
  }
}

const completionRate = computed(() => {
  if (!stats.value?.summary) return 0
  const { totalTasks, closedTasks } = stats.value.summary
  return totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0
})

const typeStats = computed(() => {
  if (!stats.value?.taskTypeStats) return []
  const total = stats.value.taskTypeStats.reduce((sum: number, item: any) => sum + item.count, 0) || 1
  const colors: Record<string, string> = {
    [TaskType.MISSED_SORT]: 'bg-yellow-500',
    [TaskType.BIN_FULL]: 'bg-blue-500',
    [TaskType.POINT_DAMAGED]: 'bg-red-500'
  }
  return stats.value.taskTypeStats.map((item: any) => ({
    ...item,
    label: TaskTypeLabels[item._id as TaskType] || item._id,
    percentage: Math.round((item.count / total) * 100),
    color: colors[item._id] || 'bg-gray-500'
  }))
})

const statusStats = computed(() => {
  if (!stats.value?.summary) return []
  const s = stats.value.summary
  const items = [
    { label: '待处理', count: s.pendingTasks || 0, color: 'bg-blue-500' },
    { label: '待复查', count: s.pendingReview || 0, color: 'bg-orange-500' },
    { label: '已完成', count: s.closedTasks || 0, color: 'bg-green-500' },
    { label: '复查不通过', count: s.rejectedTasks || 0, color: 'bg-red-500' },
    { label: '已升级', count: s.escalatedTasks || 0, color: 'bg-rose-500' }
  ]
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1
  return items.map(item => ({
    ...item,
    percentage: Math.round((item.count / total) * 100)
  }))
})

const communityStatsDetail = computed(() => {
  if (!stats.value?.communityStats) return []
  return stats.value.communityStats.map((item: any) => ({
    ...item,
    completionRate: item.total > 0 ? Math.round((item.closed / item.total) * 100) : 0
  }))
})

const maxDaily = computed(() => {
  if (!stats.value?.dailyTrend?.length) return 1
  return Math.max(...stats.value.dailyTrend.map((item: any) => item.submitted || 1), 1)
})

const exportExcel = async () => {
  const response = await $fetch('/api/stats/export', {
    responseType: 'blob'
  })
  
  const url = window.URL.createObjectURL(new Blob([response]))
  const link = document.createElement('a')
  link.href = url
  link.download = `统计报表_${new Date().toISOString().split('T')[0]}.xlsx`
  link.click()
  window.URL.revokeObjectURL(url)
}

onMounted(() => {
  fetchStats()
})
</script>
