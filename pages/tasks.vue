<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">整改任务</h2>
      <button
        v-if="canSubmitTask"
        @click="showCreateModal = true"
        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
      >
        + 提交新任务
      </button>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div>
          <label class="block text-sm text-gray-500 mb-1">状态</label>
          <select v-model="filters.status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">全部状态</option>
            <option v-for="(label, value) in statusOptions" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-500 mb-1">类型</label>
          <select v-model="filters.type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">全部类型</option>
            <option v-for="(label, value) in typeOptions" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-500 mb-1">社区</label>
          <select v-model="filters.community" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">全部社区</option>
            <option v-for="c in communities" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-500 mb-1">开始日期</label>
          <input v-model="filters.startDate" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label class="block text-sm text-gray-500 mb-1">结束日期</label>
          <input v-model="filters.endDate" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div class="flex space-x-2">
          <button @click="fetchTasks" class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">
            搜索
          </button>
          <button @click="resetFilters" class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm">
            重置
          </button>
          <button @click="exportExcel" class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
            导出
          </button>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">任务编号</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">点位</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">社区</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">提交人</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">截止时间</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task._id" class="border-t border-gray-100 hover:bg-gray-50">
              <td class="py-3 px-4 text-sm font-mono text-gray-700">{{ task.taskNumber }}</td>
              <td class="py-3 px-4 text-sm text-gray-700">
                <span class="inline-flex items-center">
                  {{ getTypeIcon(task.type) }} {{ getTypeLabel(task.type) }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-gray-700">{{ task.pointName }}</td>
              <td class="py-3 px-4 text-sm text-gray-700">{{ task.community }}</td>
              <td class="py-3 px-4">
                <span :class="getStatusClass(task.status)" class="px-2 py-1 text-xs rounded-full">
                  {{ getStatusLabel(task.status) }}
                </span>
                <span v-if="task.isEscalated" class="ml-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                  已升级
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-gray-700">{{ task.submitterName }}</td>
              <td class="py-3 px-4 text-sm" :class="isOverdue(task.deadline) && !isClosed(task.status) ? 'text-red-600 font-medium' : 'text-gray-500'">
                {{ formatDate(task.deadline) }}
              </td>
              <td class="py-3 px-4 text-sm">
                <button @click="navigateTo(`/tasks/${task._id}`)" class="text-green-600 hover:text-green-700">
                  查看详情
                </button>
              </td>
            </tr>
            <tr v-if="tasks.length === 0">
              <td colspan="8" class="py-12 text-center text-gray-400">暂无任务数据</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="p-4 border-t border-gray-100 flex justify-between items-center">
        <span class="text-sm text-gray-500">共 {{ total }} 条记录</span>
        <div class="flex space-x-2">
          <button
            @click="page > 1 && (page--, fetchTasks())"
            :disabled="page <= 1"
            class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            上一页
          </button>
          <span class="px-3 py-1 text-sm text-gray-600">第 {{ page }} 页</span>
          <button
            @click="page * pageSize < total && (page++, fetchTasks())"
            :disabled="page * pageSize >= total"
            class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
    
    <CreateTaskModal v-if="showCreateModal" @close="showCreateModal = false" @created="onTaskCreated" />
  </div>
</template>

<script setup lang="ts">
import { TaskType, TaskStatus, TaskTypeLabels, TaskStatusLabels, type Task } from '~/types'
import { UserRole } from '~/types'

const tasks = ref<Task[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const showCreateModal = ref(false)

const filters = ref({
  status: '',
  type: '',
  community: '',
  startDate: '',
  endDate: ''
})

const { hasRole } = useAuth()

const communities = ['阳光社区', '和平社区', '幸福社区', '新华社区']

const canSubmitTask = computed(() => {
  return hasRole([UserRole.GRID_MEMBER, UserRole.STREET_ADMIN])
})

const statusOptions = TaskStatusLabels
const typeOptions = TaskTypeLabels

const buildQueryParams = (includePagination = true) => {
  const params = new URLSearchParams()
  if (includePagination) {
    params.append('page', page.value.toString())
    params.append('limit', pageSize.value.toString())
  }
  if (filters.value.status) params.append('status', filters.value.status)
  if (filters.value.type) params.append('type', filters.value.type)
  if (filters.value.community) params.append('community', filters.value.community)
  if (filters.value.startDate) params.append('startDate', filters.value.startDate)
  if (filters.value.endDate) params.append('endDate', filters.value.endDate)
  return params
}

const resetFilters = () => {
  filters.value = {
    status: '',
    type: '',
    community: '',
    startDate: '',
    endDate: ''
  }
  page.value = 1
  fetchTasks()
}

const fetchTasks = async () => {
  try {
    const query = buildQueryParams()
    const data = await $fetch<{ tasks: Task[]; total: number }>(`/api/tasks?${query.toString()}`)
    tasks.value = data.tasks
    total.value = data.total
  } catch (e) {
    console.error('Failed to fetch tasks:', e)
  }
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    [TaskType.MISSED_SORT]: '🗑️',
    [TaskType.BIN_FULL]: '📦',
    [TaskType.POINT_DAMAGED]: '🔧'
  }
  return icons[type] || '📋'
}

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

const isOverdue = (deadline: string) => {
  return new Date(deadline) < new Date()
}

const isClosed = (status: string) => {
  return [TaskStatus.CLOSED, TaskStatus.CANCELLED].includes(status as TaskStatus)
}

const exportExcel = async () => {
  const query = buildQueryParams(false)
  const response = await $fetch(`/api/stats/export?${query.toString()}`, {
    responseType: 'blob'
  })
  
  const url = window.URL.createObjectURL(new Blob([response]))
  const link = document.createElement('a')
  link.href = url
  link.download = `整改任务报表_${new Date().toISOString().split('T')[0]}.xlsx`
  link.click()
  window.URL.revokeObjectURL(url)
}

const onTaskCreated = () => {
  showCreateModal.value = false
  fetchTasks()
}

onMounted(() => {
  fetchTasks()
})
</script>
