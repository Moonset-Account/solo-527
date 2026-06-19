<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">预算管理</h1>
        <p class="text-slate-500 mt-1">所有项目预算版本管理和变更追踪</p>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-slate-500">总预算金额</p>
        <p class="text-2xl font-bold text-slate-800 mt-1">
          ¥{{ totalBudget.toLocaleString() }}
        </p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">本月变更</p>
        <p class="text-2xl font-bold text-danger-600 mt-1">
          +¥{{ monthlyChange.toLocaleString() }}
        </p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">待确认版本</p>
        <p class="text-2xl font-bold text-warning-600 mt-1">{{ pendingVersions }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">预算变更次数</p>
        <p class="text-2xl font-bold text-slate-800 mt-1">{{ totalChanges }}</p>
      </div>
    </div>

    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-slate-800">项目预算概览</h2>
        <div class="flex items-center gap-2">
          <input v-model="searchKeyword" class="input text-sm py-1 w-48" placeholder="搜索项目..." />
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>项目名称</th>
              <th>业主</th>
              <th>当前版本</th>
              <th>当前预算</th>
              <th>累计变更</th>
              <th>版本数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="project in filteredProjects"
              :key="project.id"
              class="cursor-pointer hover:bg-slate-50"
              @click="goToProject(project.id)"
            >
              <td class="font-medium text-slate-700">{{ project.name }}</td>
              <td>{{ project.ownerName }}</td>
              <td>
                <span class="font-medium">V{{ project.currentVersion }}</span>
              </td>
              <td class="font-medium text-slate-800">
                ¥{{ project.currentBudget?.toLocaleString() || '-' }}
              </td>
              <td>
                <span
                  v-if="project.totalChange"
                  :class="project.totalChange >= 0 ? 'text-danger-600' : 'text-success-600'"
                  class="font-medium"
                >
                  {{ project.totalChange >= 0 ? '+' : '' }}¥{{ project.totalChange.toLocaleString() }}
                </span>
                <span v-else class="text-slate-400">-</span>
              </td>
              <td>{{ project.versionCount }} 版</td>
              <td>
                <span v-if="project.hasPendingVersion" class="badge badge-warning">
                  待确认
                </span>
                <span v-else class="badge badge-success">
                  已确认
                </span>
              </td>
              <td>
                <button class="text-primary-600 hover:text-primary-700 text-sm">
                  查看详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card p-6">
      <h2 class="font-semibold text-slate-800 mb-4">最近预算变更</h2>
      <div class="space-y-3">
        <div
          v-for="change in recentChanges"
          :key="change.id"
          class="p-4 border border-slate-200 rounded-xl hover:border-primary-300 transition-colors cursor-pointer"
          @click="goToProject(change.projectId)"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-medium text-slate-800">{{ change.projectName }}</h3>
              <p class="text-sm text-slate-500 mt-1">
                第 {{ change.fromVersion }} 版 → 第 {{ change.toVersion }} 版
                <span class="mx-2">·</span>
                {{ change.reason }}
              </p>
            </div>
            <div class="text-right">
              <p
                class="text-lg font-bold"
                :class="change.amount >= 0 ? 'text-danger-600' : 'text-success-600'"
              >
                {{ change.amount >= 0 ? '+' : '' }}¥{{ change.amount.toLocaleString() }}
              </p>
              <p class="text-xs text-slate-400 mt-1">{{ formatDate(change.date) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Project } from '~/types'

interface BudgetProject extends Project {
  currentVersion: number
  currentBudget: number
  totalChange: number
  versionCount: number
  hasPendingVersion: boolean
}

interface BudgetChange {
  id: string
  projectId: string
  projectName: string
  fromVersion: number
  toVersion: number
  amount: number
  reason: string
  date: string
}

const projects = ref<BudgetProject[]>([])
const searchKeyword = ref('')

const totalBudget = computed(() => {
  return projects.value.reduce((sum, p) => sum + (p.currentBudget || 0), 0)
})

const monthlyChange = computed(() => 45000)

const pendingVersions = computed(() => {
  return projects.value.filter(p => p.hasPendingVersion).length
})

const totalChanges = computed(() => 12)

const filteredProjects = computed(() => {
  if (!searchKeyword.value) return projects.value
  const kw = searchKeyword.value.toLowerCase()
  return projects.value.filter(p =>
    p.name.toLowerCase().includes(kw) ||
    p.ownerName.toLowerCase().includes(kw)
  )
})

const recentChanges: BudgetChange[] = [
  { id: '1', projectId: '1', projectName: '万科城一期A栋', fromVersion: 2, toVersion: 3, amount: 15000, reason: '增加水电改造工程量及材料升级', date: '2024-01-15' },
  { id: '2', projectId: '1', projectName: '万科城一期A栋', fromVersion: 1, toVersion: 2, amount: 5000, reason: '材料升级', date: '2024-01-05' },
  { id: '3', projectId: '2', projectName: '碧桂园二期B栋', fromVersion: 1, toVersion: 2, amount: 8000, reason: '增加定制柜体', date: '2024-01-20' },
  { id: '4', projectId: '5', projectName: '保利天汇C区', fromVersion: 1, toVersion: 2, amount: -3000, reason: '减少部分工程项目', date: '2024-01-18' },
]

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const goToProject = (id: string) => {
  navigateTo(`/projects/${id}`)
}

const fetchProjects = async () => {
  try {
    const data = await $fetch<any>('/api/projects')
    projects.value = data.data || []
  } catch {
    projects.value = mockProjects
  }
}

const mockProjects: BudgetProject[] = [
  {
    id: '1',
    name: '万科城一期A栋',
    ownerId: '1',
    ownerName: '王先生',
    status: 'in_progress',
    currentBudgetVersionId: 'bv1',
    startDate: null,
    endDate: null,
    description: '',
    attachments: [],
    currentVersion: 3,
    currentBudget: 285000,
    totalChange: 20000,
    versionCount: 3,
    hasPendingVersion: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '2',
    name: '碧桂园二期B栋',
    ownerId: '2',
    ownerName: '李女士',
    status: 'in_progress',
    currentBudgetVersionId: 'bv2',
    startDate: null,
    endDate: null,
    description: '',
    attachments: [],
    currentVersion: 2,
    currentBudget: 198000,
    totalChange: 8000,
    versionCount: 2,
    hasPendingVersion: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '3',
    name: '恒大名都3号楼',
    ownerId: '1',
    ownerName: '王先生',
    status: 'quoting',
    currentBudgetVersionId: null,
    startDate: null,
    endDate: null,
    description: '',
    attachments: [],
    currentVersion: 1,
    currentBudget: 350000,
    totalChange: 0,
    versionCount: 1,
    hasPendingVersion: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '4',
    name: '融创滨江壹号',
    ownerId: '2',
    ownerName: '李女士',
    status: 'completed',
    currentBudgetVersionId: null,
    startDate: null,
    endDate: null,
    description: '',
    attachments: [],
    currentVersion: 2,
    currentBudget: 220000,
    totalChange: 5000,
    versionCount: 2,
    hasPendingVersion: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '5',
    name: '保利天汇C区',
    ownerId: '1',
    ownerName: '王先生',
    status: 'in_progress',
    currentBudgetVersionId: null,
    startDate: null,
    endDate: null,
    description: '',
    attachments: [],
    currentVersion: 2,
    currentBudget: 157000,
    totalChange: -3000,
    versionCount: 2,
    hasPendingVersion: false,
    createdAt: '',
    updatedAt: '',
  },
]

onMounted(() => {
  fetchProjects()
})

definePageMeta({ layout: 'default' })
</script>
