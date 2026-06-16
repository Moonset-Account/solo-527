<script setup lang="ts">
import {
  NCard,
  NDataTable,
  NTag,
  NButton,
  NPagination,
  NSpin,
  NSpace,
  NModal,
  NInput,
  NForm,
  NFormItem,
  NSelect,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { RefundStatus, type Refund } from '~/types'

definePageMeta({ layout: 'default' })

const refundStore = useRefundStore()
const filters = useFilters()
const message = useMessage()
const api = useApi()

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待审批', value: RefundStatus.PENDING },
  { label: '已批准', value: RefundStatus.APPROVED },
  { label: '已驳回', value: RefundStatus.REJECTED },
  { label: '争议中', value: RefundStatus.DISPUTED },
]

const responsibleOptions = [
  { label: '张三', value: '张三' },
  { label: '李四', value: '李四' },
  { label: '王五', value: '王五' },
]

const showReviewModal = ref(false)
const reviewRefundId = ref('')
const reviewStatus = ref<'approved' | 'rejected' | 'disputed'>('approved')
const reviewNote = ref('')
const reviewerName = ref('')

const showDisputeModal = ref(false)
const disputeRefundId = ref('')
const disputeNote = ref('')

function formatAmount(val: number) {
  return val.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

const statusColorMap: Record<string, string> = {
  [RefundStatus.PENDING]: 'warning',
  [RefundStatus.APPROVED]: 'success',
  [RefundStatus.REJECTED]: 'error',
  [RefundStatus.DISPUTED]: 'info',
}

const statusLabelMap: Record<string, string> = {
  [RefundStatus.PENDING]: '待审批',
  [RefundStatus.APPROVED]: '已批准',
  [RefundStatus.REJECTED]: '已驳回',
  [RefundStatus.DISPUTED]: '争议中',
}

const columns: DataTableColumns<Refund> = [
  {
    title: '应收单号',
    key: 'ar_record_id',
    width: 140,
    render: (row) =>
      h('a', {
        style: 'color: #2080f0; cursor: pointer',
        onClick: () => navigateTo(`/ar/${row.ar_record_id}`),
      }, row.ar_record_id.slice(0, 8)),
  },
  { title: '金额', key: 'amount', width: 120, render: (row) => formatAmount(row.amount) },
  { title: '原因', key: 'reason', width: 160 },
  { title: '申请人', key: 'applicant', width: 100 },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => h(NTag, { type: statusColorMap[row.status] as any, size: 'small' }, { default: () => statusLabelMap[row.status] ?? row.status }),
  },
  { title: '审核人', key: 'reviewer', width: 100, render: (row) => row.reviewer ?? '-' },
  { title: '审核备注', key: 'review_note', width: 140, render: (row) => row.review_note ?? '-' },
  { title: '申请时间', key: 'created_at', width: 160 },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render: (row) => {
      const buttons: VNode[] = []
      if (row.status === RefundStatus.PENDING) {
        buttons.push(
          h(NButton, { size: 'small', type: 'success', onClick: () => openReviewModal(row.id, 'approved') }, { default: () => '通过' }),
          h(NButton, { size: 'small', type: 'error', onClick: () => openReviewModal(row.id, 'rejected') }, { default: () => '驳回' }),
        )
      }
      if (row.status === RefundStatus.APPROVED) {
        buttons.push(
          h(NButton, { size: 'small', type: 'warning', onClick: () => openDisputeModal(row.id) }, { default: () => '争议' }),
        )
      }
      return h(NSpace, { size: 'small' }, { default: () => buttons })
    },
  },
]

function openReviewModal(id: string, status: 'approved' | 'rejected') {
  reviewRefundId.value = id
  reviewStatus.value = status
  reviewNote.value = ''
  reviewerName.value = ''
  showReviewModal.value = true
}

function openDisputeModal(id: string) {
  disputeRefundId.value = id
  disputeNote.value = ''
  showDisputeModal.value = true
}

