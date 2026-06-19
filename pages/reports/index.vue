<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">报表中心</h1>
        <p class="text-slate-500 mt-1">月底复盘、售后闭环数据分析</p>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="selectedMonth" class="input w-40">
          <option v-for="month in monthOptions" :key="month" :value="month">
            {{ month }}
          </option>
        </select>
        <button class="btn-secondary">
          <Download class="w-4 h-4 mr-1" />
          导出报表
        </button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="card p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-slate-500">总项目数</p>
            <p class="text-3xl font-bold text-slate-800 mt-2">{{ monthlyReport?.totalProjects || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Building2 class="w-6 h-6 text-primary-600" />
          </div>
        </div>
        <p class="text-xs text-slate-400 mt-3">较上月 +12%</p>
      </div>
      <div class="card p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-slate-500">已完成项目</p>
            <p class="text-3xl font-bold text-success-600 mt-2">{{ monthlyReport?.completedProjects || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
            <CheckCircle class="w-6 h-6 text-success-600" />
          </div>
        </div>
        <p class="text-xs text-slate-400 mt-3">完成率 {{ completionRate }}%</p>
      </div>
      <div class="card p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-slate-500">延期项目</p>
            <p class="text-3xl font-bold text-warning-600 mt-2">{{ monthlyReport?.delayedProjects || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-warning-600" />
          </div>
        </div>
        <p class="text-xs text-slate-400 mt-3">延期率 {{ delayRate }}%</p>
      </div>
      <div class="card p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-slate-500">预算变更总额</p>
            <p class="text-3xl font-bold text-danger-600 mt-2">
              ¥{{ monthlyReport?.totalBudgetChange?.toLocaleString() || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center">
            <TrendingUp class="w-6 h-6 text-danger-600" />
          </div>
        </div>
        <p class="text-xs text-slate-400 mt-3">共 {{ budgetChangeCount }} 次变更</p>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 card p-6">
        <h2 class="font-semibold text-slate-800 mb-4">项目状态分布</h2>
        <div class="flex items-center gap-8">
          <div class="flex-1 space-y-4">
            <div v-for="item in statusDistribution" :key="item.status" class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">{{ item.label }}</span>
                <span class="font-medium text-slate-700">{{ item.count }} 个</span>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="item.colorClass"
                  :style="{ width: item.percent + '%' }"
                ></div>
              </div>
            </div>
          </div>
          <div class="w-40 h-40 relative">
            <div class="absolute inset-0 rounded-full border-8 border-slate-100"></div>
            <div class="absolute inset-4 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <div class="text-center">
                <p class="text-2xl font-bold text-white">{{ monthlyReport?.totalProjects || 0 }}</p>
                <p class="text-xs text-primary-100">总项目</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h2 class="font-semibold text-slate-800 mb-4">售后闭环</h2>
        <div class="space-y-4">
          <div class="p-4 bg-success-50 rounded-xl">
            <div class="flex items-center justify-between">
              <span class="text-sm text-success-700">闭环率</span>
              <span class="text-2xl font-bold text-success-600">{{ closureReport?.closureRate?.toFixed(1) || 0 }}%</span>
            </div>
            <div class="h-2 bg-success-200/50 rounded-full mt-2">
              <div
                class="h-full bg-success-500 rounded-full"
                :style="{ width: (closureReport?.closureRate || 0) + '%' }"
              ></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-slate-50 rounded-lg text-center">
              <p class="text-xs text-slate-500">总巡检数</p>
              <p class="font-semibold text-slate-700">{{ closureReport?.totalInspections || 0 }}</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-lg text-center">
              <p class="text-xs text-slate-500">已完成</p>
              <p class="text-success-600 font-medium">{{ closureReport?.completedInspections || 0 }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-slate-50 rounded-lg text-center">
              <p class="text-xs text-slate-500">整改项总数</p>
              <p class="text-warning-600 font-medium">{{ closureReport?.totalRectifications || 0 }}</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-lg text-center">
              <p class="text-xs text-slate-500">已完成整改</p>
              <p class="text-success-600 font-medium">{{ closureReport?.completedRectifications || 0 }}</p>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100">
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">平均闭环天数</span>
              <span class="text-slate-700 font-medium">{{ closureReport?.avgClosureDays?.toFixed(1) || 0 }} 天</span>
            </div>
            <div class="flex justify-between text-sm mt-2">
              <span class="text-slate-500">延期数量</span>
              <span class="text-danger-600 font-medium">{{ closureReport?.delayedCount || 0 }} 项</span>
            </div>
            <div class="flex justify-between text-sm mt-2">
              <span class="text-slate-500">平均整改天数</span>
              <span class="text-slate-700 font-medium">{{ monthlyReport?.avgRectificationDays?.toFixed(1) || 0 }} 天</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-slate-800">预算变更趋势</h2>
        <div class="flex items-center gap-2">
          <button
            v-for="period in periods"
            :key="period.key"
            class="px-3 py-1 text-sm rounded-lg transition-colors"
            :class="activePeriod === period.key ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:bg-slate-100'"
            @click="activePeriod = period.key"
          >
            {{ period.label }}
          </button>
        </div>
      </div>
      <div class="h-64 flex items-end justify-around gap-2 px-4">
        <div
          v-for="(item, idx) in budgetTrendData"
          :key="idx"
          class="flex-1 flex flex-col items-center gap-2"
        >
          <div class="w-full bg-slate-100 rounded-t-lg relative" style="height: 200px">
            <div
              class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all"
              :style="{ height: item.heightPercent + '%' }"
            >
              <div
                v-if="item.changeAmount !== 0"
                class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap"
                :class="item.changeAmount >= 0 ? 'text-danger-600' : 'text-success-600'"
              >
                {{ item.changeAmount >= 0 ? '+' : '' }}{{ item.changeAmount / 1000 }}k
              </div>
            </div>
          </div>
          <span class="text-xs text-slate-500">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-slate-800">延期项目明细</h2>
        <span class="text-sm text-slate-500">共 {{ delayedProjects.length }} 个项目</span>
      </div>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>项目名称</th>
              <th>业主</th>
              <th>计划完成</th>
              <th>延期天数</th>
              <th>当前阶段</th>
              <th>延期原因</th>
              <th>负责人</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in delayedProjects" :key="project.id" class="cursor-pointer hover:bg-slate-50" @click="goToProject(project.id)">
              <td class="font-medium text-slate-700">{{ project.name }}</td>
              <td>{{ project.ownerName }}</td>
              <td>{{ formatDate(project.endDate) }}</td>
              <td class="text-danger-600 font-medium">{{ project.delayDays }} 天</td>
              <td>{{ project.currentStage }}</td>
              <td class="text-slate-500 text-sm">{{ project.delayReason }}</td>
              <td>
                <span class="badge badge-primary">{{ project.managerName }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-slate-800">售后闭环记录</h2>
        <span class="text-sm text-slate-500">本月共 {{ closureRecords.length }} 条</span>
      </div>
      <div class="space-y-3">
        <div
          v-for="record in closureRecords"
          :key="record.id"
          class="p-4 border border-slate-200 rounded-xl hover:border-primary-300 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="record.status === 'closed' ? 'bg-success-100' : 'bg-warning-100'"
              >
                <CheckCircle v-if="record.status === 'closed'" class="w-5 h-5 text-success-600" />
                <Clock v-else class="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <h3 class="font-medium text-slate-800">{{ record.title }}</h3>
                <p class="text-sm text-slate-500 mt-0.5">
                  项目：{{ record.projectName }} · 类型：{{ record.type }}
                </p>
                <div class="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span>创建时间：{{ formatDateTime(record.createdAt) }}</span>
                  <span v-if="record.closedAt">闭环时间：{{ formatDateTime(record.closedAt) }}</span>
                  <span>处理人：{{ record.handlerName }}</span>
                </div>
              </div>
            </div>
            <span class="badge" :class="record.status === 'closed' ? 'badge-success' : 'badge-warning'">
              {{ record.status === 'closed' ? '已闭环' : '处理中' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Download,
  Building2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-vue-next'
import type { MonthlyReport, ClosureReport } from '~/types'

const selectedMonth = ref('2024-01')
const activePeriod = ref('6m')
const monthlyReport = ref<MonthlyReport | null>(null)
const closureReport = ref<ClosureReport | null>(null)

const monthOptions = [
  '2024-01', '2023-12', '2023-11', '2023-10', '2023-09', '2023-08',
]

const periods = [
  { key: '3m', label: '近3个月' },
  { key: '6m', label: '近6个月' },
  { key: '12m', label: '近12个月' },
]

const completionRate = computed(() => {
  if (!monthlyReport.value?.totalProjects) return 0
  return ((monthlyReport.value.completedProjects / monthlyReport.value.totalProjects) * 100).toFixed(1)
})

const delayRate = computed(() => {
  if (!monthlyReport.value?.totalProjects) return 0
  return ((monthlyReport.value.delayedProjects / monthlyReport.value.totalProjects) * 100).toFixed(1)
})

const budgetChangeCount = computed(() => 8)

const statusDistribution = computed(() => [
  { status: 'in_progress', label: '进行中', count: 15, percent: 50, colorClass: 'bg-primary-500' },
  { status: 'completed', label: '已完成', count: 8, percent: 26.7, colorClass: 'bg-success-500' },
  { status: 'quoting', label: '报价中', count: 4, percent: 13.3, colorClass: 'bg-warning-500' },
  { status: 'draft', label: '草稿', count: 2, percent: 6.7, colorClass: 'bg-slate-400' },
  { status: 'delayed', label: '延期', count: 1, percent: 3.3, colorClass: 'bg-danger-500' },
])

const budgetTrendData = computed(() => [
  { label: '8月', total: 240000, changeAmount: 0, heightPercent: 60 },
  { label: '9月', total: 255000, changeAmount: 15000, heightPercent: 64 },
  { label: '10月', total: 250000, changeAmount: -5000, heightPercent: 62 },
  { label: '11月', total: 268000, changeAmount: 18000, heightPercent: 67 },
  { label: '12月', total: 275000, changeAmount: 7000, heightPercent: 69 },
  { label: '1月', total: 285000, changeAmount: 10000, heightPercent: 71 },
])

const delayedProjects = [
  { id: '1', name: '万科城一期A栋', ownerName: '王先生', endDate: '2024-01-15', delayDays: 15, currentStage: '瓦工阶段', delayReason: '材料供应延迟', managerName: '李经理' },
  { id: '2', name: '恒大名都3号楼', ownerName: '张先生', endDate: '2024-01-20', delayDays: 10, currentStage: '木工阶段', delayReason: '设计变更增加工作量', managerName: '王经理' },
]

const closureRecords = [
  { id: '1', title: '水电工程验收整改闭环', projectName: '万科城一期A栋', type: '整改闭环', status: 'closed', createdAt: '2024-01-20T10:00:00', closedAt: '2024-01-22T16:00:00', handlerName: '李经理' },
  { id: '2', title: '瓦工质量问题处理', projectName: '碧桂园二期B栋', type: '售后处理', status: 'closed', createdAt: '2024-01-18T14:00:00', closedAt: '2024-01-20T10:00:00', handlerName: '赵客服' },
  { id: '3', title: '预算变更业主确认', projectName: '恒大名都3号楼', type: '确认闭环', status: 'processing', createdAt: '2024-01-21T09:00:00', closedAt: null, handlerName: '李经理' },
  { id: '4', title: '延期项目沟通跟进', projectName: '保利天汇C区', type: '沟通闭环', status: 'processing', createdAt: '2024-01-19T11:00:00', closedAt: null, handlerName: '赵客服' },
]

const formatDate = (date: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const goToProject = (id: string) => {
  navigateTo(`/projects/${id}`)
}

const fetchMonthlyReport = async () => {
  try {
    const data = await $fetch<MonthlyReport>('/api/reports/monthly', {
      params: { month: selectedMonth.value },
    })
    monthlyReport.value = data
  } catch {
    monthlyReport.value = {
      month: selectedMonth.value,
      totalProjects: 30,
      completedProjects: 18,
      delayedProjects: 3,
      totalBudgetChange: 45000,
      closureRate: 89.5,
      avgRectificationDays: 3.2,
    }
  }
}

const fetchClosureReport = async () => {
  try {
    const data = await $fetch<ClosureReport>('/api/reports/closure', {
      params: { month: selectedMonth.value },
    })
    closureReport.value = data
  } catch {
    closureReport.value = {
      totalInspections: 56,
      completedInspections: 48,
      totalRectifications: 124,
      completedRectifications: 108,
      closureRate: 87.1,
      avgClosureDays: 4.5,
      delayedCount: 8,
    }
  }
}

onMounted(() => {
  fetchMonthlyReport()
  fetchClosureReport()
})

definePageMeta({ layout: 'default' })
</script>
