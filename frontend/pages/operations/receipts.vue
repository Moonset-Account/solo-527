<template>
  <div class="page-container">
    <n-card title="运营端 - 回执收集管理" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-select v-model:value="filterStatus" clearable placeholder="回执状态" style="width: 140px;" :options="statusOpts" />
          <n-select v-model:value="filterClass" clearable placeholder="班级" style="width: 160px;" :options="classOpts" />
          <n-select v-model:value="filterNotifType" clearable placeholder="通知类型" style="width: 140px;" :options="notifTypeOpts" />
          <n-date-picker v-model:value="dateRange" type="daterange" clearable style="width: 260px;" />
          <n-button @click="reload">
            <template #icon><n-icon><SearchOutline /></n-icon></template>
            查询
          </n-button>
          <n-button type="success" @click="exportAll">
            <template #icon><n-icon><DownloadOutline /></n-icon></template>
            导出全部回执
          </n-button>
        </n-space>
      </template>

      <n-row :gutter="16" style="margin-bottom: 20px;">
        <n-col :span="6">
          <n-card size="small" style="text-align: center;">
            <n-statistic label="待签回执" :value="stats.pending || 0">
              <template #prefix><n-icon :size="18" color="#f0a020"><TimeOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="6">
          <n-card size="small" style="text-align: center;">
            <n-statistic label="已确认" :value="stats.confirmed || 0">
              <template #prefix><n-icon :size="18" color="#18a058"><CheckmarkDoneOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="6">
          <n-card size="small" style="text-align: center;">
            <n-statistic label="已逾期未签" :value="stats.overdue || 0">
              <template #prefix><n-icon :size="18" color="#d03050"><AlertCircleOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="6">
          <n-card size="small" style="text-align: center;">
            <n-statistic label="整体回执率" :value="stats.rate || 0" suffix="%">
              <template #prefix><n-icon :size="18" color="#2080f0"><TrendingUpOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
      </n-row>

      <n-tabs v-model:value="activeTab" type="line" animated style="margin-bottom: 12px;">
        <n-tab-pane name="all" :tab="`全部回执 (${total})`" />
        <n-tab-pane name="pending" :tab="`待签 (${stats.pending || 0})`" />
        <n-tab-pane name="overdue" :tab="`逾期未签 (${stats.overdue || 0})`" />
        <n-tab-pane name="confirmed" :tab="`已确认 (${stats.confirmed || 0})`" />
      </n-tabs>

      <n-data-table
        :columns="cols"
        :data="list"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
        size="medium"
        @update:page="p => { page = p; reload(); }"
        @update:page-size="s => { pageSize = s; reload(); }"
      />
    </n-card>

    <n-card title="班级回执率排行" :bordered="false">
      <template #header-extra>
        <n-space>
          <n-select v-model:value="rankPeriod" style="width: 140px;" :options="rankPeriodOpts" />
          <n-button @click="loadRank">刷新</n-button>
        </n-space>
      </template>
      <div ref="rankChartRef" style="height: 340px;"></div>
    </n-card>
  </div>

  <n-modal v-model:show="detailVisible" preset="card" style="width: 640px;" title="回执详情">
    <template v-if="detailData">
      <n-descriptions :column="2" bordered label-placement="left" size="small" style="margin-bottom: 16px;">
        <n-descriptions-item label="回执ID">#{{ detailData.id }}</n-descriptions-item>
        <n-descriptions-item label="回执时间">{{ detailData.confirmed_at?.slice(0, 19) || '-' }}</n-descriptions-item>
        <n-descriptions-item label="回执人">{{ detailData.user_name }}</n-descriptions-item>
        <n-descriptions-item label="关联学生">{{ detailData.student_name || '-' }}</n-descriptions-item>
        <n-descriptions-item label="回执状态" :span="2">
          <n-tag :type="statusType(detailData.status)" size="small" round>
            {{ statusLabel(detailData.status) }}
          </n-tag>
        </n-descriptions-item>
      </n-descriptions>
      <n-card title="关联通知" size="small" :bordered="true" style="margin-bottom: 16px;">
        <template #header-extra>
          <n-tag :type="notifTypeType(notifData?.type)" size="small">{{ notifTypeLabel(notifData?.type) }}</n-tag>
        </template>
        <n-descriptions :column="2" bordered size="small" label-placement="left">
          <n-descriptions-item label="通知标题">{{ notifData?.title || '-' }}</n-descriptions-item>
          <n-descriptions-item label="发布人">{{ notifData?.publisher_name || '-' }}</n-descriptions-item>
          <n-descriptions-item label="发布时间">{{ notifData?.publish_time?.slice(0, 16) || '-' }}</n-descriptions-item>
          <n-descriptions-item label="回执截止">{{ notifData?.receipt_deadline?.slice(0, 16) || '无' }}</n-descriptions-item>
        </n-descriptions>
        <n-divider style="margin: 12px 0;" />
        <div style="line-height: 1.7; white-space: pre-wrap;">{{ notifData?.content || '-' }}</div>
      </n-card>
      <n-form-item label="回执备注/反馈">
        <n-input v-model:value="detailRemark" type="textarea" :rows="3" placeholder="可补充回执反馈说明..." />
      </n-form-item>
    </template>
    <template #footer>
      <n-space justify="end">
        <n-button @click="detailVisible = false">关闭</n-button>
        <n-button v-if="detailData?.status === 'pending'" type="primary" @click="confirmOne(detailData!)">代确认</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import {
  SearchOutline, DownloadOutline, TimeOutline, AlertCircleOutline,
  CheckmarkDoneOutline, TrendingUpOutline, EyeOutline, CheckmarkCircleOutline,
  MegaphoneOutline, MailOutline
} from '@vicons/ionicons5'
import { apiGet, apiPut, downloadFile } from '~/composables/useApi'
import type { DataTableColumns } from 'naive-ui'
import { useMessage, NTag, NSpace, NButton, NProgress, NDivider, NStatistic } from 'naive-ui'
import * as echarts from 'echarts'
import type { ReceiptItem, NotificationItem } from '~/types'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
appStore.setPage('运营端 / 回执收集', route.path)
const message = useMessage()

