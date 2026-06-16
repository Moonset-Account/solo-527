<script setup lang="ts">
import {
  NCard,
  NTabs,
  NTabPane,
  NDataTable,
  NTag,
  NButton,
  NSpin,
  NSpace,
  NDescriptions,
  NDescriptionsItem,
  NInput,
  NForm,
  NFormItem,
  NModal,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import {
  ARStatus,
  PaymentStatus,
  RefundStatus,
  WriteoffStatus,
  type ARRecord,
  type Payment,
  type Refund,
  type Writeoff,
} from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const arStore = useArStore()
const api = useApi()
const message = useMessage()

const id = route.params.id as string

const payments = ref<Payment[]>([])
const refunds = ref<Refund[]>([])
const writeoffs = ref<Writeoff[]>([])
const loadingDetails = ref(false)

const showReviewModal = ref(false)
const reviewRefundId = ref('')
const reviewStatus = ref<'approved' | 'rejected'>('approved')
const reviewNote = ref('')
const reviewerName = ref('')

const statusLabelMap: Record<string, string> = {
  [ARStatus.PENDING]: '待收款',
  [ARStatus.PARTIAL]: '部分收款',
  [ARStatus.PAID]: '已结清',
  [ARStatus.OVERDUE]: '逾期',
}

const statusColorMap: Record<string, string> = {
  [ARStatus.PENDING]: 'default',
  [ARStatus.PARTIAL]: 'warning',
  [ARStatus.PAID]: 'success',
  [ARStatus.OVERDUE]: 'error',
}

function formatAmount(val: number) {
  return val.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

const paymentMethodMap: Record<string, string> = {
  bank_transfer: '银行转账',
  credit_card: '信用卡',
  other: '其他',
}

const paymentStatusLabelMap: Record<string, string> = {
  [PaymentStatus.CONFIRMED]: '已确认',
  [PaymentStatus.PENDING]: '待确认',
  [PaymentStatus.FAILED]: '失败',
}

const paymentStatusColorMap: Record<string, string> = {
  [PaymentStatus.CONFIRMED]: 'success',
  [PaymentStatus.PENDING]: 'warning',
  [PaymentStatus.FAILED]: 'error',
}

const paymentColumns: DataTableColumns<Payment> = [
  { title: '日期', key: 'payment_date', width: 120 },
  { title: '金额', key: 'amount', width: 120, render: (row) => formatAmount(row.amount) },
  { title: '方式', key: 'payment_method', width: 100, render: (row) => paymentMethodMap[row.payment_method] ?? row.payment_method },
  { title: '参考号', key: 'reference_number', width: 140 },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => h(NTag, { type: paymentStatusColorMap[row.status] as any, size: 'small' }, { default: () => paymentStatusLabelMap[row.status] ?? row.status }),
  },
  { title: '操作人', key: 'operator', width: 100 },
  { title: '创建时间', key: 'created_at', width: 160 },
]

const refundStatusLabelMap: Record<string, string> = {
  [RefundStatus.PENDING]: '待审批',
  [RefundStatus.APPROVED]: '已批准',
  [RefundStatus.REJECTED]: '已驳回',
  [RefundStatus.DISPUTED]: '争议中',
}

const refundStatusColorMap: Record<string, string> = {
  [RefundStatus.PENDING]: 'warning',
  [RefundStatus.APPROVED]: 'success',
  [RefundStatus.REJECTED]: 'error',
  [RefundStatus.DISPUTED]: 'info',
}

const refundColumns: DataTableColumns<Refund> = [
  { title: '金额', key: 'amount', width: 120, render: (row) => formatAmount(row.amount) },
  { title: '原因', key: 'reason', width: 160 },
  { title: '申请人', key: 'applicant', width: 100 },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => h(NTag, { type: refundStatusColorMap[row.status] as any, size: 'small' }, { default: () => refundStatusLabelMap[row.status] ?? row.status }),
  },
  { title: '审核人', key: 'reviewer', width: 100, render: (row) => row.reviewer ?? '-' },
  { title: '审核备注', key: 'review_note', width: 140, render: (row) => row.review_note ?? '-' },
  { title: '申请时间', key: 'created_at', width: 160 },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render: (row) =>
      row.status === RefundStatus.PENDING
        ? h(NSpace, { size: 'small' }, {
            default: () => [
              h(NButton, { size: 'small', type: 'success', onClick: () => openReviewModal(row.id, 'approved') }, { default: () => '通过' }),
              h(NButton, { size: 'small', type: 'error', onClick: () => openReviewModal(row.id, 'rejected') }, { default: () => '驳回' }),
            ],
          })
        : null,
  },
]

const writeoffStatusLabelMap: Record<string, string> = {
  [WriteoffStatus.PENDING]: '待审批',
  [WriteoffStatus.APPROVED]: '已批准',
  [WriteoffStatus.REJECTED]: '已驳回',
}

const writeoffStatusColorMap: Record<string, string> = {
  [WriteoffStatus.PENDING]: 'warning',
  [WriteoffStatus.APPROVED]: 'success',
  [WriteoffStatus.REJECTED]: 'error',
}

