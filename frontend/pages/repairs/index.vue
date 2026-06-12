<template>
  <NCard title="我的报修">
    <template #header-extra>
      <NButton type="primary" @click="navigateTo('/repairs/submit')">提交报修</NButton>
    </template>

    <NSpace style="margin-bottom: 16px">
      <NTag
        v-for="s in statusTabs"
        :key="s.value"
        :type="s.type"
        :bordered="currentStatus === s.value"
        style="cursor: pointer"
        @click="filterByStatus(s.value)"
      >
        {{ s.label }}
      </NTag>
    </NSpace>

    <NDataTable
      :columns="columns"
      :data="repairs"
      :loading="loading"
      :pagination="pagination"
      :row-key="(row: any) => row.id"
      @update:page="handlePageChange"
    />
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NTag, NButton, NDataTable, NSpace, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const api = useApi()
const router = useRouter()
const message = useMessage()
const loading = ref(false)
const repairs = ref<any[]>([])
const currentStatus = ref('')

const statusTabs = [
  { label: '全部', value: '', type: 'default' as const },
  { label: '待审核', value: 'pending', type: 'info' as const },
  { label: '审核中', value: 'in_review', type: 'warning' as const },
  { label: '已通过', value: 'approved', type: 'success' as const },
  { label: '已驳回', value: 'rejected', type: 'error' as const },
  { label: '处理中', value: 'in_progress', type: 'warning' as const },
  { label: '已完成', value: 'completed', type: 'success' as const },
  { label: '已关闭', value: 'closed', type: 'default' as const }
]

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const categoryMap: Record<string, string> = {
  plumbing: '水管',
  electrical: '电路',
  furniture: '家具',
  door_window: '门窗',
  other: '其他'
}

const statusMap: Record<string, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  pending: { label: '待审核', type: 'info' },
  in_review: { label: '审核中', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'error' },
  in_progress: { label: '处理中', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  closed: { label: '已关闭', type: 'default' }
}

const urgencyMap: Record<string, { label: string; type: 'default' | 'info' | 'warning' | 'error' }> = {
  low: { label: '低', type: 'default' },
  medium: { label: '中', type: 'info' },
  high: { label: '高', type: 'error' }
}

const columns: DataTableColumns = [
  { title: '工单号', key: 'id', width: 80 },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  {
    title: '类别', key: 'category', width: 80,
    render(row: any) {
      return categoryMap[row.category] || row.category
    }
  },
  {
    title: '状态', key: 'status', width: 100,
    render(row: any) {
      const s = statusMap[row.status] || { label: row.status, type: 'default' as const }
      return h(NTag, { type: s.type, size: 'small' }, { default: () => s.label })
    }
  },
  {
    title: '紧急程度', key: 'urgency', width: 90,
    render(row: any) {
      const u = urgencyMap[row.urgency] || { label: row.urgency, type: 'default' as const }
      return h(NTag, { type: u.type, size: 'small' }, { default: () => u.label })
    }
  },
  { title: '创建时间', key: 'created_at', width: 160 },
  {
    title: '通知回执', key: 'notification_receipt', width: 100,
    render(row: any) {
      if (row.notification_receipts && row.notification_receipts.length > 0) {
        return h(NTag, { type: 'success', size: 'small' }, { default: () => '已通知' })
      }
      return h(NTag, { type: 'default', size: 'small' }, { default: () => '未通知' })
    }
  },
  {
    title: '操作', key: 'actions', width: 80,
    render(row: any) {
      return h(NButton, { size: 'small', onClick: () => router.push(`/repairs/${row.id}`) }, { default: () => '查看' })
    }
  }
]

function filterByStatus(status: string) {
  currentStatus.value = status
  pagination.page = 1
  fetchRepairs()
}

async function fetchRepairs() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize
    }
    if (currentStatus.value) {
      params.status = currentStatus.value
    }
    const res = await api.getRepairs(params) as any[]
    repairs.value = Array.isArray(res) ? res : []
  } catch (e: any) {
    message.error('获取报修列表失败')
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchRepairs()
}

onMounted(() => {
  fetchRepairs()
})
</script>