const filterStatus = ref<string | null>(null)
const filterClass = ref<number | null>(null)
const filterNotifType = ref<string | null>(null)
const dateRange = ref<number[] | null>(null)
const activeTab = ref('all')
const list = ref<ReceiptItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const stats = reactive({ pending: 0, confirmed: 0, overdue: 0, rate: 0 })
const classOpts = ref<any[]>([])

const statusOpts = [
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已拒绝', value: 'rejected' },
]
const notifTypeOpts = [
  { label: '公告', value: 'notice' },
  { label: '作业', value: 'homework' },
  { label: '提醒', value: 'reminder' },
  { label: '活动', value: 'activity' },
  { label: '紧急', value: 'emergency' },
]
const rankPeriodOpts = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
]
const rankPeriod = ref('month')

function statusLabel(v: string) { return statusOpts.find(o => o.value === v)?.label || v }
function statusType(v: string) { return { pending: 'warning', confirmed: 'success', rejected: 'error' }[v] || 'default' }
function notifTypeLabel(v: string) { return notifTypeOpts.find(o => o.value === v)?.label || v || '-' }
function notifTypeType(v: string) { return { notice: 'info', homework: 'success', reminder: 'warning', activity: 'default', emergency: 'error' }[v] || 'default' }

async function loadClasses() {
  try {
    const res = await apiGet<any>('/classes/', { page_size: 200 })
    classOpts.value = (res?.items || res?.data?.items || []).map((c: any) => ({ label: c.name, value: c.id }))
  } catch {}
}

const pagination = computed(() => ({
  page: page.value, pageSize: pageSize.value, itemCount: total.value,
  showSizePicker: true, pageSizes: [20, 50, 100]
}))

const cols: DataTableColumns = [
  { title: 'ID', key: 'id', width: 70 },
  {
    title: '状态', key: 'status', width: 90,
    render: (r: any) => {
      const isOverdue = isReceiptOverdue(r)
      return h('div', null, [
        h(NTag, { type: statusType(r.status), size: 'small' }, { default: () => statusLabel(r.status) }),
        isOverdue && r.status === 'pending' ? h(NTag, { type: 'error', size: 'small', style: 'margin-left:4px;' }, { default: () => '逾期' }) : null
      ])
    }
  },
  { title: '回执人', key: 'user_name', width: 110 },
  { title: '关联学生', key: 'student_name', width: 110 },
  { title: '通知标题', key: 'notification_title', ellipsis: { tooltip: true }, render: (r: any) => r._notif_title || r.notification_title || '-' },
  { title: '通知类型', key: 'notification_type', width: 90, render: (r: any) => r._notif_type ? h(NTag, { type: notifTypeType(r._notif_type), size: 'small' }, { default: () => notifTypeLabel(r._notif_type) }) : '-' },
  {
    title: '回执截止', key: 'deadline', width: 140,
    render: (r: any) => {
      const dl = r._receipt_deadline
      if (!dl) return '-'
      const overdue = isReceiptOverdue(r)
      return h('span', { style: overdue ? 'color:#d03050;font-weight:600;' : '' }, dl.slice(0, 16))
    }
  },
  { title: '确认时间', key: 'confirmed_at', width: 140, render: (r: any) => r.confirmed_at?.slice(0, 16) || '-' },
  { title: '备注', key: 'remark', ellipsis: true, render: (r: any) => r.remark || '-' },
  {
    title: '操作', key: 'ops', width: 220, fixed: 'right',
    render: (r: any) => h(NSpace, null, {
      default: () => [
        h(NButton, { size: 'tiny', type: 'primary', quaternary: true, onClick: () => viewDetail(r) }, {
          default: () => h(NIcon, null, { default: () => h(EyeOutline) }),
        }),
        r.status === 'pending' ? h(NButton, { size: 'tiny', type: 'success', quaternary: true, onClick: () => confirmOne(r) }, {
          default: () => h(NIcon, null, { default: () => h(CheckmarkCircleOutline) }),
        }) : null,
        r.status === 'pending' ? h(NButton, { size: 'tiny', type: 'warning', quaternary: true, onClick: () => sendReminder(r) }, {
          default: () => h(NIcon, null, { default: () => h(MegaphoneOutline) }),
        }) : null,
      ]
    })
  },
]

