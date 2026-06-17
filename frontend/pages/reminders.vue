<template>
  <div class="page-container">
    <n-card title="提醒中心" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-select v-model:value="filterType" clearable placeholder="类型" style="width: 140px;" :options="typeOpts" />
          <n-select v-model:value="filterPriority" clearable placeholder="优先级" style="width: 130px;" :options="priorityOpts" />
          <n-select v-model:value="filterStatus" clearable placeholder="状态" style="width: 130px;" :options="statusOpts" />
          <n-date-picker v-model:value="dateRange" type="daterange" clearable style="width: 260px;" />
          <n-button @click="reload">
            <template #icon><n-icon><SearchOutline /></n-icon></template>
            查询
          </n-button>
          <n-button type="primary" @click="markAllRead">
            <template #icon><n-icon><CheckmarkDoneOutline /></n-icon></template>
            全部标为已读
          </n-button>
          <n-button type="warning" @click="scanHomework">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            扫描作业逾期
          </n-button>
        </n-space>
      </template>

      <n-tabs v-model:value="activeTab" type="line" animated style="margin-bottom: 16px;">
        <n-tab-pane name="all" :tab="`全部 (${total})`" />
        <n-tab-pane name="unread" :tab="`未读 (${unreadCount})`" />
        <n-tab-pane name="urgent" :tab="`紧急/高 (${highCount})`" />
        <n-tab-pane name="overdue" :tab="`已逾期 (${overdueCount})`" />
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
  </div>

  <n-modal v-model:show="detailVisible" preset="card" style="width: 600px;" :title="detailData?.title || ''">
    <template v-if="detailData">
      <n-descriptions :column="2" bordered label-placement="left" size="small" style="margin-bottom: 16px;">
        <n-descriptions-item label="类型">
          <n-tag :type="typeType(detailData.type)" size="small" round>{{ typeLabel(detailData.type) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="优先级">
          <n-tag :type="priorityType(detailData.priority)" size="small" round>{{ priorityLabel(detailData.priority) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="statusType(detailData.status)" size="small">{{ statusLabel(detailData.status) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="是否逾期">
          <n-tag v-if="detailData.is_overdue" type="error" size="small">已逾期</n-tag>
          <n-tag v-else type="success" size="small">正常</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="计划发送">{{ detailData.scheduled_at?.slice(0, 16) || '-' }}</n-descriptions-item>
        <n-descriptions-item label="实际发送">{{ detailData.sent_at?.slice(0, 16) || '-' }}</n-descriptions-item>
        <n-descriptions-item label="阅读时间">{{ detailData.read_at?.slice(0, 16) || '未读' }}</n-descriptions-item>
        <n-descriptions-item label="创建时间">{{ detailData.created_at?.slice(0, 16) }}</n-descriptions-item>
      </n-descriptions>
      <n-card title="提醒内容" size="small" :bordered="true" style="margin-bottom: 16px;">
        <div style="white-space: pre-wrap; line-height: 1.7;">{{ detailData.content }}</div>
      </n-card>
      <n-space v-if="detailData.student_id || detailData.class_id" wrap>
        <n-tag v-if="detailData.student_id" type="info" round>关联学生ID: {{ detailData.student_id }}</n-tag>
        <n-tag v-if="detailData.class_id" type="info" round>关联班级ID: {{ detailData.class_id }}</n-tag>
      </n-space>
    </template>
    <template #footer>
      <n-space justify="end">
        <n-button v-if="detailData?.status !== 'read'" type="primary" @click="markOneRead(detailData!)">标为已读</n-button>
        <n-button @click="detailVisible = false">关闭</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import {
  SearchOutline, CheckmarkDoneOutline, RefreshOutline,
  EyeOutline, CheckmarkCircleOutline
} from '@vicons/ionicons5'
import { apiGet, apiPost, apiPut } from '~/composables/useApi'
import type { DataTableColumns } from 'naive-ui'
import { useMessage, NTag, NSpace, NButton } from 'naive-ui'
import type { ReminderItem } from '~/types'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
appStore.setPage('提醒中心', route.path)
const message = useMessage()

const filterType = ref<string | null>(null)
const filterPriority = ref<string | null>(null)
const filterStatus = ref<string | null>(null)
const dateRange = ref<number[] | null>(null)
const activeTab = ref('all')
const list = ref<ReminderItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const typeOpts = [
  { label: '作业提醒', value: 'homework' },
  { label: '消课提醒', value: 'consumption' },
  { label: '排课提醒', value: 'schedule' },
  { label: '系统通知', value: 'system' },
]
const priorityOpts = [
  { label: '低', value: 'low' },
  { label: '普通', value: 'normal' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' },
]
const statusOpts = [
  { label: '待发送', value: 'pending' },
  { label: '已发送', value: 'sent' },
  { label: '已读', value: 'read' },
  { label: '已取消', value: 'cancelled' },
]

function typeLabel(v: string) { return typeOpts.find(o => o.value === v)?.label || v }
function typeType(v: string) { return { homework: 'success', consumption: 'warning', schedule: 'primary', system: 'info' }[v] || 'default' }
function priorityLabel(v: string) { return priorityOpts.find(o => o.value === v)?.label || v }
function priorityType(v: string) { return { low: 'default', normal: 'info', high: 'warning', urgent: 'error' }[v] || 'default' }
function statusLabel(v: string) { return statusOpts.find(o => o.value === v)?.label || v }
function statusType(v: string) { return { pending: 'warning', sent: 'info', read: 'success', cancelled: 'default' }[v] || 'default' }

const unreadCount = computed(() => list.value.filter(r => r.status !== 'read').length)
const highCount = computed(() => list.value.filter(r => r.priority === 'urgent' || r.priority === 'high').length)
const overdueCount = computed(() => list.value.filter(r => r.is_overdue).length)

const pagination = computed(() => ({
  page: page.value, pageSize: pageSize.value, itemCount: total.value,
  showSizePicker: true, pageSizes: [20, 40, 100]
}))

const cols: DataTableColumns = [
  { title: 'ID', key: 'id', width: 70 },
  {
    title: '类型', key: 'type', width: 100,
    render: (r: any) => h(NTag, { type: typeType(r.type), size: 'small', round: true }, { default: () => typeLabel(r.type) })
  },
  {
    title: '优先级', key: 'priority', width: 90,
    render: (r: any) => h(NTag, { type: priorityType(r.priority), size: 'small', round: true }, { default: () => priorityLabel(r.priority) })
  },
  {
    title: '标题', key: 'title', ellipsis: { tooltip: true },
    render: (r: any) => h('div', { style: `font-weight:${r.status === 'read' ? '400' : '600'}` }, [
      r.is_overdue ? h(NTag, { type: 'error', size: 'small', style: 'margin-right:6px;' }, { default: () => '逾期' }) : null,
      r.title
    ])
  },
  { title: '内容摘要', key: 'content', ellipsis: { tooltip: true }, render: (r: any) => r.content?.slice(0, 40) + (r.content?.length > 40 ? '...' : '') },
  {
    title: '状态', key: 'status', width: 90,
    render: (r: any) => h(NTag, { type: statusType(r.status), size: 'small' }, { default: () => statusLabel(r.status) })
  },
  { title: '计划发送', key: 'scheduled_at', width: 140, render: (r: any) => r.scheduled_at?.slice(0, 16) || '-' },
  { title: '创建时间', key: 'created_at', width: 140, render: (r: any) => r.created_at?.slice(0, 16) },
  {
    title: '操作', key: 'ops', width: 160, fixed: 'right',
    render: (r: any) => h(NSpace, null, {
      default: () => [
        h(NButton, { size: 'tiny', type: 'primary', quaternary: true, onClick: () => viewDetail(r) }, {
          default: () => h(NIcon, null, { default: () => h(EyeOutline) }),
        }),
        r.status !== 'read' ? h(NButton, { size: 'tiny', type: 'success', quaternary: true, onClick: () => markOneRead(r) }, {
          default: () => h(NIcon, null, { default: () => h(CheckmarkCircleOutline) }),
        }) : null,
      ]
    })
  },
]

async function reload() {
  loading.value = true
  try {
    const params: any = {
      type: filterType.value, priority: filterPriority.value,
      status: filterStatus.value, page: page.value, page_size: pageSize.value
    }
    if (activeTab.value === 'unread') params.status_not = 'read'
    if (activeTab.value === 'urgent') params.priority_in = ['urgent', 'high']
    if (activeTab.value === 'overdue') params.is_overdue = 1
    if (dateRange.value?.length === 2) {
      params.start_date = new Date(dateRange.value[0]).toISOString().slice(0, 10)
      params.end_date = new Date(dateRange.value[1]).toISOString().slice(0, 10)
    }
    const res = await apiGet<any>('/reminders/', params)
    list.value = res?.items || res?.data?.items || []
    total.value = res?.total || res?.data?.total || 0
  } finally { loading.value = false }
}

async function markOneRead(r: ReminderItem) {
  await apiPut(`/reminders/${r.id}/read`)
  message.success('已标为已读')
  reload()
}

async function markAllRead() {
  try {
    await apiPost('/reminders/read-all')
    message.success('已全部标为已读')
    reload()
  } catch (e: any) { message.error(e?.message || '操作失败') }
}

async function scanHomework() {
  const msg = message.loading('正在扫描作业逾期情况...', { duration: 0 })
  try {
    const res = await apiPost('/dashboard/scan-homework')
    msg.destroy()
    message.success(`扫描完成，生成 ${res?.count || res?.data?.count || 0} 条提醒`)
    reload()
  } catch (e: any) {
    msg.destroy()
    message.error(e?.message || '扫描失败')
  }
}

const detailVisible = ref(false)
const detailData = ref<ReminderItem | null>(null)

function viewDetail(r: ReminderItem) {
  detailData.value = r
  detailVisible.value = true
  if (r.status !== 'read') {
    apiPut(`/reminders/${r.id}/read`).then(() => reload()).catch(() => {})
  }
}

onMounted(reload)
</script>
