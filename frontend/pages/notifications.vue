<template>
  <div class="page-container">
    <n-card title="通知与回执" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-select v-model:value="filterType" clearable :options="typeOpts" placeholder="类型" style="width: 130px;" />
          <n-select v-model:value="filterClass" clearable :options="classOpts" placeholder="班级" style="width: 160px;" />
          <n-select v-model:value="isDraft" clearable :options="draftOpts" placeholder="状态" style="width: 130px;" />
          <n-button @click="reload"><template #icon><n-icon><SearchOutline /></n-icon></template>查询</n-button>
          <n-button type="primary" @click="openCreate"><template #icon><n-icon><AddOutline /></n-icon></template>发布通知</n-button>
        </n-space>
      </template>
      <n-data-table
        :columns="cols"
        :data="list"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
        @update:page="p => { page = p; reload(); }"
      />
    </n-card>
  </div>

  <n-modal v-model:show="receiptVisible" preset="card" style="width: 720px;" :title="`回执列表 - ${currentNotif?.title || ''}`">
    <template v-if="currentNotif">
      <n-descriptions :column="3" bordered size="small" label-placement="left" style="margin-bottom: 16px;">
        <n-descriptions-item label="类型"><n-tag :type="typeType(currentNotif.type)" size="small" round>{{ typeLabel(currentNotif.type) }}</n-tag></n-descriptions-item>
        <n-descriptions-item label="优先级">{{ priorityLabel(currentNotif.priority) }}</n-descriptions-item>
        <n-descriptions-item label="发布时间">{{ currentNotif.publish_time?.slice(0, 16) }}</n-descriptions-item>
        <n-descriptions-item label="回执进度" :span="3">
          <n-space vertical style="width: 100%;">
            <n-space justify="space-between"><n-text>已确认 {{ currentNotif.confirmed_receipts }} / {{ currentNotif.total_receipts }}</n-text><n-text>{{ rateText(currentNotif) }}</n-text></n-space>
            <n-progress :percentage="currentNotif.total_receipts ? currentNotif.confirmed_receipts / currentNotif.total_receipts * 100 : 0" :show-indicator="false" :height="6" />
          </n-space>
        </n-descriptions-item>
      </n-descriptions>
      <n-space style="margin-bottom: 12px;">
        <n-button size="small" type="warning" @click="remindPending"><template #icon><n-icon><MegaphoneOutline /></n-icon></template>一键催签 ({{ pendingCount }}人)</n-button>
        <n-button size="small" type="success" @click="exportReceipts"><template #icon><n-icon><DownloadOutline /></n-icon></template>导出回执</n-button>
      </n-space>
      <n-data-table
        :columns="receiptCols"
        :data="receipts"
        :loading="receiptLoading"
        :bordered="false"
        size="small"
      />
    </template>
  </n-modal>

  <n-modal v-model:show="formVisible" preset="card" style="width: 600px;" :title="editData?.id ? '编辑通知' : '发布通知'">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="90">
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item><n-form-item label="类型" path="type"><n-select v-model:value="form.type" :options="typeOpts" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="优先级"><n-select v-model:value="form.priority" :options="priorityOpts" /></n-form-item></n-grid-item>
        <n-grid-item :span="2"><n-form-item label="标题" path="title"><n-input v-model:value="form.title" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="发布范围"><n-select v-model:value="form.class_id" :options="classOpts" clearable placeholder="选班级则只发该班" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="需要回执"><n-switch v-model:value="form.require_receipt" /></n-form-item></n-grid-item>
        <n-grid-item v-if="form.require_receipt" :span="2"><n-form-item label="回执截止"><n-date-picker v-model:value="form.receipt_deadline" type="datetime" style="width: 100%;" /></n-form-item></n-grid-item>
      </n-grid>
      <n-form-item label="正文内容" path="content"><n-input v-model:value="form.content" type="textarea" :rows="5" placeholder="请输入通知内容..." /></n-form-item>
      <n-form-item label="定时发布"><n-switch v-model:value="scheduled" /><n-date-picker v-if="scheduled" v-model:value="form.scheduled_time" type="datetime" style="width: 260px; margin-left: 8px;" /></n-form-item>
      <n-form-item label="保存草稿"><n-switch v-model:value="form.is_draft" /></n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end"><n-button @click="formVisible = false">取消</n-button><n-button type="primary" :loading="submitting" @click="submitForm">{{ form.is_draft ? '保存草稿' : '立即发布' }}</n-button></n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, h } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import { SearchOutline, AddOutline, MegaphoneOutline, DownloadOutline } from '@vicons/ionicons5'
