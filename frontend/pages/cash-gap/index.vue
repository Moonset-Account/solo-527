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

const statusOptions = [
  { label: '全部', value: '' },
  { label: '预测中', value: GapStatus.FORECASTED },
  { label: '实际', value: GapStatus.ACTUAL },
  { label: '已解决', value: GapStatus.RESOLVED },
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
  date: null as number | null,
  expected_inflow: 0,
  expected_outflow: 0,
  notes: '',
  status: GapStatus.FORECASTED,
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
  if (status === GapStatus.RESOLVED) return 'success'
  if (status === GapStatus.ACTUAL) return 'info'
  return 'warning'
}

function gapStatusLabel(status: string) {
  const map: Record<string, string> = {
    [GapStatus.FORECASTED]: '预测中',
    [GapStatus.ACTUAL]: '实际',
    [GapStatus.RESOLVED]: '已解决',
  }
  return map[status] ?? status
}

const totalInflow = computed(() => cashGapStore.forecasts.reduce((s, f) => s + f.expected_inflow, 0))
const totalOutflow = computed(() => cashGapStore.forecasts.reduce((s, f) => s + f.expected_outflow, 0))
const netGap = computed(() => totalInflow.value - totalOutflow.value)

const columns: DataTableColumns<CashGapForecast> = [
  { title: '日期', key: 'date', width: 120 },
  { title: '期间', key: 'id', width: 80, render: (row) => `P${cashGapStore.forecasts.indexOf(row) + 1}` },
  { title: '预计流入', key: 'expected_inflow', width: 140, render: (row) => formatAmount(row.expected_inflow) },
  { title: '预计流出', key: 'expected_outflow', width: 140, render: (row) => formatAmount(row.expected_outflow) },
  {
    title: '缺口金额',
    key: 'net_gap',
    width: 140,
    render: (row) => h('span', { style: { color: gapColor(row.net_gap), fontWeight: 'bold' } }, formatAmount(row.net_gap)),
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => h(NTag, { type: gapStatusType(row.status) as any, size: 'small' }, { default: () => gapStatusLabel(row.status) }),
  },
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
  cashGapStore.fetchList(filters.filters.value)
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
  createForm.value = { date: null, expected_inflow: 0, expected_outflow: 0, notes: '', status: GapStatus.FORECASTED }
  showCreateModal.value = true
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
        <NFormItem label="日期">{{ selectedForecast.date }}</NFormItem>
        <NFormItem label="预计流入">{{ formatAmount(selectedForecast.expected_inflow) }}</NFormItem>
        <NFormItem label="预计流出">{{ formatAmount(selectedForecast.expected_outflow) }}</NFormItem>
        <NFormItem label="缺口金额">
          <span :style="{ color: gapColor(selectedForecast.net_gap) }">{{ formatAmount(selectedForecast.net_gap) }}</span>
        </NFormItem>
        <NFormItem label="累计缺口">{{ formatAmount(selectedForecast.cumulative_gap) }}</NFormItem>
        <NFormItem label="状态">
          <NTag :type="gapStatusType(selectedForecast.status) as any" size="small">{{ gapStatusLabel(selectedForecast.status) }}</NTag>
        </NFormItem>
        <NFormItem label="备注">{{ selectedForecast.notes || '-' }}</NFormItem>
      </NForm>
    </NModal>

    <NModal v-model:show="showCreateModal" preset="card" title="新建资金缺口预测" style="width: 500px">
      <NForm ref="createFormRef" :model="createForm" label-placement="left" label-width="100">
        <NFormItem label="日期" path="date">
          <NDatePicker v-model:value="createForm.date" type="date" style="width: 100%" />
        </NFormItem>
        <NFormItem label="预计流入" path="expected_inflow">
          <NInput v-model:value="createForm.expected_inflow" type="number" placeholder="请输入预计流入金额" />
        </NFormItem>
        <NFormItem label="预计流出" path="expected_outflow">
          <NInput v-model:value="createForm.expected_outflow" type="number" placeholder="请输入预计流出金额" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="createForm.notes" type="textarea" placeholder="请输入备注" />
        </NFormItem>
        <NSpace justify="end">
          <NButton @click="showCreateModal = false">取消</NButton>
          <NButton type="primary" @click="showCreateModal = false">提交</NButton>
        </NSpace>
      </NForm>
    </NModal>
  </NSpin>
</template>
