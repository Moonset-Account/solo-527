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

const id = route.params.id as string

const payments = ref<Payment[]>([])
const refunds = ref<Refund[]>([])
const writeoffs = ref<Writeoff[]>([])
const loadingDetails = ref(false)

const statusLabelMap: Record<string, string> = {
  [ARStatus.PENDING]: '待收款',
  [ARStatus.PARTIAL]: '部分收款',
  [ARStatus.PAID]: '已结清',
  [ARStatus.OVERDUE]: '逾期',
  [ARStatus.WRITEOFF]: '已冲销',
}

const statusColorMap: Record<string, string> = {
  [ARStatus.PENDING]: 'default',
  [ARStatus.PARTIAL]: 'warning',
  [ARStatus.PAID]: 'success',
  [ARStatus.OVERDUE]: 'error',
  [ARStatus.WRITEOFF]: 'info',
}

function formatAmount(val: number) {
  return val.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

const paymentMethodMap: Record<string, string> = {
  bank_transfer: '银行转账',
  cash: '现金',
  check: '支票',
  electronic: '电子支付',
  other: '其他',
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
    render: (row) => h(NTag, { type: row.status === PaymentStatus.COMPLETED ? 'success' : row.status === PaymentStatus.FAILED ? 'error' : 'warning', size: 'small' }, { default: () => row.status }),
  },
]

const refundColumns: DataTableColumns<Refund> = [
  { title: '金额', key: 'amount', width: 120, render: (row) => formatAmount(row.amount) },
  { title: '原因', key: 'reason', width: 160 },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => h(NTag, { type: row.status === RefundStatus.APPROVED ? 'success' : row.status === RefundStatus.REJECTED ? 'error' : 'warning', size: 'small' }, { default: () => row.status }),
  },
  { title: '审核人', key: 'reviewed_by', width: 100 },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render: (row) =>
      row.status === RefundStatus.PENDING
        ? h(NSpace, { size: 'small' }, {
            default: () => [
              h(NButton, { size: 'small', type: 'success', onClick: () => handleRefundReview(row.id, 'approved') }, { default: () => '通过' }),
              h(NButton, { size: 'small', type: 'error', onClick: () => handleRefundReview(row.id, 'rejected') }, { default: () => '驳回' }),
            ],
          })
        : null,
  },
]

const writeoffColumns: DataTableColumns<Writeoff> = [
  { title: '金额', key: 'amount', width: 120, render: (row) => formatAmount(row.amount) },
  { title: '原因', key: 'reason', width: 160 },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => h(NTag, { type: row.status === WriteoffStatus.APPROVED ? 'success' : row.status === WriteoffStatus.REJECTED ? 'error' : 'warning', size: 'small' }, { default: () => row.status }),
  },
  { title: '审批人', key: 'approved_by', width: 100 },
]

async function handleRefundReview(refundId: string, status: string) {
  try {
    await api.refund.review(refundId, { status, reviewed_by: 'current_user' })
    refunds.value = refunds.value.map((r) =>
      r.id === refundId ? { ...r, status: status as RefundStatus } : r,
    )
  } catch (e) {
    console.error('Review failed', e)
  }
}

onMounted(async () => {
  arStore.fetchDrillDown(id)
  loadingDetails.value = true
  try {
    const [payRes, refRes, woRes] = await Promise.all([
      api.payment.list({ page: 1, page_size: 100, responsible_person: null, date_from: null, date_to: null, status: null }),
      api.refund.list({ page: 1, page_size: 100, responsible_person: null, date_from: null, date_to: null, status: null }),
      api.writeoff.list({ page: 1, page_size: 100, responsible_person: null, date_from: null, date_to: null, status: null }),
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
        <NDescriptions :column="3" bordered>
          <NDescriptionsItem label="客户名称">{{ arStore.currentRecord?.customer_name }}</NDescriptionsItem>
          <NDescriptionsItem label="发票号">{{ arStore.currentRecord?.invoice_number }}</NDescriptionsItem>
          <NDescriptionsItem label="合同号">{{ arStore.currentRecord?.contract_number }}</NDescriptionsItem>
          <NDescriptionsItem label="应收金额">{{ formatAmount(arStore.currentRecord?.amount ?? 0) }}</NDescriptionsItem>
          <NDescriptionsItem label="已收金额">{{ formatAmount(arStore.currentRecord?.paid_amount ?? 0) }}</NDescriptionsItem>
          <NDescriptionsItem label="未收金额">{{ formatAmount(arStore.currentRecord?.remaining_amount ?? 0) }}</NDescriptionsItem>
          <NDescriptionsItem label="开票日期">{{ arStore.currentRecord?.invoice_date }}</NDescriptionsItem>
          <NDescriptionsItem label="到期日">{{ arStore.currentRecord?.due_date }}</NDescriptionsItem>
          <NDescriptionsItem label="状态">
            <NTag :type="statusColorMap[arStore.currentRecord?.status ?? ''] as any" size="small">
              {{ statusLabelMap[arStore.currentRecord?.status ?? ''] ?? '-' }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="负责人">{{ arStore.currentRecord?.responsible_person }}</NDescriptionsItem>
          <NDescriptionsItem label="备注" :span="2">{{ arStore.currentRecord?.notes || '-' }}</NDescriptionsItem>
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
</template>