const writeoffColumns: DataTableColumns<Writeoff> = [
  { title: '金额', key: 'amount', width: 120, render: (row) => formatAmount(row.amount) },
  { title: '原因', key: 'reason', width: 160 },
  { title: '操作人', key: 'operator', width: 100 },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => h(NTag, { type: writeoffStatusColorMap[row.status] as any, size: 'small' }, { default: () => writeoffStatusLabelMap[row.status] ?? row.status }),
  },
  { title: '审批人', key: 'approver', width: 100, render: (row) => row.approver ?? '-' },
  { title: '创建时间', key: 'created_at', width: 160 },
]

function openReviewModal(id: string, status: 'approved' | 'rejected') {
  reviewRefundId.value = id
  reviewStatus.value = status
  reviewNote.value = ''
  reviewerName.value = ''
  showReviewModal.value = true
}

async function handleRefundReview() {
  try {
    await api.refund.review(reviewRefundId.value, {
      reviewer: reviewerName.value || '当前用户',
      status: reviewStatus.value,
      review_note: reviewNote.value || undefined,
    })
    message.success(reviewStatus.value === 'approved' ? '审批通过' : '已驳回')
    showReviewModal.value = false
    refunds.value = refunds.value.map((r) =>
      r.id === reviewRefundId.value
        ? {
            ...r,
            status: reviewStatus.value as RefundStatus,
            reviewer: reviewerName.value || '当前用户',
            review_note: reviewNote.value || undefined,
          }
        : r,
    )
  } catch (e) {
    console.error('Review failed', e)
    message.error('审批失败')
  }
}

onMounted(async () => {
  await arStore.fetchDrillDown(id)
  loadingDetails.value = true
  try {
    const [payRes, refRes, woRes] = await Promise.all([
      api.payment.list({ page: 1, page_size: 100, status: null, ar_record_id: id }),
      api.refund.list({ page: 1, page_size: 100, status: null, ar_record_id: id }),
      api.writeoff.list({ page: 1, page_size: 100, status: null }),
    ])
    payments.value = payRes.items.filter((p) => p.ar_record_id === id)
    refunds.value = refRes.items.filter((r) => r.ar_record_id === id)
    writeoffs.value = woRes.items.filter((w) => w.ar_record_id === id)
  } catch (e) {
    console.error('Failed to fetch details', e)
  } finally {
    loadingDetails.value = false
  }
})
</script>

<template>
  <NSpin :show="arStore.loading || loadingDetails">
    <NSpace vertical :size="16">
      <NButton @click="router.push('/ar')" quaternary>&larr; 返回列表</NButton>

      <NCard title="应收记录基本信息">
        <NDescriptions :column="3" bordered v-if="arStore.currentRecord">
          <NDescriptionsItem label="客户名称">{{ arStore.currentRecord.customer_name }}</NDescriptionsItem>
          <NDescriptionsItem label="客户ID">{{ arStore.currentRecord.customer_id }}</NDescriptionsItem>
          <NDescriptionsItem label="订阅ID">{{ arStore.currentRecord.subscription_id || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="应收金额">{{ formatAmount(arStore.currentRecord.amount) }}</NDescriptionsItem>
          <NDescriptionsItem label="已收金额">{{ formatAmount(Number(arStore.currentRecord.paid_amount ?? 0)) }}</NDescriptionsItem>
          <NDescriptionsItem label="未收金额">{{ formatAmount(arStore.currentRecord.amount - Number(arStore.currentRecord.paid_amount ?? 0)) }}</NDescriptionsItem>
          <NDescriptionsItem label="到期日">{{ arStore.currentRecord.due_date }}</NDescriptionsItem>
          <NDescriptionsItem label="状态">
            <NTag :type="statusColorMap[arStore.currentRecord.status] as any" size="small">
              {{ statusLabelMap[arStore.currentRecord.status] ?? '-' }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="负责人">{{ arStore.currentRecord.responsible_person }}</NDescriptionsItem>
          <NDescriptionsItem label="币种">{{ arStore.currentRecord.currency }}</NDescriptionsItem>
          <NDescriptionsItem label="创建时间">{{ arStore.currentRecord.created_at }}</NDescriptionsItem>
          <NDescriptionsItem label="更新时间">{{ arStore.currentRecord.updated_at }}</NDescriptionsItem>
          <NDescriptionsItem label="描述" :span="3">{{ arStore.currentRecord.description || '-' }}</NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <NCard>
        <NTabs type="line">
          <NTabPane name="payments" tab="付款记录">
            <NDataTable :columns="paymentColumns" :data="payments" :bordered="false" />
          </NTabPane>
          <NTabPane name="refunds" tab="退款记录">
            <NDataTable :columns="refundColumns" :data="refunds" :bordered="false" />
          </NTabPane>
          <NTabPane name="writeoffs" tab="冲销记录">
            <NDataTable :columns="writeoffColumns" :data="writeoffs" :bordered="false" />
          </NTabPane>
        </NTabs>
      </NCard>
    </NSpace>
  </NSpin>

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
        <NButton :type="reviewStatus === 'approved' ? 'success' : 'error'" @click="handleRefundReview">确认</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>
