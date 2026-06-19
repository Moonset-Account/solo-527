<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search, RotateCcw, Loader2, Inbox, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { adminApi } from '@/api'
import type { AuditLog, User } from '@/types'

const actionTypeOptions = [
  { label: '全部操作', value: '' },
  { label: '附件缺失标记', value: 'attachment_missing_mark' },
  { label: '用户创建', value: 'user_created' },
  { label: '用户更新', value: 'user_updated' },
  { label: '用户删除', value: 'user_deleted' },
  { label: '需求创建', value: 'requirement_created' },
  { label: '需求更新', value: 'requirement_updated' },
  { label: '需求删除', value: 'requirement_deleted' },
]

const resourceTypeOptions = [
  { label: '全部资源', value: '' },
  { label: '用户', value: 'user' },
  { label: '需求', value: 'requirement' },
  { label: '附件', value: 'attachment' },
  { label: '提醒', value: 'reminder' },
  { label: '字典', value: 'dictionary' },
  { label: '阈值', value: 'threshold' },
]

const userOptions = ref<{ label: string; value: number }[]>([])

const filters = ref({
  action: '',
  resource: '',
  userId: 0,
  startDate: '',
  endDate: '',
})

const logs = ref<AuditLog[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)

function getActionColor(action: string): string {
  if (action.startsWith('attachment')) return 'bg-red-100 text-red-700'
  if (action.startsWith('user')) return 'bg-blue-100 text-blue-700'
  if (action.startsWith('requirement')) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

function formatTime(date: string): string {
  if (!date) return '-'
  return date.slice(0, 16).replace('T', ' ')
}

async function fetchLogs() {
  loading.value = true
  try {
    const params: Record<string, string | number> = { page: currentPage.value }
    if (filters.value.action) params.action = filters.value.action
    if (filters.value.resource) params.resource = filters.value.resource
    if (filters.value.userId) params.userId = filters.value.userId
    if (filters.value.startDate) params.startDate = filters.value.startDate
    if (filters.value.endDate) params.endDate = filters.value.endDate
    const res = await adminApi.logs.list(params as any)
    logs.value = res.data.data
    total.value = res.data.total
    totalPages.value = res.data.lastPage
  } finally {
    loading.value = false
  }
}

async function fetchUsers() {
  try {
    const res = await adminApi.users.list()
    userOptions.value = res.data.map((u: User) => ({ label: u.name, value: u.id }))
  } catch {}
}

function doSearch() {
  currentPage.value = 1
  fetchLogs()
}

function resetFilters() {
  filters.value = { action: '', resource: '', userId: 0, startDate: '', endDate: '' }
  currentPage.value = 1
  fetchLogs()
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchLogs()
}

onMounted(() => {
  fetchUsers()
  fetchLogs()
})
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-slate-800 mb-6">操作日志</h1>

    <div class="card p-4 mb-4">
      <div class="flex gap-3 items-center flex-wrap">
        <select v-model="filters.action" class="select w-auto min-w-[140px]">
          <option v-for="opt in actionTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select v-model="filters.resource" class="select w-auto min-w-[130px]">
          <option v-for="opt in resourceTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select v-model="filters.userId" class="select w-auto min-w-[130px]">
          <option :value="0">全部用户</option>
          <option v-for="opt in userOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <input
          v-model="filters.startDate"
          type="date"
          class="input w-auto min-w-[150px]"
        />
        <input
          v-model="filters.endDate"
          type="date"
          class="input w-auto min-w-[150px]"
        />
        <button class="btn-accent" @click="doSearch">
          <Search class="w-4 h-4 mr-1" />
          搜索
        </button>
        <button class="btn-outline" @click="resetFilters">
          <RotateCcw class="w-4 h-4 mr-1" />
          重置
        </button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">时间</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">操作人</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">操作类型</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">资源类型</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">资源ID</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">详细信息</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-12 text-slate-400">
                <Loader2 class="w-6 h-6 mx-auto animate-spin" />
              </td>
            </tr>
            <tr v-else-if="logs.length === 0">
              <td colspan="6" class="text-center py-16">
                <div class="flex flex-col items-center text-slate-400">
                  <Inbox class="w-12 h-12 mb-3" />
                  <span>暂无日志数据</span>
                </div>
              </td>
            </tr>
            <tr
              v-for="item in logs"
              :key="item.id"
              class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td class="px-4 py-3 whitespace-nowrap text-slate-500">{{ formatTime(item.createdAt) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-slate-700">{{ item.user?.name ?? '-' }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="badge" :class="getActionColor(item.action)">{{ item.action }}</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ item.resource }}</td>
              <td class="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-500">{{ item.resourceId }}</td>
              <td class="px-4 py-3 text-slate-600 max-w-[300px] truncate">{{ item.details }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex justify-between items-center mt-4">
      <span class="text-sm text-slate-500">共 {{ total }} 条记录</span>
      <div class="flex items-center gap-2">
        <button
          class="btn-outline btn-sm"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          <ChevronLeft class="w-4 h-4" />
          上一页
        </button>
        <span class="text-sm text-slate-600">{{ currentPage }} / {{ totalPages || 1 }}</span>
        <button
          class="btn-outline btn-sm"
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
        >
          下一页
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
