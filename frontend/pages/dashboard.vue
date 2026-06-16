<template>
  <div>
    <n-page-header title="首页" subtitle="欢迎使用IT账号变更审批系统" />

    <n-grid :cols="4" :x-gap="16" :y-gap="16" class="mt-6">
      <n-grid-item>
        <n-card hoverable>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">我的申请</p>
              <p class="text-2xl font-bold mt-2">{{ stats.myRequests }}</p>
            </div>
            <n-icon size="36" class="text-blue-500">
              <FileTextOutlined />
            </n-icon>
          </div>
        </n-card>
      </n-grid-item>

      <n-grid-item v-if="authStore.isAdmin">
        <n-card hoverable>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">待审批</p>
              <p class="text-2xl font-bold mt-2 text-orange-500">{{ stats.pendingApproval }}</p>
            </div>
            <n-icon size="36" class="text-orange-500">
              <ClockCircleOutlined />
            </n-icon>
          </div>
        </n-card>
      </n-grid-item>

      <n-grid-item v-if="authStore.isAdmin">
        <n-card hoverable>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">待处理告警</p>
              <p class="text-2xl font-bold mt-2 text-red-500">{{ stats.pendingAlerts }}</p>
            </div>
            <n-icon size="36" class="text-red-500">
              <AlertOutlined />
            </n-icon>
          </div>
        </n-card>
      </n-grid-item>

      <n-grid-item v-if="authStore.isSecurityOfficer">
        <n-card hoverable>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">待修复漏洞</p>
              <p class="text-2xl font-bold mt-2 text-purple-500">{{ stats.pendingVulns }}</p>
            </div>
            <n-icon size="36" class="text-purple-500">
              <BugOutlined />
            </n-icon>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-card class="mt-6" title="快捷操作">
      <n-space>
        <n-button type="primary" @click="goToCreate">
          <template #icon><PlusOutlined /></template>
          提交申请
        </n-button>
        <n-button v-if="authStore.isAdmin" type="default" @click="goToApprovals">
          <template #icon><CheckCircleOutlined /></template>
          审批管理
        </n-button>
        <n-button v-if="authStore.isAdmin" type="default" @click="goToDevices">
          <template #icon><DesktopOutlined /></template>
          设备巡检
        </n-button>
      </n-space>
    </n-card>

    <n-card class="mt-6" title="最近申请">
      <n-data-table
        :columns="columns"
        :data="recentRequests"
        :bordered="false"
        size="small"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  NPageHeader,
  NGrid,
  NGridItem,
  NCard,
  NButton,
  NSpace,
  NDataTable,
  NIcon,
  NTag,
  useMessage,
} from 'naive-ui'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  BugOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  DesktopOutlined,
} from '@vicons/antd'
import { useAuthStore } from '~/stores/auth'
import { useApiClient } from '~/composables/useApiClient'
import { h } from 'vue'

definePageMeta({
  layout: 'admin',
  requiresAuth: true,
})

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const api = useApiClient()

const stats = ref({
  myRequests: 0,
  pendingApproval: 0,
  pendingAlerts: 0,
  pendingVulns: 0,
})

const recentRequests = ref<any[]>([])

const statusTagType: Record<string, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  in_progress: 'info',
  completed: 'success',
  rolled_back: 'default',
}

const statusLabel: Record<string, string> = {
  pending: '待处理',
  approved: '已通过',
  rejected: '已拒绝',
  in_progress: '进行中',
  completed: '已完成',
  rolled_back: '已回滚',
}

const requestTypeLabel: Record<string, string> = {
  account_change: '账号变更',
  fault_report: '故障上报',
}

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '类型', key: 'request_type', render: (row: any) => h(NTag, { type: 'default' }, { default: () => requestTypeLabel[row.request_type] || row.request_type }) },
  { title: '标题', key: 'title' },
  {
    title: '状态',
    key: 'status',
    render: (row: any) => h(NTag, { type: statusTagType[row.status] as any || 'default' }, { default: () => statusLabel[row.status] || row.status }),
  },
  { title: '创建时间', key: 'created_at', render: (row: any) => formatDate(row.created_at) },
]

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const goToCreate = () => {
  router.push('/requests/new')
}

const goToApprovals = () => {
  router.push('/approvals')
}

const goToDevices = () => {
  router.push('/devices')
}

const loadStats = async () => {
  try {
    const [requestsRes, alertsRes, vulnsRes] = await Promise.all([
      api.requests.list({ limit: 100, my_requests: true }),
      authStore.isAdmin ? api.alerts.list({ limit: 1, status: 'unconfirmed' }) : Promise.resolve([]),
      authStore.isSecurityOfficer ? api.vulnerabilities.list({ limit: 1, status: 'identified' }) : Promise.resolve([]),
    ] as any[])

    const requests = requestsRes as any[]
    stats.value.myRequests = requests.length

    if (authStore.isAdmin) {
      const pendingReqs = requests.filter((r: any) => r.status === 'pending' || r.current_stage !== 'implementation')
      stats.value.pendingApproval = pendingReqs.length
    }

    if (alertsRes && Array.isArray(alertsRes)) {
      stats.value.pendingAlerts = alertsRes.length > 0 ? 10 : 0
    }

    if (vulnsRes && Array.isArray(vulnsRes)) {
      stats.value.pendingVulns = vulnsRes.length > 0 ? 5 : 0
    }

    recentRequests.value = requests.slice(0, 5)
  } catch (error: any) {
    message.error('加载数据失败')
  }
}

onMounted(() => {
  loadStats()
})
</script>
