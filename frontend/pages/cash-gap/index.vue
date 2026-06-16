<script setup lang="ts">
import {
  NCard,
  NGrid,
  NGi,
  NStatistic,
  NDataTable,
  NTag,
  NButton,
  NPagination,
  NSpin,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NDatePicker,
} from 'naive-ui'
import type { DataTableColumns, FormInst } from 'naive-ui'
import { GapStatus, type CashGapForecast } from '~/types'

definePageMeta({ layout: 'default' })

const cashGapStore = useCashGapStore()
const filters = useFilters()
const api = useApi()
const message = useMessage()

const statusOptions = [
  { label: '全部', value: '' },
  { label: '安全', value: GapStatus.SAFE },
  { label: '预警', value: GapStatus.WARNING },
  { label: '严重', value: GapStatus.CRITICAL },
]

const responsibleOptions = [
  { label: '张三', value: '张三' },
  { label: '李四', value: '李四' },
  { label: '王五', value: '王五' },
]

const showDetailModal = ref(false)
const showCreateModal = ref(false)
const selectedForecast = ref<CashGapForecast | null>(null)
const createFormRef = ref<FormInst | null>(null)
const createForm = ref({
  forecast_date: null as number | null,
  period_start: null as number | null,
  period_end: null as number | null,
  expected_inflow: '',
  expected_outflow: '',
  responsible_person: '',
  notes: '',
})

function formatAmount(val: number) {
  return val.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

function gapColor(val: number) {
  if (val >= 0) return '#18a058'
  if (val >= -50000) return '#f0a020'
  return '#d03050'
}

function gapStatusType(status: string) {
  if (status === GapStatus.SAFE) return 'success'
  if (status === GapStatus.WARNING) return 'warning'
  if (status === GapStatus.CRITICAL) return 'error'
  return 'default'
}

function gapStatusLabel(status: string) {
  const map: Record<string, string> = {
    [GapStatus.SAFE]: '安全',
    [GapStatus.WARNING]: '预警',
    [GapStatus.CRITICAL]: '严重',
  }
  return map[status] ?? status
}

function computeGapStatus(inflow: number, outflow: number): string {
  const gap = inflow - outflow
  if (gap >= 0) return GapStatus.SAFE
  if (gap >= -50000) return GapStatus.WARNING
  return GapStatus.CRITICAL
}

const totalInflow = computed(() => cashGapStore.forecasts.reduce((s, f) => s + Number(f.expected_inflow), 0))
const totalOutflow = computed(() => cashGapStore.forecasts.reduce((s, f) => s + Number(f.expected_outflow), 0))
const netGap = computed(() => totalInflow.value - totalOutflow.value)

const columns: DataTableColumns<CashGapForecast> = [
  { title: '预测日期', key: 'forecast_date', width: 120 },
  {
    title: '期间',
    key: 'period',
    width: 160,
    render: (row) => `${row.period_start} ~ ${row.period_end}`,
  },
  { title: '预计流入', key: 'expected_inflow', width: 140, render: (row) => formatAmount(Number(row.expected_inflow)) },
  { title: '预计流出', key: 'expected_outflow', width: 140, render: (row) => formatAmount(Number(row.expected_outflow)) },
  {
    title: '缺口金额',
    key: 'gap_amount',
    width: 140,
    render: (row) => h('span', { style: { color: gapColor(Number(row.gap_amount)), fontWeight: 'bold' } }, formatAmount(Number(row.gap_amount))),
  },
  {
    title: '状态',
    key: 'gap_status',
    width: 100,
    render: (row) => h(NTag, { type: gapStatusType(row.gap_status) as any, size: 'small' }, { default: () => gapStatusLabel(row.gap_status) }),
  },
  { title: '负责人', key: 'responsible_person', width: 100, render: (row) => row.responsible_person ?? '-' },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render: (row) =>
      h(NButton, { size: 'small', quaternary: true, onClick: () => handleRowClick(row) }, { default: () => '详情' }),
  },
]

function handleRowClick(row: CashGapForecast) {
  selectedForecast.value = row
  showDetailModal.value = true
}

function handleFilter(filterValues: { dateRange: [number, number] | null; responsible: string | null; status: string | null }) {
  filters.dateFrom.value = filterValues.dateRange ? new Date(filterValues.dateRange[0]).toISOString().slice(0, 10) : null
  filters.dateTo.value = filterValues.dateRange ? new Date(filterValues.dateRange[1]).toISOString().slice(0, 10) : null
  filters.responsiblePerson.value = filterValues.responsible
  filters.status.value = filterValues.status || null
  filters.page.value = 1
  cashGapStore.fetchList({
    ...filters.filters.value,
    gap_status: filterValues.status || undefined,
    period_start: filters.dateFrom.value || undefined,
    period_end: filters.dateTo.value || undefined,
  })
}

function handleReset() {
  filters.resetFilters()
  cashGapStore.fetchList(filters.filters.value)
}

function handlePageChange(page: number) {
  filters.setPage(page)
  cashGapStore.fetchList(filters.filters.value)
}

function openCreateModal() {
  createForm.value = {
    forecast_date: null,
    period_start: null,
    period_end: null,
    expected_inflow: '',
    expected_outflow: '',
    responsible_person: '',
    notes: '',
  }
  showCreateModal.value = true
}

