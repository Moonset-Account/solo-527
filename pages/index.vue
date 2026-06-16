<template>
  <div class="p-6 space-y-6">
    <PageHeader title="经营看板" description="今日门店运营概览" />

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="今日预约"
        :value="dashboard?.todayAppointments ?? '-'"
        :icon="CalendarCheck"
        color="primary"
      />
      <StatCard
        title="今日收入"
        :value="dashboard?.todayRevenue != null ? `¥${dashboard.todayRevenue}` : '-'"
        :icon="Banknote"
        color="success"
      />
      <StatCard
        title="到店客流"
        :value="dashboard?.todayFootTraffic ?? '-'"
        :icon="Users"
        color="primary"
      />
      <StatCard
        title="转化率"
        :value="dashboard?.conversionRate != null ? `${dashboard.conversionRate}%` : '-'"
        :icon="TrendingUp"
        :color="dashboard?.hasAlert ? 'danger' : 'warning'"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-4">到店转化预警</h2>
        <div v-if="dashboard?.hasAlert" class="space-y-3">
          <AlertCard
            v-for="alert in dashboard.alerts"
            :key="alert.id"
            :level="alert.alertLevel === 'CRITICAL' ? 'critical' : 'warning'"
            title="转化率预警"
            :message="alert.message || `当前转化率 ${alert.conversionRate}%，低于阈值 ${alert.threshold}%`"
            :timestamp="new Date(alert.createdAt).toLocaleString('zh-CN')"
          />
        </div>
        <div v-else class="card flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle class="w-5 h-5 text-success" />
          </div>
          <span class="text-sm font-medium text-gray-700">转化率正常</span>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-4">待办快速入口</h2>
        <div v-if="pendingTasks.length" class="space-y-2">
          <NuxtLink
            v-for="task in pendingTasks"
            :key="task.id"
            to="/tasks"
            class="card-hover flex items-center gap-3"
          >
            <StatusBadge :status="task.priority.toLowerCase()" type="priority" />
            <span class="text-sm text-gray-800 flex-1 truncate">{{ task.title }}</span>
            <ChevronRight class="w-4 h-4 text-gray-400 shrink-0" />
          </NuxtLink>
        </div>
        <div v-else class="card flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Inbox class="w-5 h-5 text-gray-400" />
          </div>
          <span class="text-sm text-gray-500">暂无待办事项</span>
        </div>
      </div>
    </div>

    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-4">最近预约</h2>
      <div class="card overflow-hidden !p-0">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-500">客户</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">车牌</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">服务类型</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">状态</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">预约时间</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">负责人</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="apt in recentAppointments" :key="apt.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-900">{{ apt.customerName }}</td>
              <td class="px-4 py-3 text-gray-700">{{ apt.vehicle?.plateNumber ?? '-' }}</td>
              <td class="px-4 py-3 text-gray-700">{{ serviceTypeMap[apt.serviceType] ?? apt.serviceType }}</td>
              <td class="px-4 py-3">
                <StatusBadge :status="normalizeStatus(apt.status)" type="appointment" />
              </td>
              <td class="px-4 py-3 text-gray-500">{{ formatDateTime(apt.scheduledAt) }}</td>
              <td class="px-4 py-3 text-gray-700">{{ apt.assignee?.name ?? '-' }}</td>
            </tr>
            <tr v-if="!recentAppointments.length">
              <td colspan="6" class="px-4 py-8 text-center text-gray-400">暂无预约记录</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CalendarCheck, Banknote, Users, TrendingUp, CheckCircle, ChevronRight, Inbox } from 'lucide-vue-next'

interface DashboardAlert {
  id: string
  storeId: string
  conversionRate: number
  threshold: number
  alertLevel: string
  message: string | null
  resolved: boolean
  createdAt: string
}

interface DashboardData {
  todayAppointments: number
  todayRevenue: number
  todayFootTraffic: number
  conversionRate: number
  hasAlert: boolean
  alerts: DashboardAlert[]
  pendingTasks: number
}

interface TaskItem {
  id: string
  title: string
  priority: string
}

interface AppointmentItem {
  id: string
  customerName: string
  serviceType: string
  status: string
  scheduledAt: string
  vehicle?: { plateNumber: string }
  assignee?: { name: string }
}

const serviceTypeMap: Record<string, string> = {
  WASH: '洗车',
  MAINTENANCE: '保养',
  TEST_DRIVE: '试驾',
}

const dashboard = ref<DashboardData | null>(null)
const pendingTasks = ref<TaskItem[]>([])
const recentAppointments = ref<AppointmentItem[]>([])

function normalizeStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, '-')
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  const [dashRes, tasksRes, aptRes] = await Promise.all([
    useFetch('/api/statistics/dashboard'),
    useFetch('/api/tasks', { query: { status: 'PENDING', pageSize: 5 } }),
    useFetch('/api/appointments', { query: { pageSize: 5 } }),
  ])

  if (dashRes.data.value?.success) {
    dashboard.value = dashRes.data.value.data
  }
  if (tasksRes.data.value?.success) {
    pendingTasks.value = tasksRes.data.value.data.items
  }
  if (aptRes.data.value?.success) {
    recentAppointments.value = aptRes.data.value.data.items
  }
})
</script>
