<template>
  <div>
    <n-page-header title="审批管理" subtitle="处理变更窗口和回滚方案审批" />

    <n-card class="mt-4">
      <n-tabs v-model:value="activeTab" type="line">
        <n-tab-pane name="pending" tab="待审批">
          <n-data-table
            :columns="columns"
            :data="pendingRequests"
            :loading="loading"
            :bordered="false"
            size="small"
          />
        </n-tab-pane>
        <n-tab-pane name="all" tab="全部申请">
          <n-space class="mb-4">
            <n-select
              v-model:value="filterStage"
              placeholder="阶段筛选"
              :options="stageOptions"
              style="width: 160px"
              clearable
            />
            <n-select
              v-model:value="filterStatus"
              placeholder="状态筛选"
              :options="statusOptions"
              style="width: 160px"
              clearable
            />
            <n-button @click="loadAllRequests">
              <template #icon><SearchOutlined /></template>
              搜索
            </n-button>
          </n-space>
          <n-data-table
            :columns="columns"
            :data="allRequests"
            :loading="loading"
            :bordered="false"
          />
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NPageHeader,
  NCard,
  NTabs,
  NTabPane,
  NDataTable,
  NSpace,
  NSelect,
  NButton,
  NTag,
  NIcon,
  useMessage,
} from 'naive-ui'
import { SearchOutlined } from '@vicons/antd'
import { useApiClient } from '~/composables/useApiClient'

definePageMeta({
  layout: 'admin',
  requiresAuth: true,
  requiresAdmin: true,
})

const router = useRouter()
const message = useMessage()
const api = useApiClient()

const activeTab = ref('pending')
const loading = ref(false)
const pendingRequests = ref<any[]>([])
const allRequests = ref<any[]>([])
const filterStage = ref<string | null>(null)
const filterStatus = ref<string | null>(null)

const stageOptions = [
  { label: '变更窗口', value: 'change_window' },
  { label: '回滚方案', value: 'rollback_plan' },
  { label: '实施中', value: 'implementation' },
]

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已拒绝', value: 'rejected' },
]

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

const stageLabel: Record<string, string> = {
  change_window: '变更窗口',
  rollback_plan: '回滚方案',
  implementation: '实施中',
}

const requestTypeLabel: Record<string, string> = {
  account_change: '账号变更',
  fault_report: '故障上报',
}

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  {
    title: '类型',
    key: 'request_type',
    width: 100,
    render: (row: any) => h(NTag, { size: 'small' }, { default: () => requestTypeLabel[row.request_type] }),
  },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: '申请人', key: 'requester_name', width: 120 },
  {
    title: '当前阶段',
    key: 'current_stage',
    width: 110,
    render: (row: any) => h(NTag, { type: 'info', size: 'small' }, { default: () => stageLabel[row.current_stage] }),
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: any) => h(NTag, { type: statusTagType[row.status] as any, size: 'small' }, { default: () => statusLabel[row.status] }),
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row: any) => h(
      NButton,
      { size: 'small', type: 'primary', onClick: () => viewDetail(row.id) },
      { default: () => '审批' }
    ),
  },
]

const viewDetail = (id: number) => {
  router.push(`/requests/${id}`)
}

const loadPendingRequests = async () => {
  loading.value = true
  try {
    const data = await api.requests.list({ limit: 50 })
    const all = data as any[]
    pendingRequests.value = all.filter(r =>
      (r.current_stage === 'change_window' && !r.change_window_approved) ||
      (r.current_stage === 'rollback_plan' && !r.rollback_plan_approved)
    )
  } catch (error: any) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadAllRequests = async () => {
  loading.value = true
  try {
    const params: any = { limit: 100 }
    if (filterStatus.value) params.status = filterStatus.value
    const data = await api.requests.list(params)
    let list = data as any[]
    if (filterStage.value) {
      list = list.filter(r => r.current_stage === filterStage.value)
    }
    allRequests.value = list
  } catch (error: any) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPendingRequests()
  loadAllRequests()
})
</script>
