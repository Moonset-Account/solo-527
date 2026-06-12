<template>
  <NCard title="审核管理">
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

    <NModal v-model:show="showAuditModal" preset="dialog" title="审核操作">
      <NForm label-placement="left" label-width="80">
        <NFormItem label="操作">
          <NSelect v-model:value="auditAction" :options="auditActionOptions" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="auditComment" type="textarea" :rows="3" placeholder="请输入审核备注" />
        </NFormItem>
      </NForm>
      <template #action>
        <NSpace>
          <NButton @click="showAuditModal = false">取消</NButton>
          <NButton type="primary" :loading="auditLoading" @click="submitAudit">确认</NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NTag, NDataTable, NButton, NSpace, NModal, NForm, NFormItem, NInput, NSelect, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const api = useApi()
const message = useMessage()
const loading = ref(false)
const repairs = ref<any[]>([])
const currentStatus = ref('pending')
const showAuditModal = ref(false)
const auditAction = ref('approve')
const auditComment = ref('')
const auditLoading = ref(false)
const currentOrderId = ref<number | null>(null)

const statusTabs = [
  { label: '待审核', value: 'pending', type: 'info' as const },
  { label: '审核中', value: 'in_review', type: 'warning' as const },
  { label: '已通过', value: 'approved', type: 'success' as const },
  { label: '处理中', value: 'in_progress', type: 'warning' as const },
  { label: '已完成', value: 'completed', type: 'success' as const }
]

const auditActionOptions = [
  { label: '通过', value: 'approve' },
  { label: '驳回', value: 'reject' },
  { label: '派单', value: 'assign' },
  { label: '完成', value: 'complete' }
]

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
  { title: '宿舍房间', key: 'dorm_room', width: 100 },
  {
    title: '通知回执', key: 'notification_receipt', width: 100,
    render(row: any) {
      if (row.notification_receipts && row.notification_receipts.length > 0) {
        return h(NTag, { type: 'success', size: 'small' }, { default: () => '已通知' })
      }
      return h(NTag, { type: 'default', size: 'small' }, { default: () => '未通知' })
    }
  },
  { title: '创建时间', key: 'created_at', width: 160 },
  {
    title: '操作', key: 'actions', width: 180,
    render(row: any) {
      return h(NSpace, { size: 8 }, {
        default: () => [
          h(NButton, { size: 'small', type: 'primary', onClick: () => openAudit(row) }, { default: () => '审核' }),
          h(NButton, { size: 'small', onClick: () => navigateTo(`/repairs/${row.id}`) }, { default: () => '详情' })
        ]
      })
    }
  }
]

const pagination = reactive({
  page: 1,
  pageSize: 10
})

function filterByStatus(status: string) {
  currentStatus.value = status
  pagination.page = 1
  fetchRepairs()
}

function openAudit(row: any) {
  currentOrderId.value = row.id
  auditAction.value = 'approve'
  auditComment.value = ''
  showAuditModal.value = true
}

async function submitAudit() {
  if (!currentOrderId.value) return
  auditLoading.value = true
  try {
    await api.auditRepair(currentOrderId.value, auditAction.value, auditComment.value)
    message.success('审核操作成功')
    showAuditModal.value = false
    fetchRepairs()
  } catch (e: any) {
    message.error(e?.data?.detail || '审核失败')
  } finally {
    auditLoading.value = false
  }
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
    const res = await api.getAdminRepairs(params) as any[]
    repairs.value = Array.isArray(res) ? res : []
  } catch (e: any) {
    message.error('获取列表失败')
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
