<template>
  <div class="page-container">
    <n-card title="运营端 - 通知发布管理" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-select v-model:value="filterType" clearable placeholder="类型" style="width: 130px;" :options="typeOpts" />
          <n-select v-model:value="filterPriority" clearable placeholder="优先级" style="width: 130px;" :options="priorityOpts" />
          <n-select v-model:value="filterClass" clearable placeholder="发布班级" style="width: 160px;" :options="classOpts" />
          <n-select v-model:value="isDraft" clearable placeholder="状态" style="width: 130px;" :options="draftOpts" />
          <n-date-picker v-model:value="dateRange" type="daterange" clearable style="width: 260px;" />
          <n-button @click="reload">
            <template #icon><n-icon><SearchOutline /></n-icon></template>
            查询
          </n-button>
          <n-button type="primary" @click="openCreate">
            <template #icon><n-icon><AddOutline /></n-icon></template>
            新建通知
          </n-button>
        </n-space>
      </template>

      <n-row :gutter="16" style="margin-bottom: 20px;">
        <n-col :span="4">
          <n-card size="small" style="text-align: center;">
            <n-statistic label="今日发布" :value="summary.today_published || 0">
              <template #prefix><n-icon :size="18" color="#2080f0"><PaperPlaneOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="4">
          <n-card size="small" style="text-align: center;">
            <n-statistic label="待回执总数" :value="summary.pending_receipts || 0">
              <template #prefix><n-icon :size="18" color="#f0a020"><TimeOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="4">
          <n-card size="small" style="text-align: center;">
            <n-statistic label="草稿" :value="summary.drafts || 0">
              <template #prefix><n-icon :size="18" color="#999"><DocumentTextOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="4">
          <n-card size="small" style="text-align: center;">
            <n-statistic label="平均回执率" :value="summary.avg_receipt_rate || 0" suffix="%">
              <template #prefix><n-icon :size="18" color="#18a058"><CheckboxOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="4">
          <n-card size="small" style="text-align: center;">
            <n-statistic label="紧急通知" :value="summary.urgent_count || 0">
              <template #prefix><n-icon :size="18" color="#d03050"><AlertCircleOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="4">
          <n-card size="small" style="text-align: center;">
            <n-statistic label="本月发布" :value="summary.month_published || 0">
              <template #prefix><n-icon :size="18" color="#722ed1"><StatsChartOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
      </n-row>

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

  <n-modal v-model:show="receiptVisible" preset="card" style="width: 760px;" :title="`回执跟踪 - ${currentNotif?.title || ''}`">
    <template v-if="currentNotif">
      <n-descriptions :column="3" bordered size="small" label-placement="left" style="margin-bottom: 16px;">
        <n-descriptions-item label="类型">
          <n-tag :type="typeType(currentNotif.type)" size="small" round>{{ typeLabel(currentNotif.type) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="优先级">
          <n-tag :type="priorityType(currentNotif.priority)" size="small" round>{{ priorityLabel(currentNotif.priority) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="发布时间">{{ currentNotif.publish_time?.slice(0, 16) }}</n-descriptions-item>
        <n-descriptions-item label="发布人">{{ currentNotif.publisher_name }}</n-descriptions-item>
        <n-descriptions-item label="目标班级">{{ currentNotif.class_name || '全校区' }}</n-descriptions-item>
        <n-descriptions-item label="回执截止">{{ currentNotif.receipt_deadline?.slice(0, 16) || '-' }}</n-descriptions-item>
        <n-descriptions-item label="回执进度" :span="3">
          <n-space vertical style="width: 100%;">
            <n-space justify="space-between">
              <n-text>已确认 {{ currentNotif.confirmed_receipts }} / {{ currentNotif.total_receipts }}</n-text>
              <n-text strong>{{ rateText(currentNotif) }}</n-text>
            </n-space>
            <n-progress
              :percentage="currentNotif.total_receipts ? currentNotif.confirmed_receipts / currentNotif.total_receipts * 100 : 0"
              :show-indicator="false" :height="8"
              :status="currentNotif.total_receipts && currentNotif.confirmed_receipts / currentNotif.total_receipts >= 0.9 ? 'success' : 'warning'"
            />
          </n-space>
        </n-descriptions-item>
      </n-descriptions>

      <n-card size="small" :bordered="true" style="margin-bottom: 16px;">
        <template #header>
          <n-space justify="space-between" style="width: 100%;">
            <n-text strong>通知内容</n-text>
            <n-tag v-if="currentNotif.attachments?.length" size="small" type="info">
              {{ currentNotif.attachments.length }} 个附件
            </n-tag>
          </n-space>
        </template>
        <div style="white-space: pre-wrap; line-height: 1.7;">{{ currentNotif.content }}</div>
      </n-card>

      <n-space style="margin-bottom: 12px;">
        <n-button type="warning" @click="remindPending">
          <template #icon><n-icon><MegaphoneOutline /></n-icon></template>
          一键催签（{{ pendingCount }}人未签）
        </n-button>
        <n-button type="error" v-if="overduePendingCount > 0">
          <template #icon><n-icon><AlertCircleOutline /></n-icon></template>
          逾期未签：{{ overduePendingCount }}人
        </n-button>
        <n-button type="success" @click="exportReceipts">
          <template #icon><n-icon><DownloadOutline /></n-icon></template>
          导出回执 Excel
        </n-button>
        <n-button type="primary" @click="sendReminderSms">
          <template #icon><n-icon><ChatbubbleEllipsesOutline /></n-icon></template>
          发送短信提醒
        </n-button>
      </n-space>

      <n-space style="margin-bottom: 12px;" wrap>
        <n-tag v-for="s in statTags" :key="s.key" :type="s.type" size="small" round round-size="medium">
          {{ s.label }}: {{ s.count }}
        </n-tag>
      </n-space>

      <n-data-table
        :columns="receiptCols"
        :data="receipts"
        :loading="receiptLoading"
        :bordered="false"
        size="small"
        :pagination="receiptPagination"
        @update:page="rp => { receiptPage = rp; loadReceipts(); }"
      />
    </template>
  </n-modal>

  <n-modal v-model:show="formVisible" preset="card" style="width: 640px;" :title="editData?.id ? '编辑通知' : '发布新通知'">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="100">
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="通知类型" path="type">
            <n-select v-model:value="form.type" :options="typeOpts" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="优先级" path="priority">
            <n-select v-model:value="form.priority" :options="priorityOpts" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="2">
          <n-form-item label="通知标题" path="title">
            <n-input v-model:value="form.title" placeholder="请输入通知标题（建议不超过30字）" maxlength="100" show-count />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="发布范围">
            <n-select v-model:value="form.class_id" :options="classOpts" clearable placeholder="不选则全校区发送" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="发布人">
            <n-input v-model:value="currentUser.real_name" disabled />
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="2">
          <n-form-item label="是否需要回执">
            <n-space>
              <n-switch v-model:value="form.require_receipt" />
              <n-text depth="3">开启后家长/教师需确认收到</n-text>
            </n-space>
          </n-form-item>
        </n-grid-item>
        <n-grid-item v-if="form.require_receipt" :span="2">
          <n-form-item label="回执截止时间" path="receipt_deadline">
            <n-date-picker v-model:value="form.receipt_deadline" type="datetime" style="width: 100%;" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="2">
          <n-form-item label="通知正文" path="content">
            <n-input v-model:value="form.content" type="textarea" :rows="6" placeholder="请输入通知内容..." maxlength="2000" show-count />
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="2">
          <n-form-item label="附件上传">
            <n-upload
              v-model:file-list="uploadedFiles"
              :max="5"
              :custom-request="customUpload"
              :show-file-list="true"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            >
              <n-button>
                <template #icon><n-icon><CloudUploadOutline /></n-icon></template>
                选择文件（最多5个）
              </n-button>
            </n-upload>
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="定时发布">
            <n-space>
              <n-switch v-model:value="scheduled" />
              <n-date-picker v-if="scheduled" v-model:value="form.scheduled_time" type="datetime" style="width: 220px;" />
            </n-space>
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="保存草稿">
            <n-switch v-model:value="form.is_draft" />
          </n-form-item>
        </n-grid-item>
      </n-grid>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="formVisible = false">取消</n-button>
        <n-button type="default" :loading="submitting" @click="saveDraft">保存草稿</n-button>
        <n-button type="primary" :loading="submitting" @click="submitForm">{{ scheduled ? '定时发布' : '立即发布' }}</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import {
  SearchOutline, AddOutline, DownloadOutline, MegaphoneOutline,
  CloudUploadOutline, CheckboxOutline, TimeOutline, AlertCircleOutline,
  PaperPlaneOutline, DocumentTextOutline, StatsChartOutline, ChatbubbleEllipsesOutline,
  EyeOutline, CreateOutline, TrashOutline
} from '@vicons/ionicons5'
import { apiGet, apiPost, apiPut, apiDelete, downloadFile } from '~/composables/useApi'
import type { DataTableColumns, FormInst, FormRules, UploadFile, UploadCustomRequestOptions } from 'naive-ui'
import { useMessage, useDialog, NTag, NSpace, NButton, NProgress } from 'naive-ui'
import type { NotificationItem, ReceiptItem } from '~/types'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
appStore.setPage('运营端 / 通知发布', route.path)
const message = useMessage()
const dialog = useDialog()

const filterType = ref<string | null>(null)
const filterPriority = ref<string | null>(null)
const filterClass = ref<number | null>(null)
const isDraft = ref<any>(null)
const dateRange = ref<number[] | null>(null)
const list = ref<NotificationItem[]>([])
const summary = ref<any>({})
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const classOpts = ref<any[]>([])
const currentUser = computed(() => userStore.user || { real_name: '' })

const typeOpts = [
  { label: '公告通知', value: 'notice' },
  { label: '作业通知', value: 'homework' },
  { label: '事项提醒', value: 'reminder' },
  { label: '活动通知', value: 'activity' },
  { label: '紧急通知', value: 'emergency' },
]
const priorityOpts = [
  { label: '低', value: 'low' },
  { label: '普通', value: 'normal' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' },
]
const draftOpts = [
  { label: '草稿', value: '1' },
  { label: '已发布', value: '0' },
]

function typeLabel(v: string) { return typeOpts.find(o => o.value === v)?.label || v }
function typeType(v: string) { return { notice: 'info', homework: 'success', reminder: 'warning', activity: 'default', emergency: 'error' }[v] || 'default' }
function priorityLabel(v: string) { return priorityOpts.find(o => o.value === v)?.label || v }
function priorityType(v: string) { return { low: 'default', normal: 'info', high: 'warning', urgent: 'error' }[v] || 'default' }
function statusLabel(v: boolean) { return v ? '草稿' : '已发布' }
function statusType(v: boolean) { return v ? 'warning' : 'success' }
function rateText(n: any) { return n.total_receipts ? (n.confirmed_receipts / n.total_receipts * 100).toFixed(1) + '%' : '0%' }

async function loadClasses() {
  try {
    const res = await apiGet<any>('/classes/', { page_size: 200 })
    classOpts.value = (res?.items || res?.data?.items || []).map((c: any) => ({ label: c.name, value: c.id }))
  } catch {}
}

const pagination = computed(() => ({
  page: page.value, pageSize: pageSize.value, itemCount: total.value,
  showSizePicker: true, pageSizes: [20, 40, 100]
}))

const cols: DataTableColumns = [
  { title: '编号', key: 'notification_code', width: 130 },
  {
    title: '类型', key: 'type', width: 90,
    render: (r: any) => h(NTag, { type: typeType(r.type), size: 'small', round: true }, { default: () => typeLabel(r.type) })
  },
  {
    title: '优先级', key: 'priority', width: 80,
    render: (r: any) => h(NTag, { type: priorityType(r.priority), size: 'small' }, { default: () => priorityLabel(r.priority) })
  },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: '班级', key: 'class_name', width: 140, render: (r: any) => r.class_name || h(NTag, { size: 'small' }, { default: () => '全校区' }) },
  { title: '发布人', key: 'publisher_name', width: 90 },
  { title: '发布时间', key: 'publish_time', width: 140, render: (r: any) => r.publish_time?.slice(0, 16) || (r.is_draft ? h('span', { style: 'color:#f0a020' }, '草稿') : '-') },
  {
    title: '回执', key: 'receipt', width: 140,
    render: (r: any) => r.require_receipt ? h('div', null, [
      h(NProgress, {
        percentage: r.total_receipts ? r.confirmed_receipts / r.total_receipts * 100 : 0,
        'show-indicator': false, height: 6, style: 'margin-bottom:4px;'
      }),
      h('span', { style: 'font-size:12px;color:#666;' }, `${r.confirmed_receipts}/${r.total_receipts} ${rateText(r)}`)
    ]) : h(NTag, { size: 'small' }, { default: () => '无需回执' })
  },
  {
    title: '状态', key: 'is_draft', width: 80,
    render: (r: any) => h(NTag, { type: statusType(r.is_draft), size: 'small' }, { default: () => statusLabel(r.is_draft) })
  },
  {
    title: '操作', key: 'ops', width: 220, fixed: 'right',
    render: (r: any) => h(NSpace, null, {
      default: () => [
        r.require_receipt ? h(NButton, { size: 'tiny', type: 'primary', onClick: () => viewReceipts(r) }, { default: () => '回执跟踪' }) : null,
        r.is_draft ? h(NButton, { size: 'tiny', type: 'success', quaternary: true, onClick: () => publishDraft(r) }, { default: () => '发布' }) : null,
        h(NButton, { size: 'tiny', quaternary: true, onClick: () => openEdit(r) }, {
          default: () => h(NIcon, null, { default: () => h(CreateOutline) }),
        }),
        h(NButton, { size: 'tiny', type: 'error', quaternary: true, onClick: () => onDelete(r) }, {
          default: () => h(NIcon, null, { default: () => h(TrashOutline) }),
        }),
      ]
    })
  },
]

async function reload() {
  loading.value = true
  try {
    const params: any = {
      type: filterType.value, priority: filterPriority.value,
      class_id: filterClass.value, page: page.value, page_size: pageSize.value
    }
    if (isDraft.value !== null && isDraft.value !== undefined) params.is_draft = isDraft.value === '1'
    if (dateRange.value?.length === 2) {
      params.start_date = new Date(dateRange.value[0]).toISOString().slice(0, 10)
      params.end_date = new Date(dateRange.value[1]).toISOString().slice(0, 10)
    }
    const res = await apiGet<any>('/notifications/', params)
    list.value = res?.items || res?.data?.items || []
    total.value = res?.total || res?.data?.total || 0
    summary.value = {
      today_published: list.value.filter(r => r.publish_time?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
      pending_receipts: list.value.reduce((s, r) => s + (r.require_receipt ? (r.total_receipts - r.confirmed_receipts) : 0), 0),
      drafts: list.value.filter(r => r.is_draft).length,
      avg_receipt_rate: list.value.length ? Math.round(
        list.value.filter(r => r.require_receipt).reduce((s, r) => s + (r.total_receipts ? r.confirmed_receipts / r.total_receipts * 100 : 0), 0) /
        Math.max(1, list.value.filter(r => r.require_receipt).length)
      ) : 0,
      urgent_count: list.value.filter(r => r.priority === 'urgent').length,
      month_published: list.value.filter(r => {
        const now = new Date(); const d = new Date(r.publish_time || 0)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      }).length,
    }
  } finally { loading.value = false }
}

const receiptVisible = ref(false)
const currentNotif = ref<NotificationItem | null>(null)
const receipts = ref<ReceiptItem[]>([])
const receiptLoading = ref(false)
const receiptTotal = ref(0)
const receiptPage = ref(1)
const receiptPageSize = ref(50)

const receiptPagination = computed(() => ({
  page: receiptPage.value, pageSize: receiptPageSize.value, itemCount: receiptTotal.value,
  showSizePicker: true, pageSizes: [20, 50, 100]
}))

const pendingCount = computed(() => receipts.value.filter(r => r.status === 'pending').length)
const overduePendingCount = computed(() => {
  if (!currentNotif.value?.receipt_deadline) return 0
  const deadline = new Date(currentNotif.value.receipt_deadline).getTime()
  const now = Date.now()
  return receipts.value.filter(r => r.status === 'pending' && now > deadline).length
})
const statTags = computed(() => ([
  { key: 'total', label: '总数', count: receipts.value.length, type: 'info' as const },
  { key: 'confirmed', label: '已确认', count: receipts.value.filter(r => r.status === 'confirmed').length, type: 'success' as const },
  { key: 'pending', label: '待确认', count: receipts.value.filter(r => r.status === 'pending').length, type: 'warning' as const },
  { key: 'rejected', label: '已拒绝', count: receipts.value.filter(r => r.status === 'rejected').length, type: 'error' as const },
]))

const receiptCols: DataTableColumns = [
  { title: '回执人', key: 'user_name', width: 110 },
  { title: '关联学生', key: 'student_name', width: 110 },
  {
    title: '状态', key: 'status', width: 90,
    render: (r: any) => h(NTag, {
      type: r.status === 'confirmed' ? 'success' : r.status === 'rejected' ? 'error' : 'warning', size: 'small'
    }, { default: () => r.status === 'confirmed' ? '已确认' : r.status === 'rejected' ? '已拒绝' : '待签' })
  },
  { title: '确认时间', key: 'confirmed_at', width: 140, render: (r: any) => r.confirmed_at?.slice(0, 16) || '-' },
  { title: '备注', key: 'remark', ellipsis: true },
  {
    title: '操作', key: 'ops', width: 120,
    render: (r: any) => r.status === 'pending' ? h(NButton, { size: 'tiny', type: 'primary', onClick: () => confirmReceipt(r) }, { default: () => '代确认' }) : h('span', { style: 'color:#909399' }, '-')
  },
]

async function viewReceipts(r: NotificationItem) {
  currentNotif.value = r
  receiptVisible.value = true
  receiptPage.value = 1
  await loadReceipts()
}

async function loadReceipts() {
  if (!currentNotif.value) return
  receiptLoading.value = true
  try {
    const res = await apiGet<any>(`/notifications/${currentNotif.value.id}/receipts`, {
      page: receiptPage.value, page_size: receiptPageSize.value
    })
    receipts.value = res?.items || res?.data?.items || res || []
    receiptTotal.value = res?.total || res?.data?.total || receipts.value.length
  } finally { receiptLoading.value = false }
}

async function remindPending() {
  try {
    await apiPost(`/notifications/${currentNotif.value?.id}/remind`)
    message.success('催签通知已发送')
  } catch (e: any) { message.error(e?.message || '发送失败') }
}

async function exportReceipts() {
  try {
    await downloadFile(`/notifications/${currentNotif.value?.id}/receipts/export/xlsx`,
      `回执_${currentNotif.value?.notification_code}.xlsx`)
    message.success('已开始下载')
  } catch (e: any) { message.error(e?.message || '导出失败') }
}

async function confirmReceipt(r: ReceiptItem) {
  try {
    await apiPut(`/notifications/receipts/${r.id}/confirm`)
    message.success('已代确认')
    loadReceipts()
    reload()
  } catch (e: any) { message.error(e?.message || '操作失败') }
}

function sendReminderSms() {
  message.info(`模拟发送短信提醒给 ${pendingCount.value} 位用户`)
}

const formVisible = ref(false)
const formRef = ref<FormInst | null>(null)
const editData = ref<NotificationItem | null>(null)
const submitting = ref(false)
const scheduled = ref(false)
const uploadedFiles = ref<UploadFile[]>([])
const form = reactive<any>({
  type: 'notice', priority: 'normal', title: '', content: '',
  class_id: null, require_receipt: false, receipt_deadline: null,
  is_draft: false, scheduled_time: null, attachments: []
})

const rules: FormRules = {
  type: { required: true, message: '请选择类型', trigger: 'change' },
  title: { required: true, message: '请输入标题', trigger: 'blur' },
  content: { required: true, message: '请输入内容', trigger: 'blur' },
}

function resetForm() {
  Object.assign(form, {
    type: 'notice', priority: 'normal', title: '', content: '',
    class_id: null, require_receipt: false, receipt_deadline: null,
    is_draft: false, scheduled_time: null, attachments: []
  })
  uploadedFiles.value = []
  scheduled.value = false
}

function openCreate() { editData.value = null; resetForm(); formVisible.value = true }

function openEdit(r: NotificationItem) {
  editData.value = r
  Object.assign(form, r)
  formVisible.value = true
}

function customUpload({ file, onFinish }: UploadCustomRequestOptions) {
  message.info(`文件 ${file.name} 上传成功（模拟）`)
  form.attachments = [...(form.attachments || []), `/uploads/demo/${file.name}`]
  onFinish()
}

async function publishDraft(r: NotificationItem) {
  try {
    await apiPut(`/notifications/${r.id}/publish`)
    message.success('发布成功')
    reload()
  } catch (e: any) { message.error(e?.message || '发布失败') }
}

async function saveDraft() {
  form.is_draft = true
  await doSubmit()
}

async function submitForm() {
  form.is_draft = false
  await doSubmit()
}

async function doSubmit() {
  try { await formRef.value?.validate() } catch { return }
  submitting.value = true
  try {
    if (editData.value?.id) {
      await apiPut(`/notifications/${editData.value.id}`, form)
      message.success('更新成功')
    } else {
      await apiPost('/notifications/', form)
      message.success(form.is_draft ? '草稿已保存' : '发布成功')
    }
    formVisible.value = false
    reload()
  } finally { submitting.value = false }
}

function onDelete(r: NotificationItem) {
  dialog.warning({
    title: '确认删除',
    content: `确定删除通知「${r.title}」吗？此操作不可恢复。`,
    positiveText: '删除', negativeText: '取消',
    onPositiveClick: async () => {
      await apiDelete(`/notifications/${r.id}`)
      message.success('已删除')
      reload()
    }
  })
}

onMounted(async () => {
  await loadClasses()
  await reload()
})
</script>
