<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">批次异常记录</h2>
      <n-space v-if="auth.isWarehouse || auth.isManager">
        <n-button type="primary" @click="openAdd">登记异常</n-button>
      </n-space>
    </div>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="状态">
          <n-select v-model:value="filters.status" :options="statusOptions" clearable placeholder="全部" style="width: 140px" />
        </n-form-item>
        <n-form-item label="严重程度">
          <n-select v-model:value="filters.severity" :options="levelOptions" clearable placeholder="全部" style="width: 120px" />
        </n-form-item>
        <n-form-item label="异常类型">
          <n-select v-model:value="filters.abnormal_type" :options="typeOptions" clearable filterable allow-create placeholder="全部" style="width: 160px" />
        </n-form-item>
        <n-form-item><n-button type="primary" @click="loadData">查询</n-button></n-form-item>
      </n-form>
    </div>

    <div class="content-area">
      <n-data-table
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        @update:page="p => { pagination.page = p; loadData() }"
        @update:page-size="s => { pagination.pageSize = s; pagination.page = 1; loadData() }"
        bordered striped
      >
        <template #severity="{ row }">
          <n-tag :type="levelTagType(row.severity)" size="small" :bordered="false" :class="'tag-' + row.severity">
            {{ levelText(row.severity) }}
          </n-tag>
        </template>
        <template #status="{ row }">
          <n-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</n-tag>
        </template>
        <template #duration="{ row }">
          <span v-if="row.handle_duration_minutes" class="medium">{{ formatDuration(row.handle_duration_minutes) }}</span>
          <span v-else style="color: #d03050">未处理</span>
        </template>
        <template #action="{ row }">
          <n-button-group size="small">
            <n-button type="primary" @click="openHandle(row)" v-if="['open', 'processing'].includes(row.status) && auth.isManager">
              处理
            </n-button>
            <n-button @click="viewDetail(row)">详情</n-button>
          </n-button-group>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="addModal.show" preset="card" title="登记异常" style="width: 560px">
      <n-form ref="addFormRef" :model="addForm" :rules="addRules" label-placement="left" label-width="100px">
        <n-form-item label="异常类型" path="abnormal_type">
          <n-select v-model:value="addForm.abnormal_type" :options="typeOptions" filterable allow-create clearable />
        </n-form-item>
        <n-form-item label="关联批次">
          <n-select v-model:value="addForm.batch_id" :options="batchOptions" filterable clearable />
        </n-form-item>
        <n-form-item label="关联药品">
          <n-select v-model:value="addForm.medicine_id" :options="medicineOptions" filterable clearable />
        </n-form-item>
        <n-form-item label="严重程度" path="severity">
          <n-select v-model:value="addForm.severity" :options="levelOptions" />
        </n-form-item>
        <n-form-item label="异常描述" path="description">
          <n-input v-model:value="addForm.description" type="textarea" :rows="4" placeholder="详细描述异常情况" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="addModal.show = false">取消</n-button>
          <n-button type="primary" :loading="adding" @click="confirmAdd">提交</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="handleModal.show" preset="card" title="处理异常" style="width: 560px">
      <n-descriptions v-if="handleModal.row" bordered :column="1" label-placement="left" size="small" style="margin-bottom: 16px">
        <n-descriptions-item label="异常类型">{{ handleModal.row.abnormal_type }}</n-descriptions-item>
        <n-descriptions-item label="描述">{{ handleModal.row.description }}</n-descriptions-item>
      </n-descriptions>
      <n-form :model="handleForm" label-placement="left" label-width="100px">
        <n-form-item label="处理状态">
          <n-select v-model:value="handleForm.status" :options="handleStatusOptions" />
        </n-form-item>
        <n-form-item label="处理方案" required>
          <n-input v-model:value="handleForm.handle_solution" type="textarea" :rows="4" placeholder="填写处理方案和结果" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="handleModal.show = false">取消</n-button>
          <n-button type="primary" :loading="handling" @click="confirmHandle">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  NSpace, NButton, NForm, NFormItem, NInput, NSelect, NDataTable, NModal,
  NTag, NButtonGroup, NDescriptions, NDescriptionsItem, useMessage, useDialog
} from 'naive-ui'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()
const loading = ref(false); const adding = ref(false); const handling = ref(false)
const addFormRef = ref()

const filters = reactive({ status: null as any, severity: null as any, abnormal_type: null as any })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])
const batchOptions = ref<any[]>([])
const medicineOptions = ref<any[]>([])

