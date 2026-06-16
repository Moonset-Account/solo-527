<template>
  <div>
    <n-page-header title="我的申请" subtitle="查看和管理您提交的申请">
      <template #extra>
        <n-button type="primary" @click="goToCreate">
          <template #icon><PlusOutlined /></template>
          新建申请
        </n-button>
      </template>
    </n-page-header>

    <n-card class="mt-4">
      <n-space class="mb-4">
        <n-select
          v-model:value="filterStatus"
          placeholder="状态筛选"
          :options="statusOptions"
          style="width: 160px"
          clearable
        />
        <n-select
          v-model:value="filterType"
          placeholder="类型筛选"
          :options="typeOptions"
          style="width: 160px"
          clearable
        />
        <n-button @click="loadData">
          <template #icon><SearchOutlined /></template>
          搜索
        </n-button>
      </n-space>

      <n-data-table
        :columns="columns"
        :data="requests"
        :loading="loading"
        :bordered="false"
        :pagination="pagination"
        @update:page="handlePageChange"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NPageHeader,
  NCard,
  NSpace,
  NSelect,
  NButton,
  NDataTable,
  NIcon,
  NTag,
  useMessage,
} from 'naive-ui'
import { PlusOutlined, SearchOutlined } from '@vicons/antd'
import { useApiClient } from '~/composables/useApiClient'

definePageMeta({
  layout: 'admin',
  requiresAuth: true,
})

const router = useRouter()
const message = useMessage()
const api = useApiClient()

const loading = ref(false)
const requests = ref<any[]>([])
const filterStatus = ref<string | null>(null)
const filterType = ref<string | null>(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已完成', value: 'completed' },
  { label: '已回滚', value: 'rolled_back' },
]

const typeOptions = [
  { label: '账号变更', value: 'account_change' },
  { label: '故障上报', value: 'fault_report' },
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
    render: (row: any) => h(NTag, { type: 'default', size: 'small' }, { default: () => requestTypeLabel[row.request_type] || row.request_type }),
  },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  {
    title: '当前阶段',
    key: 'current_stage',
    width: 110,
    render: (row: any) => stageLabel[row.current_stage] || row.current_stage,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: any) => h(NTag, { type: statusTagType[row.status] as any || 'default', size: 'small' }, { default: () => statusLabel[row.status] || row.status }),
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row: any) => h(
      NButton,
      { size: 'small', type: 'primary', onClick: () => viewDetail(row.id) },
      { default: () => '查看' }
    ),
  },
]

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const goToCreate = () => {
  router.push('/requests/new')
}

const viewDetail = (id: number) => {
  router.push(`/requests/${id}`)
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
      my_requests: true,
    }
    if (filterStatus.value) params.status = filterStatus.value
    if (filterType.value) params.request_type = filterType.value

    const data = await api.requests.list(params)
    requests.value = data as any[]
  } catch (error: any) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadData()
}

onMounted(() => {
  loadData()
})
</script>
