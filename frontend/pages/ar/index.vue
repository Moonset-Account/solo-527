<script setup lang="ts">
import {
  NCard,
  NGrid,
  NGi,
  NStatistic,
  NDataTable,
  NTag,
  NPagination,
  NSpin,
  NSpace,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { ARStatus, type ARRecord } from '~/types'

definePageMeta({ layout: 'default' })

const arStore = useArStore()
const filters = useFilters()
const router = useRouter()

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待收款', value: ARStatus.PENDING },
  { label: '部分收款', value: ARStatus.PARTIAL },
  { label: '已结清', value: ARStatus.PAID },
  { label: '逾期', value: ARStatus.OVERDUE },
]

const responsibleOptions = [
  { label: '张三', value: '张三' },
  { label: '李四', value: '李四' },
  { label: '王五', value: '王五' },
]

function formatAmount(val: number) {
  return val.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

const statusColorMap: Record<string, string> = {
  [ARStatus.PENDING]: 'default',
  [ARStatus.PARTIAL]: 'warning',
  [ARStatus.PAID]: 'success',
  [ARStatus.OVERDUE]: 'error',
}

const statusLabelMap: Record<string, string> = {
  [ARStatus.PENDING]: '待收款',
  [ARStatus.PARTIAL]: '部分收款',
  [ARStatus.PAID]: '已结清',
  [ARStatus.OVERDUE]: '逾期',
}

const columns: DataTableColumns<ARRecord> = [
  { title: '客户名称', key: 'customer_name', width: 160 },
  { title: '应收金额', key: 'amount', width: 140, render: (row) => formatAmount(row.amount) },
  { title: '已收金额', key: 'paid_amount', width: 140, render: (row) => formatAmount(row.paid_amount ?? 0) },
  {
    title: '未收金额',
    key: 'outstanding',
    width: 140,
    render: (row) => formatAmount(row.amount - (row.paid_amount ?? 0)),
  },
  { title: '到期日', key: 'due_date', width: 120 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) =>
      h(NTag, { type: statusColorMap[row.status] as any, size: 'small' }, { default: () => statusLabelMap[row.status] ?? row.status }),
  },
  { title: '负责人', key: 'responsible_person', width: 100 },
]

function handleFilter(filterValues: { dateRange: [number, number] | null; responsible: string | null; status: string | null }) {
  filters.dateFrom.value = filterValues.dateRange ? new Date(filterValues.dateRange[0]).toISOString().slice(0, 10) : null
  filters.dateTo.value = filterValues.dateRange ? new Date(filterValues.dateRange[1]).toISOString().slice(0, 10) : null
  filters.responsiblePerson.value = filterValues.responsible
  filters.status.value = filterValues.status || null
  filters.page.value = 1
  arStore.fetchList(filters.filters.value)
}

function handleReset() {
  filters.resetFilters()
  arStore.fetchList(filters.filters.value)
}

function handlePageChange(page: number) {
  filters.setPage(page)
  arStore.fetchList(filters.filters.value)
}

function handleRowClick(row: ARRecord) {
  router.push(`/ar/${row.id}`)
}

function buildExportFilters() {
  const f: Record<string, any> = {}
  if (filters.status.value) f.status = filters.status.value
  if (filters.responsiblePerson.value) f.responsible_person = filters.responsiblePerson.value
  if (filters.dateFrom.value) f.date_from = filters.dateFrom.value
  if (filters.dateTo.value) f.date_to = filters.dateTo.value
  return f
}

onMounted(async () => {
  await Promise.all([
    arStore.fetchSummary(),
    arStore.fetchList(filters.filters.value),
  ])
})
</script>

<template>
  <NSpin :show="arStore.loading">
    <FilterBar
      :responsible-options="responsibleOptions"
      :status-options="statusOptions"
      @filter="handleFilter"
      @reset="handleReset"
    >
      <template #default>
        <ExportButton module="ar_collection" :filters="buildExportFilters()" />
      </template>
    </FilterBar>

    <NGrid :cols="3" :x-gap="16" style="margin-bottom: 16px">
      <NGi>
        <NCard>
          <NStatistic label="总应收" :value="formatAmount(arStore.summaryAggregate.total_amount)" />
        </NCard>
      </NGi>
      <NGi>
        <NCard>
          <NStatistic label="已收金额" :value="formatAmount(arStore.summaryAggregate.paid_amount)" />
        </NCard>
      </NGi>
      <NGi>
        <NCard>
          <NStatistic label="未收金额" :value="formatAmount(arStore.summaryAggregate.outstanding_amount)" />
        </NCard>
      </NGi>
    </NGrid>

    <NCard>
      <NDataTable
        :columns="columns"
        :data="arStore.records"
        :row-props="(row: ARRecord) => ({ style: 'cursor: pointer', onClick: () => handleRowClick(row) })"
        :bordered="false"
      />
      <NSpace justify="end" style="margin-top: 16px">
        <NPagination
          :page="filters.page.value"
          :page-count="Math.ceil(arStore.total / filters.pageSize.value)"
          @update:page="handlePageChange"
        />
      </NSpace>
    </NCard>
  </NSpin>
</template>