const statusOptions = [
  { label: '打开', value: 'open' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
  { label: '已关闭', value: 'closed' }
]
const levelOptions = [
  { label: '紧急', value: 'critical' },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]
const typeOptions = [
  { label: '效期异常', value: 'expiry_risk' },
  { label: '破损异常', value: 'damaged' },
  { label: '数量异常', value: 'quantity_diff' },
  { label: '温度异常', value: 'temperature' },
  { label: '其他', value: 'other' }
]
const handleStatusOptions = [
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
  { label: '已关闭', value: 'closed' }
]

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '类型', key: 'abnormal_type', width: 120 },
  { title: '严重程度', key: 'severity', width: 100 },
  { title: '批次号', key: 'batch', width: 140, render: (r: any) => r.batch?.batch_no || '-' },
  { title: '药品', key: 'med', width: 160, render: (r: any) => r.medicine?.name || r.batch?.medicine?.name || '-' },
  { title: '异常描述', key: 'description', width: 200, ellipsis: { tooltip: true } },
  { title: '状态', key: 'status', width: 90 },
  { title: '发现人', key: 'founder', width: 100, render: (r: any) => r.founder?.full_name || '-' },
  { title: '发现时间', key: 'found_at', width: 160, render: (r: any) => r.found_at?.slice(0, 16).replace('T', ' ') },
  { title: '处理人', key: 'handler', width: 100, render: (r: any) => r.handler?.full_name || '-' },
  { title: '办理时长', key: 'duration', width: 120 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' }
]

function levelTagType(level: string) {
  const m: Record<string, any> = { critical: 'error', high: 'warning', medium: 'info', low: 'success' }
  return m[level] || 'default'
}
function levelText(level: string) {
  const m: Record<string, string> = { critical: '紧急', high: '高', medium: '中', low: '低' }
  return m[level] || level
}
function statusTagType(s: string) {
  const m: Record<string, any> = { open: 'error', processing: 'warning', resolved: 'success', closed: 'default' }
  return m[s] || 'default'
}
function statusText(s: string) {
  const m: Record<string, string> = { open: '打开', processing: '处理中', resolved: '已解决', closed: '已关闭' }
  return m[s] || s
}
function formatDuration(mins: number) {
  if (mins < 60) return `${mins} 分钟`
  const h = Math.floor(mins / 60); const m = mins % 60
  if (h < 24) return `${h}h ${m}m`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

const addModal = reactive({ show: false })
const addForm = reactive({
  abnormal_type: null as any, batch_id: null as any, medicine_id: null as any,
  severity: 'medium', description: ''
})
const addRules = {
  abnormal_type: { required: true, message: '请选择类型', trigger: 'change' },
  severity: { required: true, message: '请选择程度', trigger: 'change' },
  description: { required: true, message: '请填写描述', trigger: 'blur' }
}
function openAdd() {
  Object.assign(addForm, {
    abnormal_type: null, batch_id: null, medicine_id: null, severity: 'medium', description: ''
  }); addModal.show = true
}
async function confirmAdd() {
  try {
    await addFormRef.value?.validate(); adding.value = true
    await apiClient.post<any>('/abnormal', addForm)
    message.success('已登记'); addModal.show = false; loadData()
  } catch (e: any) { message.error(e?.detail || '提交失败') }
  finally { adding.value = false }
}

const handleModal = reactive({ show: false, row: null as any })
const handleForm = reactive({ status: 'resolved' as any, handle_solution: '' })
function openHandle(row: any) {
  handleModal.row = row; handleForm.status = 'resolved'; handleForm.handle_solution = ''
  handleModal.show = true
}
function viewDetail(row: any) {
  dialog.info({
    title: `异常详情 #${row.id}`,
    content: `类型: ${row.abnormal_type}\n严重程度: ${levelText(row.severity)}\n描述: ${row.description}\n处理方案: ${row.handle_solution || '无'}`,
    positiveText: '关闭'
  })
}
async function confirmHandle() {
  if (!handleForm.handle_solution.trim()) return message.warning('请填写处理方案')
  try {
    handling.value = true
    await apiClient.post<any>(`/abnormal/${handleModal.row.id}/handle`, handleForm)
    message.success('处理成功'); handleModal.show = false; loadData()
  } catch (e: any) { message.error(e?.detail || '操作失败') }
  finally { handling.value = false }
}

async function loadMeta() {
  try {
    const [bats, meds] = await Promise.all([
      apiClient.get<any>('/batches', { page: 1, page_size: 500 }),
      apiClient.get<any>('/medicines', { page: 1, page_size: 500 })
    ])
    batchOptions.value = (bats.items || []).map((x: any) => ({ label: `${x.batch_no} ${x.medicine?.name || ''}`, value: x.id }))
    medicineOptions.value = (meds.items || []).map((x: any) => ({ label: `${x.name} ${x.specification}`, value: x.id }))
  } catch (e) {}
}
async function loadData() {
  loading.value = true
  try {
    const res = await apiClient.get<any>('/abnormal', {
      page: pagination.page, page_size: pagination.pageSize, ...filters
    })
    dataList.value = res.items || []; pagination.itemCount = res.total || 0
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
onMounted(() => { auth.init(); if (!auth.isLoggedIn) return navigateTo('/login'); loadMeta(); loadData() })
definePageMeta({ layout: 'default' })
</script>
