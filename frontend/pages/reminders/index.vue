<script setup lang="ts">
import {
  NCard,
  NDataTable,
  NTag,
  NButton,
  NPagination,
  NSpin,
  NSpace,
  NSelect,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { ReminderType, ReminderStatus, type Reminder } from '~/types'

definePageMeta({ layout: 'default' })

const reminderStore = useReminderStore()
const filters = useFilters()
const message = useMessage()
const reminderType = ref<string | null>(null)

const statusOptions = [
  { label: '全部', value: '' },
  { label: '活跃', value: ReminderStatus.ACTIVE },
  { label: '已确认', value: ReminderStatus.ACKNOWLEDGED },
  { label: '已解决', value: ReminderStatus.RESOLVED },
  { label: '已升级', value: ReminderStatus.ESCALATED },
]

const typeOptions = [
  { label: '全部', value: '' },
  { label: '逾期提醒', value: ReminderType.OVERDUE },
  { label: '付款到期', value: ReminderType.PAYMENT_DUE },
  { label: '资金缺口', value: ReminderType.CASH_GAP },
  { label: '需审核', value: ReminderType.REVIEW_NEEDED },
]

const responsibleOptions = [
  { label: '张三', value: '张三' },
  { label: '李四', value: '李四' },
  { label: '王五', value: '王五' },
]

const typeColorMap: Record<string, string> = {
  [ReminderType.OVERDUE]: 'error',
  [ReminderType.PAYMENT_DUE]: 'warning',
  [ReminderType.CASH_GAP]: 'info',
  [ReminderType.REVIEW_NEEDED]: 'default',
}

const typeLabelMap: Record<string, string> = {
  [ReminderType.OVERDUE]: '逾期提醒',
  [ReminderType.PAYMENT_DUE]: '付款到期',
  [ReminderType.CASH_GAP]: '资金缺口',
  [ReminderType.REVIEW_NEEDED]: '需审核',
}

const statusColorMap: Record<string, string> = {
  [ReminderStatus.ACTIVE]: 'error',
  [ReminderStatus.ACKNOWLEDGED]: 'warning',
  [ReminderStatus.RESOLVED]: 'success',
  [ReminderStatus.ESCALATED]: 'info',
}

const statusLabelMap: Record<string, string> = {
  [ReminderStatus.ACTIVE]: '活跃',
  [ReminderStatus.ACKNOWLEDGED]: '已确认',
  [ReminderStatus.RESOLVED]: '已解决',
  [ReminderStatus.ESCALATED]: '已升级',
}

const columns: DataTableColumns<Reminder> = [
  { title: '标题', key: 'title', width: 200 },
  {
    title: '类型',
    key: 'type',
    width: 100,
    render: (row) => h(NTag, { type: typeColorMap[row.type] as any, size: 'small' }, { default: () => typeLabelMap[row.type] ?? row.type }),
  },
  { title: '负责人', key: 'acknowledged_by', width: 100, render: (row) => row.acknowledged_by ?? '-' },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => h(NTag, { type: statusColorMap[row.status] as any, size: 'small' }, { default: () => statusLabelMap[row.status] ?? row.status }),
  },
  { title: '到期时间', key: 'created_at', width: 160 },
  { title: '升级信息', key: 'escalated', width: 100, render: (row) => row.status === ReminderStatus.ESCALATED ? '已升级' : '-' },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => {
      const buttons: VNode[] = []
      if (row.status === ReminderStatus.ACTIVE) {
        buttons.push(
          h(NButton, { size: 'small', type: 'primary', onClick: () => handleAcknowledge(row.id) }, { default: () => '确认' }),
        )
      }
      if (row.status === ReminderStatus.ACKNOWLEDGED) {
        buttons.push(
          h(NButton, { size: 'small', type: 'success', onClick: () => handleResolve(row.id) }, { default: () => '完成' }),
        )
      }
      if (row.status === ReminderStatus.ACTIVE || row.status === ReminderStatus.ACKNOWLEDGED) {
        buttons.push(
          h(NButton, { size: 'small', type: 'warning', onClick: () => handleEscalate(row.id) }, { default: () => '升级' }),
        )
      }
      return h(NSpace, { size: 'small' }, { default: () => buttons })
    },
  },
]

function isOverdue(row: Reminder): boolean {
  return row.status === ReminderStatus.ACTIVE
}

const rowProps = (row: Reminder) => {
  return {
    style: isOverdue(row) ? 'background-color: #fff8f0;' : '',
  }
}

async function handleAcknowledge(id: string) {
  try {
    await reminderStore.acknowledge(id, 'current_user')
    message.success('已确认')
    reminderStore.fetchList(filters.filters.value)
  } catch {
    message.error('确认失败')
  }
}

async function handleResolve(id: string) {
  try {
    await reminderStore.resolve(id, 'current_user')
    message.success('已完成')
    reminderStore.fetchList(filters.filters.value)
  } catch {
    message.error('完成失败')
  }
}

async function handleEscalate(id: string) {
  try {
    await reminderStore.escalate(id)
    message.success('已升级')
    reminderStore.fetchList(filters.filters.value)
  } catch {
    message.error('升级失败')
  }
}

function handleFilter(filterValues: { dateRange: [number, number] | null; responsible: string | null; status: string | null }) {
  filters.dateFrom.value = filterValues.dateRange ? new Date(filterValues.dateRange[0]).toISOString().slice(0, 10) : null
  filters.dateTo.value = filterValues.dateRange ? new Date(filterValues.dateRange[1]).toISOString().slice(0, 10) : null
  filters.responsiblePerson.value = filterValues.responsible
  filters.status.value = filterValues.status || null
  filters.page.value = 1
  reminderStore.fetchList({ ...filters.filters.value, type: reminderType.value })
}

function handleReset() {
  filters.resetFilters()
  reminderType.value = null
  reminderStore.fetchList(filters.filters.value)
}

function handlePageChange(page: number) {
  filters.setPage(page)
  reminderStore.fetchList(filters.filters.value)
}

onMounted(() => {
  reminderStore.fetchList(filters.filters.value)
})
</script>

<template>
  <NSpin :show="reminderStore.loading">
    <FilterBar
      :responsible-options="responsibleOptions"
      :status-options="statusOptions"
      @filter="handleFilter"
      @reset="handleReset"
    >
      <template #default>
        <NSelect
          v-model:value="reminderType"
          :options="typeOptions"
          clearable
          placeholder="提醒类型"
          style="width: 140px"
        />
      </template>
    </FilterBar>

    <NCard>
      <NDataTable
        :columns="columns"
        :data="reminderStore.records"
        :bordered="false"
        :row-props="rowProps"
      />
      <NSpace justify="end" style="margin-top: 16px">
        <NPagination
          :page="filters.page.value"
          :page-count="Math.ceil(reminderStore.total / filters.pageSize.value)"
          @update:page="handlePageChange"
        />
      </NSpace>
    </NCard>
  </NSpin>
</template>
