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
  NModal,
  NInput,
  NForm,
  NFormItem,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { ReminderType, ReminderStatus, type Reminder } from '~/types'

definePageMeta({ layout: 'default' })

const reminderStore = useReminderStore()
const filters = useFilters()
const message = useMessage()
const api = useApi()
const reminderType = ref<string | null>(null)

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待处理', value: ReminderStatus.PENDING },
  { label: '已确认', value: ReminderStatus.ACKNOWLEDGED },
  { label: '已解决', value: ReminderStatus.RESOLVED },
  { label: '已升级', value: ReminderStatus.ESCALATED },
]

const typeOptions = [
  { label: '全部', value: '' },
  { label: '付款到期', value: ReminderType.PAYMENT_DUE },
  { label: '退款待审', value: ReminderType.REFUND_PENDING },
  { label: '冲销待审', value: ReminderType.WRITEOFF_PENDING },
  { label: '升级通知', value: ReminderType.ESCALATION },
]

const responsibleOptions = [
  { label: '张三', value: '张三' },
  { label: '李四', value: '李四' },
  { label: '王五', value: '王五' },
]

const showEscalateModal = ref(false)
const escalateId = ref('')
const escalateTo = ref('')

const typeColorMap: Record<string, string> = {
  [ReminderType.PAYMENT_DUE]: 'warning',
  [ReminderType.REFUND_PENDING]: 'info',
  [ReminderType.WRITEOFF_PENDING]: 'default',
  [ReminderType.ESCALATION]: 'error',
}

const typeLabelMap: Record<string, string> = {
  [ReminderType.PAYMENT_DUE]: '付款到期',
  [ReminderType.REFUND_PENDING]: '退款待审',
  [ReminderType.WRITEOFF_PENDING]: '冲销待审',
  [ReminderType.ESCALATION]: '升级通知',
}

const statusColorMap: Record<string, string> = {
  [ReminderStatus.PENDING]: 'error',
  [ReminderStatus.ACKNOWLEDGED]: 'warning',
  [ReminderStatus.RESOLVED]: 'success',
  [ReminderStatus.ESCALATED]: 'info',
}

const statusLabelMap: Record<string, string> = {
  [ReminderStatus.PENDING]: '待处理',
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
  { title: '负责人', key: 'assigned_to', width: 100 },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => h(NTag, { type: statusColorMap[row.status] as any, size: 'small' }, { default: () => statusLabelMap[row.status] ?? row.status }),
  },
  { title: '到期时间', key: 'due_at', width: 160 },
  {
    title: '升级信息',
    key: 'escalated',
    width: 120,
    render: (row) => {
      if (row.status === ReminderStatus.ESCALATED && row.escalated_to) {
        return `升级至: ${row.escalated_to}`
      }
      return '-'
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    render: (row) => {
      const buttons: VNode[] = []
      if (row.status === ReminderStatus.PENDING) {
        buttons.push(
          h(NButton, { size: 'small', type: 'primary', onClick: () => handleAcknowledge(row.id) }, { default: () => '确认' }),
        )
      }
      if (row.status === ReminderStatus.ACKNOWLEDGED) {
        buttons.push(
          h(NButton, { size: 'small', type: 'success', onClick: () => handleResolve(row.id) }, { default: () => '完成' }),
        )
      }
      if (row.status === ReminderStatus.PENDING || row.status === ReminderStatus.ACKNOWLEDGED) {
        buttons.push(
          h(NButton, { size: 'small', type: 'warning', onClick: () => openEscalateModal(row.id) }, { default: () => '升级' }),
        )
      }
      return h(NSpace, { size: 'small' }, { default: () => buttons })
    },
  },
]

function isOverdue(row: Reminder): boolean {
  if (row.status !== ReminderStatus.PENDING && row.status !== ReminderStatus.ACKNOWLEDGED) return false
  return new Date(row.due_at) < new Date()
}

const rowProps = (row: Reminder) => {
  return {
    style: isOverdue(row) ? 'background-color: #fff8f0;' : '',
  }
}

async function handleAcknowledge(id: string) {
  try {
    await api.reminder.update(id, { status: 'acknowledged' })
    message.success('已确认')
    reminderStore.fetchList({ ...filters.filters.value, type: reminderType.value })
  } catch {
    message.error('确认失败')
  }
}

async function handleResolve(id: string) {
  try {
    await api.reminder.update(id, { status: 'resolved' })
    message.success('已完成')
    reminderStore.fetchList({ ...filters.filters.value, type: reminderType.value })
  } catch {
    message.error('完成失败')
  }
}

function openEscalateModal(id: string) {
  escalateId.value = id
  escalateTo.value = ''
  showEscalateModal.value = true
}

async function submitEscalate() {
  try {
    await api.reminder.escalate(escalateId.value, escalateTo.value || '上级主管')
    message.success('已升级')
    showEscalateModal.value = false
    reminderStore.fetchList({ ...filters.filters.value, type: reminderType.value })
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
  reminderStore.fetchList({ ...filters.filters.value, type: reminderType.value, assigned_to: filterValues.responsible })
}

function handleReset() {
  filters.resetFilters()
  reminderType.value = null
  reminderStore.fetchList(filters.filters.value)
}

function handlePageChange(page: number) {
  filters.setPage(page)
  reminderStore.fetchList({ ...filters.filters.value, type: reminderType.value })
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

    <NModal v-model:show="showEscalateModal" preset="card" title="升级提醒" style="width: 450px">
      <NForm label-placement="left" label-width="80">
        <NFormItem label="升级给">
          <NInput v-model:value="escalateTo" placeholder="请输入升级目标负责人" />
        </NFormItem>
        <NSpace justify="end">
          <NButton @click="showEscalateModal = false">取消</NButton>
          <NButton type="warning" @click="submitEscalate">确认升级</NButton>
        </NSpace>
      </NForm>
    </NModal>
  </NSpin>
</template>
