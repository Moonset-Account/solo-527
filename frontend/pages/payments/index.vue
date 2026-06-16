<script setup lang="ts">
import {
  NCard,
  NDataTable,
  NTag,
  NPagination,
  NSpin,
  NSpace,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { PaymentStatus, type Payment } from '~/types'

definePageMeta({ layout: 'default' })

const paymentStore = usePaymentStore()
const filters = useFilters()
const router = useRouter()

const statusOptions = [
  { label: '全部', value: '' },
  { label: '已确认', value: PaymentStatus.COMPLETED },
  { label: '待确认', value: PaymentStatus.PENDING },
  { label: '失败', value: PaymentStatus.FAILED },
]

const responsibleOptions = [
  { label: '张三', value: '张三' },
  { label: '李四', value: '李四' },
  { label: '王五', value: '王五' },
]

const paymentMethodMap: Record<string, string> = {
  bank_transfer: '银行转账',
  cash: '现金',
  check: '支票',
  electronic: '电子支付',
  other: '其他',
}

function formatAmount(val: number) {
  return val.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

const columns: DataTableColumns<Payment> = [
  {
    title: '应收单号',
    key: 'ar_record_id',
    width: 140,
    render: (row) =>
      h('a', {
        style: 'color: #2080f0; cursor: pointer',
        onClick: () => router.push(`/ar/${row.ar_record_id}`),
      }, row.ar_record_id),
  },
  { title: '金额', key: 'amount', width: 120, render: (row) => formatAmount(row.amount) },
  { title: '付款日期', key: 'payment_date', width: 120 },
  { title: '付款方式', key: 'payment_method', width: 100, render: (row) => paymentMethodMap[row.payment_method] ?? row.payment_method },
  { title: '参考号', key: 'reference_number', width: 140 },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => {
      const typeMap: Record<string, string> = {
        [PaymentStatus.COMPLETED]: 'success',
        [PaymentStatus.PENDING]: 'warning',
        [PaymentStatus.FAILED]: 'error',
        [PaymentStatus.CANCELLED]: 'default',
      }
      const labelMap: Record<string, string> = {
        [PaymentStatus.COMPLETED]: '已确认',
        [PaymentStatus.PENDING]: '待确认',
        [PaymentStatus.FAILED]: '失败',
        [PaymentStatus.CANCELLED]: '已取消',
      }
      return h(NTag, { type: typeMap[row.status] as any, size: 'small' }, { default: () => labelMap[row.status] ?? row.status })
    },
  },
]

function handleFilter(filterValues: { dateRange: [number, number] | null; responsible: string | null; status: string | null }) {
  filters.dateFrom.value = filterValues.dateRange ? new Date(filterValues.dateRange[0]).toISOString().slice(0, 10) : null
  filters.dateTo.value = filterValues.dateRange ? new Date(filterValues.dateRange[1]).toISOString().slice(0, 10) : null
  filters.responsiblePerson.value = filterValues.responsible
  filters.status.value = filterValues.status || null
  filters.page.value = 1
  paymentStore.fetchList(filters.filters.value)
}

function handleReset() {
  filters.resetFilters()
  paymentStore.fetchList(filters.filters.value)
}

function handlePageChange(page: number) {
  filters.setPage(page)
  paymentStore.fetchList(filters.filters.value)
}

onMounted(() => {
  paymentStore.fetchList(filters.filters.value)
})
</script>

<template>
  <NSpin :show="paymentStore.loading">
    <FilterBar
      :responsible-options="responsibleOptions"
      :status-options="statusOptions"
      @filter="handleFilter"
      @reset="handleReset"
    >
      <template #default>
        <ExportButton module="payments" :filters="filters.filters.value" />
      </template>
    </FilterBar>

    <NCard>
      <NDataTable :columns="columns" :data="paymentStore.records" :bordered="false" />
      <NSpace justify="end" style="margin-top: 16px">
        <NPagination
          :page="filters.page.value"
          :page-count="Math.ceil(paymentStore.total / filters.pageSize.value)"
          @update:page="handlePageChange"
        />
      </NSpace>
    </NCard>
  </NSpin>
</template>