function formatDate(ts: number | null): string {
  if (!ts) return ''
  return new Date(ts).toISOString().slice(0, 10)
}

async function submitCreate() {
  const inflow = Number(createForm.value.expected_inflow) || 0
  const outflow = Number(createForm.value.expected_outflow) || 0
  const gapAmount = inflow - outflow

  try {
    await api.cashGap.create({
      forecast_date: formatDate(createForm.value.forecast_date),
      period_start: formatDate(createForm.value.period_start),
      period_end: formatDate(createForm.value.period_end),
      expected_inflow: inflow,
      expected_outflow: outflow,
      gap_amount: gapAmount,
      gap_status: computeGapStatus(inflow, outflow),
      responsible_person: createForm.value.responsible_person || null,
      notes: createForm.value.notes || null,
    })
    message.success('预测已创建')
    showCreateModal.value = false
    cashGapStore.fetchList(filters.filters.value)
  } catch {
    message.error('创建失败')
  }
}

onMounted(() => {
  cashGapStore.fetchList(filters.filters.value)
})
</script>

<template>
  <NSpin :show="cashGapStore.loading">
    <FilterBar
      :responsible-options="responsibleOptions"
      :status-options="statusOptions"
      @filter="handleFilter"
      @reset="handleReset"
    >
      <template #default>
        <NButton type="primary" @click="openCreateModal">新建预测</NButton>
      </template>
    </FilterBar>

    <NGrid :cols="3" :x-gap="16" style="margin-bottom: 16px">
      <NGi>
        <NCard>
          <NStatistic label="预计总流入" :value="formatAmount(totalInflow)" />
        </NCard>
      </NGi>
      <NGi>
        <NCard>
          <NStatistic label="预计总流出" :value="formatAmount(totalOutflow)" />
        </NCard>
      </NGi>
      <NGi>
        <NCard>
          <NStatistic label="净缺口">
            <template #default>
              <span :style="{ color: gapColor(netGap), fontWeight: 'bold' }">{{ formatAmount(netGap) }}</span>
            </template>
          </NStatistic>
        </NCard>
      </NGi>
    </NGrid>

    <NCard>
      <NDataTable :columns="columns" :data="cashGapStore.forecasts" :bordered="false" />
      <NSpace justify="end" style="margin-top: 16px">
        <NPagination
          :page="filters.page.value"
          :page-count="Math.ceil(cashGapStore.total / filters.pageSize.value)"
          @update:page="handlePageChange"
        />
      </NSpace>
    </NCard>

    <NModal v-model:show="showDetailModal" preset="card" title="预测详情" style="width: 500px">
      <NForm label-placement="left" label-width="100" v-if="selectedForecast">
        <NFormItem label="预测日期">{{ selectedForecast.forecast_date }}</NFormItem>
        <NFormItem label="期间">{{ selectedForecast.period_start }} ~ {{ selectedForecast.period_end }}</NFormItem>
        <NFormItem label="预计流入">{{ formatAmount(Number(selectedForecast.expected_inflow)) }}</NFormItem>
        <NFormItem label="预计流出">{{ formatAmount(Number(selectedForecast.expected_outflow)) }}</NFormItem>
        <NFormItem label="缺口金额">
          <span :style="{ color: gapColor(Number(selectedForecast.gap_amount)) }">{{ formatAmount(Number(selectedForecast.gap_amount)) }}</span>
        </NFormItem>
        <NFormItem label="状态">
          <NTag :type="gapStatusType(selectedForecast.gap_status) as any" size="small">{{ gapStatusLabel(selectedForecast.gap_status) }}</NTag>
        </NFormItem>
        <NFormItem label="负责人">{{ selectedForecast.responsible_person || '-' }}</NFormItem>
        <NFormItem label="备注">{{ selectedForecast.notes || '-' }}</NFormItem>
      </NForm>
    </NModal>

    <NModal v-model:show="showCreateModal" preset="card" title="新建资金缺口预测" style="width: 520px">
      <NForm ref="createFormRef" :model="createForm" label-placement="left" label-width="100">
        <NFormItem label="预测日期" path="forecast_date">
          <NDatePicker v-model:value="createForm.forecast_date" type="date" style="width: 100%" />
        </NFormItem>
        <NFormItem label="期间开始" path="period_start">
          <NDatePicker v-model:value="createForm.period_start" type="date" style="width: 100%" />
        </NFormItem>
        <NFormItem label="期间结束" path="period_end">
          <NDatePicker v-model:value="createForm.period_end" type="date" style="width: 100%" />
        </NFormItem>
        <NFormItem label="预计流入" path="expected_inflow">
          <NInput v-model:value="createForm.expected_inflow" placeholder="请输入预计流入金额" />
        </NFormItem>
        <NFormItem label="预计流出" path="expected_outflow">
          <NInput v-model:value="createForm.expected_outflow" placeholder="请输入预计流出金额" />
        </NFormItem>
        <NFormItem label="负责人">
          <NInput v-model:value="createForm.responsible_person" placeholder="请输入负责人" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="createForm.notes" type="textarea" placeholder="请输入备注" />
        </NFormItem>
        <NSpace justify="end">
          <NButton @click="showCreateModal = false">取消</NButton>
          <NButton type="primary" @click="submitCreate">提交</NButton>
        </NSpace>
      </NForm>
    </NModal>
  </NSpin>
</template>
