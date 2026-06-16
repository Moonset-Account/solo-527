<script setup lang="ts">
import {
  NCard,
  NDataTable,
  NTag,
  NButton,
  NPagination,
  NSpin,
  NSpace,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { WriteoffStatus, type Writeoff } from '~/types'

definePageMeta({ layout: 'default' })

const writeoffStore = useWriteoffStore()
const filters = useFilters()
const message = useMessage()
const api = useApi()

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待审批', value: WriteoffStatus.PENDING },
  { label: '已批准', value: WriteoffStatus.APPROVED },
  { label: '已驳回', value: WriteoffStatus.REJECTED },
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
  [WriteoffStatus.PENDING]: 'warning',
  [WriteoffStatus.APPROVED]: 'success',
  [WriteoffStatus.REJECTED]: 'error',
}

const statusLabelMap: Record<string, string> = {
  [WriteoffStatus.PENDING]: '待审批',
  [WriteoffStatus.APPROVED]: '已批准',
  [WriteoffStatus.REJECTED]: '已驳回',
}

const columns: DataTableColumns<Writeoff> = [
  {
    title: '应收单号',
    key: 'ar_record_id',
    width: 140,
    render: (row) =>
      h('a', {
        style: 'color: #2080f0; cursor: pointer',
        onClick: () => navigateTo(`/ar/${row.ar_record_id}`),
      }, row.ar_record_id),
  },
  { title: '金额', key: 'amount', width: 120, render: (row) => formatAmount(row.amount) },
  { title: '原因', key: 'reason', width: 180 },
  { title: '操作人', key: 'customer_name', width: 100 },
  { title: '审批人', key: 'approved_by', width: 100 },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => h(NTag, { type: statusColorMap[row.status] as any, size: 'small' }, { default: () => statusLabelMap[row.status] ?? row.status }),
  },
  { title: '创建时间', key: 'created_at', width: 160 },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render: (row) => {
      if (row.status === WriteoffStatus.PENDING) {
        return h(NSpace, { size: 'small' }, {
          default: () => [
            h(NButton, { size: 'small', type: 'success', onClick: () => handleApprove(row.id) }, { default: () => '审批' }),
          ],
        })
      }
      return null
    },
  },
]

async function handleApprove(id: string) {
  try {
    await api.client.put(`/writeoffs/${id}/approve`, { approved_by: 'current_user' })
    message.success('审批成功')
    writeoffStore.fetchList(filters.filters.value)
  } catch {
    message.error('审批失败')
  }
}

function handleFilter(filterValues: { dateRange: [number, number] | null; responsible: string | null; status: string | null }) {
  filters.dateFrom.value = filterValues.dateRange ? new Date(filterValues.dateRange[0]).toISOString().slice(0, 10) : null
  filters.dateTo.value = filterValues.dateRange ? new Date(filterValues.dateRange[1]).toISOString().slice(0, 10) : null
  filters.responsiblePerson.value = filterValues.responsible
  filters.status.value = filterValues.status || null
  filters.page.value = 1
  writeoffStore.fetchList(filters.filters.value)
}

function handleReset() {
  filters.resetFilters()
  writeoffStore.fetchList(filters.filters.value)
}

function handlePageChange(page: number) {
  filters.setPage(page)
  writeoffStore.fetchList(filters.filters.value)
}

onMounted(() => {
  writeoffStore.fetchList(filters.filters.value)
})
</script>

<template>
  <NSpin :show="writeoffStore.loading">
    <FilterBar
      :responsible-options="responsibleOptions"
      :status-options="statusOptions"
      @filter="handleFilter"
      @reset="handleReset"
    >
      <template #default>
        <ExportButton module="writeoffs" :filters="filters.filters.value" />
      </template>
    </FilterBar>

    <NCard>
      <NDataTable :columns="columns" :data="writeoffStore.records" :bordered="false" />
      <NSpace justify="end" style="margin-top: 16px">
        <NPagination
          :page="filters.page.value"
          :page-count="Math.ceil(writeoffStore.total / filters.pageSize.value)"
          @update:page="handlePageChange"
        />
      </NSpace>
    </NCard>
  </NSpin>
</template>