function isReceiptOverdue(r: any) {
  const dl = r._receipt_deadline
  if (!dl || r.status !== 'pending') return false
  return Date.now() > new Date(dl).getTime()
}

async function reload() {
  loading.value = true
  try {
    const params: any = {
      status: activeTab.value !== 'all' ? (activeTab.value === 'overdue' ? 'pending' : activeTab.value) : filterStatus.value,
      class_id: filterClass.value, notification_type: filterNotifType.value,
      page: page.value, page_size: pageSize.value, overdue_only: activeTab.value === 'overdue' ? 1 : undefined
    }
    if (dateRange.value?.length === 2) {
      params.start_date = new Date(dateRange.value[0]).toISOString().slice(0, 10)
      params.end_date = new Date(dateRange.value[1]).toISOString().slice(0, 10)
    }
    const res = await apiGet<any>('/notifications/receipts/all', params)
    list.value = (res?.items || res?.data?.items || res || []).map((r: any) => ({
      ...r,
      _notif_title: r.notification?.title,
      _notif_type: r.notification?.type,
      _receipt_deadline: r.notification?.receipt_deadline,
    }))
    total.value = res?.total || res?.data?.total || 0
    stats.pending = list.value.filter(r => r.status === 'pending').length
    stats.confirmed = list.value.filter(r => r.status === 'confirmed').length
    stats.overdue = list.value.filter(r => isReceiptOverdue(r)).length
    const totalR = stats.pending + stats.confirmed + list.value.filter(r => r.status === 'rejected').length
    stats.rate = totalR ? Math.round(stats.confirmed / totalR * 100) : 0
  } finally { loading.value = false }
}

const detailVisible = ref(false)
const detailData = ref<ReceiptItem | null>(null)
const notifData = ref<NotificationItem | null>(null)
const detailRemark = ref('')

async function viewDetail(r: ReceiptItem) {
  detailData.value = r
  detailRemark.value = r.remark || ''
  detailVisible.value = true
  try {
    const res = await apiGet<any>(`/notifications/${r.notification_id}`)
    notifData.value = res?.data || res
  } catch {}
}

async function confirmOne(r: ReceiptItem) {
  try {
    await apiPut(`/notifications/receipts/${r.id}/confirm`, { remark: detailRemark.value || undefined })
    message.success('已代确认')
    reload()
    detailVisible.value = false
  } catch (e: any) { message.error(e?.message || '操作失败') }
}

function sendReminder(r: ReceiptItem) {
  message.success(`已向 ${r.user_name} 发送催签提醒（模拟）`)
}

async function exportAll() {
  const params = new URLSearchParams()
  if (filterStatus.value) params.set('status', filterStatus.value)
  if (filterClass.value) params.set('class_id', String(filterClass.value))
  if (dateRange.value?.length === 2) {
    params.set('start_date', new Date(dateRange.value[0]).toISOString().slice(0, 10))
    params.set('end_date', new Date(dateRange.value[1]).toISOString().slice(0, 10))
  }
  try {
    await downloadFile(`/notifications/receipts/export/xlsx?${params.toString()}`, `回执汇总_${Date.now()}.xlsx`)
    message.success('已开始下载')
  } catch (e: any) { message.error(e?.message || '导出失败') }
}

const rankChartRef = ref<HTMLElement | null>(null)
let rankChart: echarts.ECharts | null = null

async function loadRank() {
  await nextTick()
  if (!rankChartRef.value) return
  const mockData = classOpts.value.length ? classOpts.value.map((c, i) => ({
    name: c.label, value: 50 + Math.floor(Math.random() * 50 + i * 3) % 50
  })) : [
    { name: '素描一班', value: 96 },
    { name: '色彩一班', value: 92 },
    { name: '播音主持A班', value: 88 },
    { name: '声乐二班', value: 85 },
    { name: '编导强化班', value: 82 },
    { name: '舞蹈基础班', value: 78 },
  ]
  mockData.sort((a, b) => b.value - a.value)
  if (!rankChart) rankChart = echarts.init(rankChartRef.value)
  rankChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}%' },
    grid: { left: 120, right: 50, top: 30, bottom: 30 },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    yAxis: { type: 'category', data: mockData.map(d => d.name) },
    series: [{
      type: 'bar', data: mockData.map(d => d.value),
      itemStyle: {
        color: (p: any) => p.value >= 90 ? '#18a058' : p.value >= 80 ? '#2080f0' : p.value >= 60 ? '#f0a020' : '#d03050',
        borderRadius: [0, 4, 4, 0]
      },
      label: { show: true, position: 'right', formatter: '{c}%' },
      barWidth: 18
    }]
  })
}

watch(rankPeriod, loadRank)
onMounted(async () => {
  await loadClasses()
  await reload()
  await loadRank()
})
</script>
