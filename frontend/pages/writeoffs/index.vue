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

const showApproveModal = ref(false)
const approveWriteoffId = ref('')
const approverName = ref('')
const approveAction = ref<'approved' | 'rejected'>('approved')

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
      }, row.ar_record_id.slice(0, 8)),
  },
  { title: '金额', key: 'amount', width: 120, render: (row) => formatAmount(row.amount) },
  { title: '原因', key: 'reason', width: 180 },
  { title: '操作人', key: 'operator', width: 100 },
  { title: '审批人', key: 'approver', width: 100, render: (row) => row.approver ?? '-' },
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
    width: 140,
    render: (row) => {
      if (row.status === WriteoffStatus.PENDING) {
        return h(NSpace, { size: 'small' }, {
          default: () => [
            h(NButton, { size: 'small', type: 'success', onClick: () => openApproveModal(row.id, 'approved') }, { default: () => '批准' }),
            h(NButton, { size: 'small', type: 'error', onClick: () => openApproveModal(row.id, 'rejected') }, { default: () => '驳回' }),
          ],
        })
      }
      return null
    },
  },
]

function openApproveModal(id: string, action: 'approved' | 'rejected') {
  approveWriteoffId.value = id
  approveAction.value = action
  approverName.value = ''
  showApproveModal.value = true
}

async function submitApprove() {
  try {
    if (approveAction.value === 'approved') {
      await api.writeoff.approve(approveWriteoffId.value, approverName.value || '当前用户')
      message.success('审批通过')
    } else {
      await api.writeoff.update(approveWriteoffId.value, {
        status: 'rejected',
        approver: approverName.value || '当前用户',
      })
      message.success('已驳回')
    }
    showApproveModal.value = false
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
  writeoffStore.fetchList({ ...filters.filters.value, operator: filterValues.responsible })
}

function handleReset() {
  filters.resetFilters()
  writeoffStore.fetchList(filters.filters.value)
}

function handlePageChange(page: number) {
  filters.setPage(page)
  writeoffStore.fetchList(filters.filters.value)
}

function buildExportFilters() {
  const f: Record<string, any> = {}
  if (filters.status.value) f.status = filters.status.value
  if (filters.responsiblePerson.value) f.operator = filters.responsiblePerson.value
  if (filters.dateFrom.value) f.date_from = filters.dateFrom.value
  if (filters.dateTo.value) f.date_to = filters.dateTo.value
  return f
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
        <ExportButton module="processing_record" :filters="buildExportFilters()" />
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

    <NModal v-model:show="showApproveModal" preset="card" :title="approveAction === 'approved' ? '审批通过' : '驳回冲销'" style="width: 450px">
      <NForm label-placement="left" label-width="80">
        <NFormItem label="审批人">
          <NInput v-model:value="approverName" placeholder="请输入审批人姓名" />
        </NFormItem>
        <NSpace justify="end">
          <NButton @click="showApproveModal = false">取消</NButton>
          <NButton :type="approveAction === 'approved' ? 'success' : 'error'" @click="submitApprove">确认</NButton>
        </NSpace>
      </NForm>
    </NModal>
  </NSpin>
</template>
