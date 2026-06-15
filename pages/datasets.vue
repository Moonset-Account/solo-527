<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">数据集管理</h1>
        <p class="text-slate-500 mt-1">管理数据资产和负责人待办</p>
      </div>
      <div class="flex bg-slate-100 rounded-lg p-1">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="activeTab === tab.value ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'datasets'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex gap-2">
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" v-model="searchKeyword" placeholder="搜索数据集..." class="input pl-9 w-64" />
          </div>
          <select v-model="businessLineFilter" class="select w-40">
            <option value="all">全部业务线</option>
            <option value="销售中心">销售中心</option>
            <option value="华南大区">华南大区</option>
            <option value="华东大区">华东大区</option>
            <option value="西部大区">西部大区</option>
            <option value="供应链">供应链</option>
            <option value="财务">财务</option>
          </select>
        </div>
        <button class="btn-primary flex items-center gap-1.5">
          <Plus class="w-4 h-4" />
          新建数据集
        </button>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="ds in filteredDatasets" :key="ds.id" class="card p-5 hover:shadow-card-hover transition-all group cursor-pointer">
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Database class="w-6 h-6 text-primary-600" />
            </div>
            <span class="badge badge-secondary">{{ ds.businessLine }}</span>
          </div>
          <h3 class="font-semibold text-slate-800 mb-1 group-hover:text-primary-600 transition-colors">
            {{ ds.name }}
          </h3>
          <p class="text-sm text-slate-500 mb-4 line-clamp-2">{{ ds.description }}</p>
          <div class="flex items-center justify-between pt-4 border-t border-slate-100">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-xs">
                {{ ds.ownerName?.charAt(0) }}
              </div>
              <span class="text-xs text-slate-500">{{ ds.ownerName }}</span>
            </div>
            <span class="text-xs text-slate-400">{{ formatDate(ds.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'todos'" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-500">按负责人拆分待办事项，支持批量分配和转移</p>
        <div class="flex gap-2">
          <button class="btn-secondary flex items-center gap-1.5">
            <UserPlus class="w-4 h-4" />
            分配待办
          </button>
          <button class="btn-secondary flex items-center gap-1.5">
            <Share2 class="w-4 h-4" />
            批量转移
          </button>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <div v-for="group in todoGroups" :key="group.assigneeId" class="card overflow-hidden">
          <div class="p-5 bg-slate-50 border-b border-slate-100">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                  {{ group.assigneeName.charAt(0) }}
                </div>
                <div>
                  <h3 class="font-semibold text-slate-800">{{ group.assigneeName }}</h3>
                  <p class="text-xs text-slate-500">业务负责人</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <p class="text-2xl font-bold text-slate-800 font-mono">{{ group.count }}</p>
                  <p class="text-xs text-slate-500">待办项</p>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4 space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
            <div
              v-for="item in group.items"
              :key="item.id"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div class="flex-shrink-0 mt-0.5">
                <div
                  class="w-2.5 h-2.5 rounded-full"
                  :class="{
                    'bg-danger-500': item.priority === 'high',
                    'bg-warning-500': item.priority === 'medium',
                    'bg-success-500': item.priority === 'low'
                  }"
                ></div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="badge" :class="'badge-' + getTypeBadge(item.type)">
                    {{ getTypeText(item.type) }}
                  </span>
                  <span class="badge" :class="'badge-' + getStatusBadge(item.status)">
                    {{ getStatusText(item.status) }}
                  </span>
                </div>
                <p class="text-sm text-slate-700 mt-1 truncate">{{ item.title }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-xs text-slate-400">截止</p>
                <p class="text-xs font-medium" :class="isOverdue(item) ? 'text-danger-600' : 'text-slate-600'">
                  {{ formatDeadline(item.deadline) }}
                </p>
              </div>
              <ChevronRight class="w-4 h-4 text-slate-300 group-hover:text-primary-400 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Database, UserPlus, Share2, ChevronRight } from 'lucide-vue-next'
import dayjs from 'dayjs'
import type { Dataset, TodoGroup, TodoItem } from '~/types'

const tabs = [
  { value: 'datasets', label: '数据集列表' },
  { value: 'todos', label: '负责人待办' }
]

const activeTab = ref('datasets')
const searchKeyword = ref('')
const businessLineFilter = ref('all')

const datasets = ref<Dataset[]>([])
const todoGroups = ref<TodoGroup[]>([])

const filteredDatasets = computed(() => {
  let result = [...datasets.value]
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(d =>
      d.name.toLowerCase().includes(keyword) ||
      d.description?.toLowerCase().includes(keyword)
    )
  }
  
  if (businessLineFilter.value !== 'all') {
    result = result.filter(d => d.businessLine === businessLineFilter.value)
  }
  
  return result
})

const formatDate = (date: string): string => {
  return dayjs(date).format('YYYY-MM-DD')
}

const getTypeText = (type: string): string => {
  switch (type) {
    case 'alert': return '告警'
    case 'approval': return '审批'
    case 'summary': return '摘要'
    default: return type
  }
}

const getTypeBadge = (type: string): string => {
  switch (type) {
    case 'alert': return 'danger'
    case 'approval': return 'primary'
    case 'summary': return 'success'
    default: return 'secondary'
  }
}

const getStatusBadge = (status: string): string => {
  switch (status) {
    case 'pending': return 'warning'
    case 'processing': return 'primary'
    case 'done': return 'success'
    default: return 'secondary'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return '待处理'
    case 'processing': return '处理中'
    case 'done': return '已完成'
    default: return status
  }
}

const isOverdue = (item: TodoItem): boolean => {
  if (item.status === 'done' || !item.deadline) return false
  return dayjs(item.deadline).isBefore(dayjs())
}

const formatDeadline = (deadline?: string): string => {
  if (!deadline) return '-'
  const d = dayjs(deadline)
  if (d.isSame(dayjs(), 'day')) return '今天'
  if (d.isSame(dayjs().add(1, 'day'), 'day')) return '明天'
  return d.format('MM-DD')
}

const fetchData = async () => {
  try {
    const [datasetsRes, todos] = await Promise.all([
      $fetch('/api/datasets'),
      $fetch('/api/todos')
    ])

    datasets.value = (datasetsRes as any).items || []
    todoGroups.value = todos as TodoGroup[]
  } catch (e) {
    console.error('Failed to fetch datasets data:', e)
  }
}

onMounted(() => {
  fetchData()
})

definePageMeta({
  layout: 'default'
})
</script>
