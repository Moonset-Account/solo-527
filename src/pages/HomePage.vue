<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, AlertTriangle, CheckCircle, Loader, Plus, Send, User, Building2 } from 'lucide-vue-next'
import { useItemStore } from '@/stores/item'
import StatusBadge from '@/components/common/StatusBadge.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import type { Item, ItemStatus, Department, User as UserType } from '@/types'
import { cn } from '@/lib/utils'

const router = useRouter()
const itemStore = useItemStore()

const loading = ref(false)
const quickClaimItemId = ref('')
const quickProgressContent = ref('')
const quickProgressItemId = ref('')
const progressLoading = ref(false)
const claimLoading = ref<string | null>(null)

const pendingItems = ref<Item[]>([])
const inProgressItems = ref<Item[]>([])
const overdueItems = ref<Item[]>([])
const completedItems = ref<Item[]>([])

const pendingCount = computed(() => pendingItems.value.length)
const inProgressCount = computed(() => inProgressItems.value.length)
const overdueCount = computed(() => overdueItems.value.length)
const completedCount = computed(() => completedItems.value.length)

function getOverdueDays(deadline: string): number {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = now.getTime() - deadlineDate.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getDepartmentName(dept: string | Department): string {
  if (typeof dept === 'string') return dept
  return dept.name || ''
}

function getUserName(user: string | UserType | undefined): string {
  if (!user) return '未分配'
  if (typeof user === 'string') return user
  return user.name || ''
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const sortedOverdueItems = computed(() => {
  return [...overdueItems.value].sort((a, b) => {
    return getOverdueDays(b.deadline) - getOverdueDays(a.deadline)
  })
})

async function fetchItemsByStatus(status: ItemStatus) {
  try {
    const response = await itemStore.fetchItems({ status, pageSize: 100 })
    return response.data.items
  } catch (error) {
    console.error(`Failed to fetch ${status} items:`, error)
    return []
  }
}

async function loadAllData() {
  loading.value = true
  try {
    const [pending, inProgress, overdue, completed] = await Promise.all([
      fetchItemsByStatus('pending'),
      fetchItemsByStatus('in_progress'),
      fetchItemsByStatus('overdue'),
      fetchItemsByStatus('completed'),
    ])
    pendingItems.value = pending
    inProgressItems.value = inProgress
    overdueItems.value = overdue
    completedItems.value = completed
  } finally {
    loading.value = false
  }
}

async function handleClaim(itemId: string) {
  claimLoading.value = itemId
  try {
    await itemStore.claimItem(itemId)
    const item = pendingItems.value.find(i => i._id === itemId)
    if (item) {
      pendingItems.value = pendingItems.value.filter(i => i._id !== itemId)
      item.status = 'in_progress'
      inProgressItems.value.unshift(item)
    }
  } catch (error) {
    console.error('Failed to claim item:', error)
  } finally {
    claimLoading.value = null
  }
}

async function handleQuickClaim() {
  if (!quickClaimItemId.value) return
  await handleClaim(quickClaimItemId.value)
  quickClaimItemId.value = ''
}

async function handleQuickProgress() {
  if (!quickProgressItemId.value || !quickProgressContent.value.trim()) return
  
  progressLoading.value = true
  try {
    await itemStore.addProgress(quickProgressItemId.value, quickProgressContent.value.trim())
    quickProgressContent.value = ''
    quickProgressItemId.value = ''
  } catch (error) {
    console.error('Failed to add progress:', error)
  } finally {
    progressLoading.value = false
  }
}

function goToDetail(itemId: string) {
  router.push(`/items/${itemId}`)
}

onMounted(() => {
  loadAllData()
})
</script>

<template>
  <div class="space-y-6 pb-24">
    <!-- 顶部统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-gray-400">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待认领</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ pendingCount }}</p>
          </div>
          <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Clock class="w-6 h-6 text-gray-500" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">进行中</p>
            <p class="text-3xl font-bold text-blue-600 mt-1">{{ inProgressCount }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Loader class="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已逾期</p>
            <p class="text-3xl font-bold text-red-600 mt-1">{{ overdueCount }}</p>
          </div>
          <div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-red-500" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已完成</p>
            <p class="text-3xl font-bold text-green-600 mt-1">{{ completedCount }}</p>
          </div>
          <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <CheckCircle class="w-6 h-6 text-green-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- 中间待办看板 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 待认领列 -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-4 py-3 border-b border-gray-200">
          <div class="flex items-center gap-2">
            <Clock class="w-5 h-5 text-gray-500" />
            <h3 class="font-semibold text-gray-900">待认领</h3>
            <span class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{{ pendingCount }}</span>
          </div>
        </div>
        <div class="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          <div v-if="loading" class="flex justify-center py-8">
            <Loader class="w-6 h-6 text-primary animate-spin" />
          </div>
          <div v-else-if="pendingItems.length === 0" class="text-center py-8 text-gray-400">
            暂无待认领事项
          </div>
          <div
            v-for="item in pendingItems"
            :key="item._id"
            class="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            draggable="true"
          >
            <div class="flex items-start justify-between mb-2">
              <h4 class="font-medium text-gray-900 text-sm flex-1 pr-2 line-clamp-2" @click="goToDetail(item._id)">
                {{ item.title }}
              </h4>
            </div>
            <div class="flex items-center gap-2 mb-3 flex-wrap">
              <PriorityBadge :priority="item.priority" />
              <StatusBadge status="pending" />
            </div>
            <div class="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <div class="flex items-center gap-1">
                <Clock class="w-3.5 h-3.5" />
                <span>{{ formatDate(item.deadline) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <Building2 class="w-3.5 h-3.5" />
                <span>{{ getDepartmentName(item.department) }}</span>
              </div>
            </div>
            <button
              @click="handleClaim(item._id)"
              :disabled="claimLoading === item._id"
              class="w-full py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
            >
              <Loader v-if="claimLoading === item._id" class="w-4 h-4 animate-spin" />
              <Plus v-else class="w-4 h-4" />
              <span>{{ claimLoading === item._id ? '认领中...' : '一键认领' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 进行中列 -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-4 py-3 border-b border-gray-200">
          <div class="flex items-center gap-2">
            <Loader class="w-5 h-5 text-blue-500" />
            <h3 class="font-semibold text-gray-900">进行中</h3>
            <span class="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">{{ inProgressCount }}</span>
          </div>
        </div>
        <div class="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          <div v-if="loading" class="flex justify-center py-8">
            <Loader class="w-6 h-6 text-primary animate-spin" />
          </div>
          <div v-else-if="inProgressItems.length === 0" class="text-center py-8 text-gray-400">
            暂无进行中事项
          </div>
          <div
            v-for="item in inProgressItems"
            :key="item._id"
            class="bg-blue-50/30 rounded-lg p-4 border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
            draggable="true"
          >
            <div class="flex items-start justify-between mb-2">
              <h4 class="font-medium text-gray-900 text-sm flex-1 pr-2 line-clamp-2" @click="goToDetail(item._id)">
                {{ item.title }}
              </h4>
            </div>
            <div class="flex items-center gap-2 mb-3 flex-wrap">
              <PriorityBadge :priority="item.priority" />
              <StatusBadge status="in_progress" />
            </div>
            <div class="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <div class="flex items-center gap-1">
                <Clock class="w-3.5 h-3.5" />
                <span>{{ formatDate(item.deadline) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <Building2 class="w-3.5 h-3.5" />
                <span>{{ getDepartmentName(item.department) }}</span>
              </div>
            </div>
            <button
              @click="goToDetail(item._id)"
              class="w-full py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-1"
            >
              <Send class="w-4 h-4" />
              <span>补充进度</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 已逾期列 -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-4 py-3 border-b border-red-200">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-5 h-5 text-red-500" />
            <h3 class="font-semibold text-gray-900">已逾期</h3>
            <span class="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{{ overdueCount }}</span>
          </div>
        </div>
        <div class="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          <div v-if="loading" class="flex justify-center py-8">
            <Loader class="w-6 h-6 text-primary animate-spin" />
          </div>
          <div v-else-if="overdueItems.length === 0" class="text-center py-8 text-gray-400">
            暂无逾期事项
          </div>
          <div
            v-for="item in overdueItems"
            :key="item._id"
            class="bg-red-50/50 rounded-lg p-4 border-2 border-red-300 hover:shadow-md transition-shadow cursor-pointer"
            draggable="true"
          >
            <div class="flex items-start justify-between mb-2">
              <h4 class="font-medium text-gray-900 text-sm flex-1 pr-2 line-clamp-2" @click="goToDetail(item._id)">
                {{ item.title }}
              </h4>
              <span class="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded whitespace-nowrap">
                逾期{{ getOverdueDays(item.deadline) }}天
              </span>
            </div>
            <div class="flex items-center gap-2 mb-3 flex-wrap">
              <PriorityBadge :priority="item.priority" />
              <StatusBadge status="overdue" />
            </div>
            <div class="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <div class="flex items-center gap-1">
                <Clock class="w-3.5 h-3.5 text-red-500" />
                <span class="text-red-600">{{ formatDate(item.deadline) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <Building2 class="w-3.5 h-3.5" />
                <span>{{ getDepartmentName(item.department) }}</span>
              </div>
            </div>
            <button
              @click="goToDetail(item._id)"
              class="w-full py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
            >
              <AlertTriangle class="w-4 h-4" />
              <span>查看详情</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部异常明细表格 -->
    <div class="bg-white rounded-lg shadow border-2 border-red-300">
      <div class="px-6 py-4 border-b border-red-200">
        <div class="flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-red-500" />
          <h3 class="font-semibold text-gray-900">异常明细</h3>
          <span class="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">仅显示逾期事项</span>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-red-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">事项标题</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负责人</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">截止日期</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">逾期天数</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-8 text-center">
                <Loader class="w-6 h-6 text-primary animate-spin mx-auto" />
              </td>
            </tr>
            <tr v-else-if="sortedOverdueItems.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-gray-400">
                暂无逾期事项
              </td>
            </tr>
            <tr
              v-for="item in sortedOverdueItems"
              :key="item._id"
              class="hover:bg-red-50/30 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 max-w-xs truncate" :title="item.title">
                  {{ item.title }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-1 text-sm text-gray-600">
                  <Building2 class="w-4 h-4 text-gray-400" />
                  {{ getDepartmentName(item.department) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-1 text-sm text-gray-600">
                  <User class="w-4 h-4 text-gray-400" />
                  {{ getUserName(item.assignee) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-1 text-sm text-gray-600">
                  <Clock class="w-4 h-4 text-gray-400" />
                  {{ formatDate(item.deadline) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                  {{ getOverdueDays(item.deadline) }} 天
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  @click="goToDetail(item._id)"
                  class="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  查看详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 快捷操作栏 - 固定在底部 -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-gray-700">快捷操作：</span>
          </div>
          
          <!-- 快速认领 -->
          <div class="flex items-center gap-2 flex-1">
            <div class="flex items-center gap-1 text-sm text-gray-500">
              <Plus class="w-4 h-4" />
              <span>快速认领</span>
            </div>
            <select
              v-model="quickClaimItemId"
              class="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            >
              <option value="">请选择待认领事项</option>
              <option v-for="item in pendingItems" :key="item._id" :value="item._id">
                {{ item.title }}
              </option>
            </select>
            <button
              @click="handleQuickClaim"
              :disabled="!quickClaimItemId || claimLoading !== null"
              class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <Loader v-if="claimLoading !== null" class="w-4 h-4 animate-spin" />
              <span>{{ claimLoading !== null ? '认领中...' : '认领' }}</span>
            </button>
          </div>

          <div class="w-px h-8 bg-gray-200"></div>

          <!-- 补充进度 -->
          <div class="flex items-center gap-2 flex-1">
            <div class="flex items-center gap-1 text-sm text-gray-500">
              <Send class="w-4 h-4" />
              <span>补充进度</span>
            </div>
            <select
              v-model="quickProgressItemId"
              class="max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            >
              <option value="">请选择进行中事项</option>
              <option v-for="item in inProgressItems" :key="item._id" :value="item._id">
                {{ item.title }}
              </option>
            </select>
            <input
              v-model="quickProgressContent"
              type="text"
              placeholder="输入进度内容..."
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              @keyup.enter="handleQuickProgress"
            />
            <button
              @click="handleQuickProgress"
              :disabled="!quickProgressItemId || !quickProgressContent.trim() || progressLoading"
              class="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <Loader v-if="progressLoading" class="w-4 h-4 animate-spin" />
              <Send v-else class="w-4 h-4" />
              <span>{{ progressLoading ? '提交中...' : '提交' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