async function submitReview() {
  try {
    await api.refund.review(reviewRefundId.value, {
      reviewer: reviewerName.value || '当前用户',
      status: reviewStatus.value,
      review_note: reviewNote.value || undefined,
    })
    message.success(reviewStatus.value === 'approved' ? '审批通过' : '已驳回')
    showReviewModal.value = false
    refundStore.fetchList(filters.filters.value)
  } catch {
    message.error('审批失败')
  }
}

async function submitDispute() {
  try {
    await api.refund.review(disputeRefundId.value, {
      reviewer: '当前用户',
      status: 'disputed',
      review_note: disputeNote.value || undefined,
    })
    message.success('争议已提交')
    showDisputeModal.value = false
    refundStore.fetchList(filters.filters.value)
  } catch {
    message.error('提交争议失败')
  }
}

function handleFilter(filterValues: { dateRange: [number, number] | null; responsible: string | null; status: string | null }) {
  filters.dateFrom.value = filterValues.dateRange ? new Date(filterValues.dateRange[0]).toISOString().slice(0, 10) : null
  filters.dateTo.value = filterValues.dateRange ? new Date(filterValues.dateRange[1]).toISOString().slice(0, 10) : null
  filters.responsiblePerson.value = filterValues.responsible
  filters.status.value = filterValues.status || null
  filters.page.value = 1
  refundStore.fetchList({ ...filters.filters.value, applicant: filterValues.responsible })
}

function handleReset() {
  filters.resetFilters()
  refundStore.fetchList(filters.filters.value)
}

function handlePageChange(page: number) {
  filters.setPage(page)
  refundStore.fetchList(filters.filters.value)
}

function buildExportFilters() {
  const f: Record<string, any> = {}
  if (filters.status.value) f.status = filters.status.value
  if (filters.responsiblePerson.value) f.applicant = filters.responsiblePerson.value
  if (filters.dateFrom.value) f.date_from = filters.dateFrom.value
  if (filters.dateTo.value) f.date_to = filters.dateTo.value
  return f
}

onMounted(() => {
  refundStore.fetchList(filters.filters.value)
})
</script>

<template>
  <NSpin :show="refundStore.loading">
    <FilterBar
      :responsible-options="responsibleOptions"
      :status-options="statusOptions"
      @filter="handleFilter"
      @reset="handleReset"
    >
      <template #default>
        <ExportButton module="refund_dispute" :filters="buildExportFilters()" />
      </template>
    </FilterBar>

    <NCard>
      <NDataTable :columns="columns" :data="refundStore.records" :bordered="false" />
      <NSpace justify="end" style="margin-top: 16px">
        <NPagination
          :page="filters.page.value"
          :page-count="Math.ceil(refundStore.total / filters.pageSize.value)"
          @update:page="handlePageChange"
        />
      </NSpace>
    </NCard>

    <NModal v-model:show="showReviewModal" preset="card" :title="reviewStatus === 'approved' ? '审批通过' : '驳回退款'" style="width: 450px">
      <NForm label-placement="left" label-width="80">
        <NFormItem label="审核人">
          <NInput v-model:value="reviewerName" placeholder="请输入审核人姓名" />
        </NFormItem>
        <NFormItem label="审核备注">
          <NInput v-model:value="reviewNote" type="textarea" placeholder="请输入审核备注" />
        </NFormItem>
        <NSpace justify="end">
          <NButton @click="showReviewModal = false">取消</NButton>
          <NButton :type="reviewStatus === 'approved' ? 'success' : 'error'" @click="submitReview">确认</NButton>
        </NSpace>
      </NForm>
    </NModal>

    <NModal v-model:show="showDisputeModal" preset="card" title="提交争议" style="width: 450px">
      <NForm label-placement="left" label-width="80">
        <NFormItem label="争议原因">
          <NInput v-model:value="disputeNote" type="textarea" placeholder="请输入争议原因" />
        </NFormItem>
        <NSpace justify="end">
          <NButton @click="showDisputeModal = false">取消</NButton>
          <NButton type="warning" @click="submitDispute">提交争议</NButton>
        </NSpace>
      </NForm>
    </NModal>
  </NSpin>
</template>
