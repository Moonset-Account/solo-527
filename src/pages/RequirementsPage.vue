<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, RotateCcw, Eye, Inbox, Plus } from 'lucide-vue-next'
import { useRequirementsStore } from '@/stores/requirements'
import { useDictionaries } from '@/composables/useDictionaries'
import type { RequirementStatus, Priority, RequirementFilter } from '@/types'

const router = useRouter()
const store = useRequirementsStore()
const { departments, priorities, fetchAll: fetchDicts } = useDictionaries()

const statusOptions: { label: string; value: RequirementStatus | '' }[] = [
  { label: '全部状态', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '待处理', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已逾期', value: 'overdue' },
  { label: '已完成', value: 'completed' },
  { label: '已关闭', value: 'closed' },
]

const statusBadgeMap: Record<RequirementStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-700',
}

const statusLabelMap: Record<RequirementStatus, string> = {
  draft: '草稿',
  pending: '待处理',
  in_progress: '进行中',
  overdue: '已逾期',
  completed: '已完成',
  closed: '已关闭',
}

const priorityBadgeMap: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
}

const priorityLabelMap: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

const filters = ref<{
  status: RequirementStatus | ''
  priority: Priority | ''
  department: string
  keyword: string
}>({
  status: '',
  priority: '',
  department: '',
  keyword: '',
})

const currentPage = ref(1)

function formatReqId(id: number): string {
  return `REQ-${String(id).padStart(4, '0')}`
}

function formatDate(date: string): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

function buildFilterParams(): RequirementFilter {
  const params: RequirementFilter = {
    page: currentPage.value,
    perPage: 20,
  }
  if (filters.value.status) params.status = filters.value.status
  if (filters.value.priority) params.priority = filters.value.priority
  if (filters.value.department) params.department = filters.value.department
  if (filters.value.keyword) params.keyword = filters.value.keyword
  return params
}

function doFetch() {
  store.fetchRequirements(buildFilterParams())
}

function resetFilters() {
  filters.value = { status: '', priority: '', department: '', keyword: '' }
  currentPage.value = 1
}

function goToPage(page: number) {
  currentPage.value = page
  doFetch()
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(filters, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    doFetch()
  }, 300)
}, { deep: true })

onMounted(() => {
  fetchDicts()
  doFetch()
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-xl font-semibold text-slate-800">
        需求列表
        <span class="text-sm font-normal text-slate-500 ml-2">共 {{ store.pagination.total }} 条</span>
      </h1>
      <button class="btn-accent" @click="router.push('/requirements/new')">
        <Plus class="w-4 h-4 mr-1" />
        新建需求
      </button>
    </div>

    <div class="card p-4 mb-4">
      <div class="flex gap-3 items-center flex-wrap">
        <select v-model="filters.status" class="select w-auto min-w-[120px]">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select v-model="filters.priority" class="select w-auto min-w-[120px]">
          <option value="">全部优先级</option>
          <option v-for="opt in priorities" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select v-model="filters.department" class="select w-auto min-w-[120px]">
          <option value="">全部部门</option>
          <option v-for="opt in departments" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <div class="relative flex-1 min-w-[180px] max-w-xs">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input v-model="filters.keyword" type="text" class="input pl-9" placeholder="搜索需求标题..." />
        </div>
        <button class="btn-outline btn-sm" @click="resetFilters">
          <RotateCcw class="w-3.5 h-3.5 mr-1" />
          重置
        </button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="sticky top-0 z-10">
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">需求编号</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">标题</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">状态</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">优先级</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">部门</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">负责人</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">截止时间</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">创建时间</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.isLoading">
              <td colspan="9" class="text-center py-12 text-slate-400">加载中...</td>
            </tr>
            <tr v-else-if="store.requirements.length === 0">
              <td colspan="9" class="text-center py-16">
                <div class="flex flex-col items-center text-slate-400">
                  <Inbox class="w-12 h-12 mb-3" />
                  <span>暂无需求数据</span>
                </div>
              </td>
            </tr>
            <tr
              v-for="(req, index) in store.requirements"
              :key="req.id"
              class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              :class="index % 2 === 1 ? 'bg-slate-50/50' : ''"
            >
              <td class="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{{ formatReqId(req.id) }}</td>
              <td class="px-4 py-3 font-medium text-slate-800 max-w-[240px] truncate">{{ req.title }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="badge" :class="statusBadgeMap[req.status]">{{ statusLabelMap[req.status] }}</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="badge" :class="priorityBadgeMap[req.priority]">{{ priorityLabelMap[req.priority] }}</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ req.department }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ req.assignee?.name || '-' }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ formatDate(req.deadline) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ formatDate(req.createdAt) }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <button class="btn-outline btn-sm" @click="router.push(`/requirements/${req.id}`)">
                  <Eye class="w-3.5 h-3.5 mr-1" />
                  查看
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex justify-between items-center mt-4">
      <span class="text-sm text-slate-500">共 {{ store.pagination.total }} 条记录</span>
      <div class="flex items-center gap-2">
        <button
          class="btn-outline btn-sm"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          上一页
        </button>
        <span class="text-sm text-slate-600">
          {{ currentPage }} / {{ store.pagination.lastPage || 1 }}
        </span>
        <button
          class="btn-outline btn-sm"
          :disabled="currentPage >= store.pagination.lastPage"
          @click="goToPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>