import { apiGet, apiPost, apiPut } from '~/composables/useApi'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { useMessage, NTag, NSpace, NButton } from 'naive-ui'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
appStore.setPage('通知与回执', route.path)
const message = useMessage()

const filterType = ref<string | null>(null)
const filterClass = ref<number | null>(null)
const isDraft = ref<any>(null)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const classOpts = ref<any[]>([])

const typeOpts = [
  { label: '通知', value: 'notice' },
  { label: '作业', value: 'homework' },
  { label: '提醒', value: 'reminder' },
  { label: '活动', value: 'activity' },
  { label: '紧急', value: 'emergency' },
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

function typeLabel(v: string) { return { notice: '通知', homework: '作业', reminder: '提醒', activity: '活动', emergency: '紧急' }[v] || v }
function typeType(v: string) { return { notice: 'info', homework: 'success', reminder: 'warning', activity: 'default', emergency: 'error' }[v] || 'default' }
function priorityLabel(v: string) { return { low: '低', normal: '普通', high: '高', urgent: '紧急' }[v] || v }
function rateText(n: any) { return n.total_receipts ? (n.confirmed_receipts / n.total_receipts * 100).toFixed(0) + '%' : '0%' }

const pagination = computed(() => ({ page: page.value, pageSize: pageSize.value, itemCount: total.value, showSizePicker: true, pageSizes: [20, 40, 100] }))

const cols: DataTableColumns = [
  { title: '编号', key: 'notification_code', width: 130 },
  { title: '类型', key: 'type', width: 70, render: (r: any) => h(NTag, { type: typeType(r.type), size: 'small', round: true }, { default: () => typeLabel(r.type) }) },
  { title: '优先级', key: 'priority', width: 70, render: (r: any) => priorityLabel(r.priority) },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: '班级', key: 'class_name', width: 160 },
  { title: '发布时间', key: 'publish_time', width: 130, render: (r: any) => r.publish_time?.slice(5, 16) || (r.is_draft ? h('span', { style: 'color:#f0a020;' }, '草稿') : '-') },
  { title: '回执', key: 'receipt', width: 150, render: (r: any) => r.require_receipt ? h('div', null, [
    h('span', { style: 'color:#18a058;' }, `${r.confirmed_receipts}`),
    h('span', { style: 'color:#909399;' }, `/${r.total_receipts} (${r.total_receipts ? (r.confirmed_receipts / r.total_receipts * 100).toFixed(0) : 0}%)`),
  ]) : h(NTag, { size: 'small' }, { default: () => '无需回执' }) },
  { title: '状态', key: 'is_draft', width: 80, render: (r: any) => r.is_draft ? h(NTag, { type: 'warning', size: 'small' }, { default: () => '草稿' }) : h(NTag, { type: 'success', size: 'small' }, { default: () => '已发布' }) },
  { title: '操作', key: 'ops', width: 160, fixed: 'right', render: (r: any) => h(NSpace, null, { default: () => [
    r.require_receipt ? h(NButton, { size: 'tiny', type: 'primary', onClick: () => viewReceipts(r) }, { default: () => '回执' }) : null,
    h(NButton, { size: 'tiny', quaternary: true, onClick: () => openEdit(r) }, { default: () => '编辑' }),
  ]}) },
]

const receiptCols: DataTableColumns = [
  { title: '回执人', key: 'user_name', width: 100 },
  { title: '关联学生', key: 'student_name', width: 100 },
  { title: '状态', key: 'status', width: 80, render: (r: any) => h(NTag, { type: r.status === 'confirmed' ? 'success' : r.status === 'rejected' ? 'error' : 'warning', size: 'small' }, { default: () => r.status === 'confirmed' ? '已确认' : r.status === 'rejected' ? '已拒绝' : '待签' }) },
  { title: '确认时间', key: 'confirmed_at', width: 130, render: (r: any) => r.confirmed_at?.slice(5, 16) || '-' },
  { title: '备注', key: 'remark', ellipsis: true },
  { title: '操作', key: 'ops', width: 100, render: (r: any) => r.status === 'pending' ? h(NButton, { size: 'tiny', type: 'primary', onClick: () => confirmReceipt(r) }, { default: () => '代确认' }) : h('span', { style: 'color:#909399;' }, '-') },
]

