<template>
  <div class="alerts-page">
    <n-space vertical :size="20" style="width: 100%">
      <n-card :bordered="false" size="small">
        <n-space :size="16">
          <div style="min-width: 160px">
            <label class="filter-label">处理状态</label>
            <n-select v-model:value="statusFilter" :options="statusOptions" clearable />
          </div>
          <div style="min-width: 160px">
            <label class="filter-label">告警级别</label>
            <n-select v-model:value="levelFilter" :options="levelOptions" clearable />
          </div>
          <div style="min-width: 200px">
            <label class="filter-label">地块</label>
            <n-select v-model:value="plotFilter" :options="plotOptions" clearable />
          </div>
        </n-space>
      </n-card>

      <n-card :bordered="false" size="small">
        <template #header>
          <div class="card-header">
            <span>异常提醒列表</span>
            <n-space>
              <n-button size="small" type="primary" @click="handleSelected">批量处理</n-button>
            </n-space>
          </div>
        </template>
        <n-data-table
          :columns="columns"
          :data="alerts"
          :bordered="false"
          :pagination="{ pageSize: 10 }"
          size="small"
        />
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NTag, NButton, useMessage } from 'naive-ui'
import { useApi } from '@/composables/useApi'
import { useFormat } from '@/composables/useFormat'

const { get, put } = useApi()
const { formatDateTime, getAlertTypeText, getStatusText } = useFormat()
const message = useMessage()

const statusFilter = ref<string | null>('false')
const levelFilter = ref<string | null>(null)
const plotFilter = ref<number | null>(null)
const alerts = ref<any[]>([])
const plotOptions = ref<any[]>([])

const statusOptions = [
  { label: '未处理', value: 'false' },
  { label: '已处理', value: 'true' },
]

const levelOptions = [
  { label: '警告', value: 'warning' },
  { label: '危险', value: 'danger' },
  { label: '提示', value: 'info' },
]

const columns = [
  { type: 'selection', width: 50 },
  { title: '告警时间', key: 'created_at', width: 170, render: (row: any) => formatDateTime(row.created_at) },
  { title: '地块', key: 'plot_name', width: 120 },
  { title: '告警类型', key: 'alert_type', width: 120, render: (row: any) => getAlertTypeText(row.alert_type) },
  {
    title: '级别',
    key: 'alert_level',
    width: 80,
    render: (row: any) =>
      h(NTag, { type: row.alert_level === 'danger' ? 'error' : 'warning', size: 'small' }, {
        default: () => getStatusText(row.alert_level),
      }),
  },
  { title: '指标', key: 'metric', width: 100 },
  { title: '当前值', key: 'current_value', width: 100 },
  { title: '详情', key: 'message', ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'is_handled',
    width: 90,
    render: (row: any) =>
      h(NTag, { type: row.is_handled ? 'success' : 'warning', size: 'small' }, {
        default: () => (row.is_handled ? '已处理' : '未处理'),
      }),
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    render: (row: any) =>
      row.is_handled
        ? null
        : h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => handleAlert(row) }, {
            default: () => '处理',
          }),
  },
]

async function loadPlots() {
  try {
    const plots: any = await get('/plots')
    plotOptions.value = plots.map((p: any) => ({ label: p.name, value: p.id }))
  } catch (e) {
    console.error(e)
  }
}

async function loadAlerts() {
  try {
    const params: any = {}
    if (statusFilter.value !== null) params.is_handled = statusFilter.value === 'true'
    if (levelFilter.value) params.alert_level = levelFilter.value
    if (plotFilter.value) params.plot_id = plotFilter.value
    alerts.value = await get('/environment/alerts', params)
  } catch (e) {
    console.error(e)
  }
}

async function handleAlert(row: any) {
  try {
    await put(`/environment/alerts/${row.id}`, { is_handled: true })
    message.success('已处理')
    loadAlerts()
  } catch (e) {
    message.error('操作失败')
  }
}

function handleSelected() {
  message.info('批量处理功能开发中')
}

onMounted(() => {
  loadPlots()
  loadAlerts()
})
</script>

<style scoped>
.filter-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
