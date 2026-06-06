<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">工作仪表盘</h2>
      <button
        v-if="canSubmitTask"
        @click="showCreateModal = true"
        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
      >
        + 提交新任务
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待处理任务</p>
            <p class="text-3xl font-bold text-blue-600 mt-1">{{ stats?.summary?.pendingTasks || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            📋
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待复查任务</p>
            <p class="text-3xl font-bold text-orange-600 mt-1">{{ stats?.summary?.pendingReview || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
            🔍
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已完成任务</p>
            <p class="text-3xl font-bold text-green-600 mt-1">{{ stats?.summary?.closedTasks || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
            ✅
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已升级任务</p>
            <p class="text-3xl font-bold text-red-600 mt-1">{{ stats?.summary?.escalatedTasks || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
            ⚠️
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">问题类型分布</h3>
        <div class="space-y-3">
          <div v-for="item in typeStats" :key="item._id" class="flex items-center justify-between">
            <span class="text-gray-600">{{ item.label }}</span>
            <div class="flex items-center space-x-3">
              <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="item.color"
                  :style="{ width: item.percentage + '%' }"
                ></div>
              </div>
              <span class="text-sm font-medium text-gray-700 w-12 text-right">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">社区统计</h3>
        <div class="space-y-3">
          <div v-for="item in stats?.communityStats" :key="item._id" class="flex items-center justify-between">
            <span class="text-gray-600">{{ item._id }}</span>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-green-600">{{ item.closed }}/{{ item.total }}</span>
              <span class="text-xs text-gray-400">
                ({{ Math.round((item.closed / (item.total || 1)) * 100) }}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-800">最近任务</h3>
        <NuxtLink to="/tasks" class="text-sm text-green-600 hover:text-green-700">
          查看全部 →
        </NuxtLink>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">任务编号</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">点位</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">提交人</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">提交时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in recentTasks" :key="task._id" class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" @click="navigateTo(`/tasks/${task._id}`)">
              <td class="py-3 px-4 text-sm font-mono text-gray-700">{{ task.taskNumber }}</td>
              <td class="py-3 px-4 text-sm text-gray-700">{{ getTypeLabel(task.type) }}</td>
              <td class="py-3 px-4 text-sm text-gray-700">{{ task.pointName }}</td>
              <td class="py-3 px-4">
                <span :class="getStatusClass(task.status)" class="px-2 py-1 text-xs rounded-full">
                  {{ getStatusLabel(task.status) }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-gray-700">{{ task.submitterName }}</td>
              <td class="py-3 px-4 text-sm text-gray-500">{{ formatDate(task.createdAt) }}</td>
            </tr>
            <tr v-if="recentTasks.length === 0">
              <td colspan="6" class="py-8 text-center text-gray-400">暂无任务数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  
  <CreateTaskModal v-if="showCreateModal" @close="showCreateModal = false" @created="onTaskCreated" />
</template>

<script setup lang="ts">
import { TaskType, TaskStatus, TaskTypeLabels, TaskStatusLabels, TaskStatusColors, type Task } from '~/types'
import { UserRole } from '~/types'

const stats = ref<any>(null)
const recentTasks = ref<Task[]>([])
const showCreateModal = ref(false)

const { user, hasRole } = useAuth()

const canSubmitTask = computed(() => {
  return hasRole([UserRole.GRID_MEMBER, UserRole.STREET_ADMIN])
})

const fetchStats = async () => {
  try {
    stats.value = await $fetch('/api/stats/overview')
  } catch (e) {
    console.error('Failed to fetch stats:', e)
  }
}

const fetchRecentTasks = async () => {
  try {
    const data = await $fetch<{ tasks: Task[] }>('/api/tasks?limit=5')
    recentTasks.value = data.tasks
  } catch (e) {
    console.error('Failed to fetch tasks:', e)
  }
}

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

const getTypeLabel = (type: string) => TaskTypeLabels[type as TaskType] || type
const getStatusLabel = (status: string) => TaskStatusLabels[status as TaskStatus] || status
const getStatusClass = (status: string) => {
  const colors: Record<string, string> = {
    [TaskStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
    [TaskStatus.CLAIMED]: 'bg-cyan-100 text-cyan-800',
    [TaskStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
    [TaskStatus.PENDING_REVIEW]: 'bg-orange-100 text-orange-800',
    [TaskStatus.REJECTED]: 'bg-red-100 text-red-800',
    [TaskStatus.CLOSED]: 'bg-green-100 text-green-800',
    [TaskStatus.ESCALATED]: 'bg-rose-100 text-rose-800',
    [TaskStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const onTaskCreated = () => {
  showCreateModal.value = false
  fetchStats()
  fetchRecentTasks()
}

onMounted(() => {
  fetchStats()
  fetchRecentTasks()
})
</script>