const receiptVisible = ref(false)
const currentNotif = ref<any>(null)
const receipts = ref<any[]>([])
const receiptLoading = ref(false)
const pendingCount = computed(() => receipts.value.filter(r => r.status === 'pending').length)

const formVisible = ref(false)
const editData = ref<any>(null)
const formRef = ref<FormInst>()
const submitting = ref(false)
const scheduled = ref(false)
const form = reactive<any>({
  type: 'notice', priority: 'normal', title: '', content: '', class_id: null, campus_id: null,
  target_roles: null, require_receipt: true, receipt_deadline: Date.now() + 3 * 24 * 3600 * 1000,
  scheduled_time: null, is_draft: false, attachments: [],
})
const rules: FormRules = {
  type: { required: true, type: 'string', message: '请选择类型' },
  title: { required: true, message: '请输入标题' },
  content: { required: true, message: '请输入内容' },
}

function openEdit(d: any) {
  editData.value = d
  Object.assign(form, {
    ...d,
    receipt_deadline: d.receipt_deadline ? new Date(d.receipt_deadline).getTime() : null,
    scheduled_time: d.scheduled_time ? new Date(d.scheduled_time).getTime() : null,
  })
  scheduled.value = !!d.scheduled_time
  formVisible.value = true
}
function openCreate() {
  editData.value = null
  Object.assign(form, {
    type: 'notice', priority: 'normal', title: '', content: '', class_id: null,
    campus_id: userStore.selectedCampusId, target_roles: null,
    require_receipt: true, receipt_deadline: Date.now() + 3 * 24 * 3600 * 1000,
    scheduled_time: null, is_draft: false, attachments: [],
  })
  scheduled.value = false
  formVisible.value = true
}

async function submitForm() {
  try { await formRef.value?.validate() } catch { return }
  submitting.value = true
  try {
    const payload = { ...form }
    if (!scheduled.value) payload.scheduled_time = null
    if (payload.receipt_deadline) payload.receipt_deadline = new Date(payload.receipt_deadline).toISOString()
    if (payload.scheduled_time) payload.scheduled_time = new Date(payload.scheduled_time).toISOString()
    if (editData.value?.id) {
      await apiPut(`/notifications/${editData.value.id}`, payload)
      message.success('更新成功')
    } else {
      await apiPost('/notifications', payload)
      message.success(payload.is_draft ? '草稿已保存' : '通知发布成功，已创建回执任务')
    }
    formVisible.value = false
    reload()
  } catch (e: any) { message.error(e?.data?.detail || '保存失败') }
  finally { submitting.value = false }
}

async function viewReceipts(n: any) {
  currentNotif.value = n
  receiptLoading.value = true
  receiptVisible.value = true
  try {
    const res: any = await apiGet(`/notifications/${n.id}/receipts`)
    receipts.value = Array.isArray(res) ? res : []
  } catch (e) { receipts.value = [] }
  finally { receiptLoading.value = false }
}

async function confirmReceipt(r: any) {
  try {
    await apiPost(`/notifications/${r.notification_id}/receipts/${r.id}/confirm`, {})
    message.success('已确认回执')
    if (currentNotif.value) {
      currentNotif.value.confirmed_receipts = (currentNotif.value.confirmed_receipts || 0) + 1
      viewReceipts(currentNotif.value)
    }
  } catch (e: any) { message.error(e?.data?.detail || '操作失败') }
}

function remindPending() {
  message.info(`已向 ${pendingCount.value} 位未确认用户发送催签提醒`)
}

function exportReceipts() {
  if (!currentNotif.value) return
  const url = `${useRuntimeConfig().public.apiBase}/notifications/export/receipts/${currentNotif.value.id}/xlsx`
  window.open(url, '_blank')
}

async function loadOptions() {
  try {
    const classes: any = await apiGet('/common/classes/simple', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(classes)) classOpts.value = classes.map(c => ({ label: c.name, value: c.id }))
  } catch (e) { console.warn(e) }
}

async function reload() {
  loading.value = true
  try {
    const params: any = { page, page_size: pageSize, class_id: filterClass.value, type: filterType.value }
    if (isDraft.value !== null && isDraft.value !== undefined) params.is_draft = isDraft.value === '1'
    const res: any = await apiGet('/notifications', params)
    if (Array.isArray(res)) { list.value = res; total.value = res.length }
    else { list.value = res?.items || []; total.value = res?.total || 0 }
  } catch (e) { list.value = [] }
  finally { loading.value = false }
}

watch(page, reload)
onMounted(() => {
  loadOptions()
  reload()
})
</script>
