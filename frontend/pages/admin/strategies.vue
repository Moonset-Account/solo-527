<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">提醒策略配置</h2>
      <n-space>
        <n-alert type="warning" v-if="pendingStrategy" size="small">
          策略修改后，生效时间：<b>{{ pendingStrategy.effective_from || '立即' }}</b>
          <template v-if="pendingStrategy.effective_to"> ~ 失效: {{ pendingStrategy.effective_to }}</template>
        </n-alert>
        <n-button type="primary" @click="openAdd" v-if="auth.isAdmin">
          <template #icon><n-icon><AddOutline /></n-icon></template>
          新增策略
        </n-button>
      </n-space>
    </div>

    <n-alert type="warning" show-icon style="margin-bottom: 16px">
      策略生效时间：新建或修改后，将在「生效时间」后开始影响预警计算。所有变更均保留完整历史记录。
    </n-alert>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="策略类型">
          <n-select v-model:value="filters.strategy_type" :options="typeOptions" clearable placeholder="全部" style="width: 180px" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="filters.is_active" :options="statusOptions" clearable style="width: 120px" />
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
        <template #type="{ row }">
          <n-tag :type="typeTagType(row.strategy_type)" size="small">{{ typeText(row.strategy_type) }}</n-tag>
        </template>
        <template #conditions="{ row }">
          <n-tag v-for="(v, k) in row.conditions" :key="k" size="small" style="margin: 2px">
            {{ k }}: {{ v }}
          </n-tag>
        </template>
        <template #actions_col="{ row }">
          <n-tag v-for="(v, k) in row.actions" :key="k" type="success" size="small" style="margin: 2px">
            {{ k }}: {{ JSON.stringify(v) }}
          </n-tag>
        </template>
        <template #status="{ row }">
          <n-space>
            <n-switch v-model:value="row._active" @update:value="toggle(row)" :disabled="!auth.isAdmin" />
            <n-tag :type="row.is_active ? 'success' : 'default'" size="small">
              {{ row.is_active ? '启用' : '停用' }}
            </n-tag>
          </n-space>
        </template>
        <template #effective="{ row }">
          <n-space vertical size="tiny" style="font-size: 12px">
            <div style="color: #18a058">生效: {{ row.effective_from?.slice(0, 16).replace('T', ' ') || '立即' }}</div>
            <div v-if="row.effective_to" style="color: #f0a020">失效: {{ row.effective_to?.slice(0, 16).replace('T', ' ') }}</div>
          </n-space>
        </template>
        <template #action="{ row }">
          <n-button-group size="small">
            <n-button @click="openEdit(row)" v-if="auth.isAdmin">编辑</n-button>
          </n-button-group>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="modal.show" preset="card" :title="modal.isEdit ? '编辑提醒策略' : '新增提醒策略'" style="width: 720px">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="110px">
        <n-grid :cols="2" :x-gap="16">
          <n-form-item label="策略名称" path="strategy_name" :span="1">
            <n-input v-model:value="form.strategy_name" />
          </n-form-item>
          <n-form-item label="策略类型" path="strategy_type" :span="1">
            <n-select v-model:value="form.strategy_type" :options="typeOptions" />
          </n-form-item>
          <n-form-item label="优先级" :span="1">
            <n-input-number v-model:value="form.priority" :min="0" :max="999" style="width: 100%" />
          </n-form-item>
          <n-form-item label="状态" :span="1">
            <n-switch v-model:value="form.is_active" />
          </n-form-item>
          <n-form-item label="生效时间" :span="1">
            <n-date-picker v-model:value="form.effective_from" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" clearable style="width: 100%" />
          </n-form-item>
          <n-form-item label="失效时间" :span="1">
            <n-date-picker v-model:value="form.effective_to" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" clearable style="width: 100%" />
          </n-form-item>
        </n-grid>
        <n-divider>触发条件 (JSON格式)</n-divider>
        <n-form-item label="Conditions" required>
          <n-input
            v-model:value="form.conditions_text"
            type="textarea"
            :rows="4"
            placeholder='{"days": 90, "level": "medium", "stock_min": 50}'
          />
        </n-form-item>
        <n-divider>执行动作 (JSON格式)</n-divider>
        <n-form-item label="Actions" required>
          <n-input
            v-model:value="form.actions_text"
            type="textarea"
            :rows="3"
            placeholder='{"notify": true, "email": true, "sms": false}'
          />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="form.remark" type="textarea" :rows="2" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="modal.show = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="save">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  NSpace, NButton, NIcon, NForm, NFormItem, NInput, NInputNumber, NSelect, NDataTable,
  NModal, NSwitch, NButtonGroup, NGrid, NDatePicker, NAlert, NTag, NDivider,
  useMessage, useDialog
} from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()
const loading = ref(false); const saving = ref(false); const formRef = ref()

const filters = reactive({ strategy_type: null as any, is_active: null as any })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])
const pendingStrategy = ref<any>(null)

const typeOptions = [
  { label: '近效期预警', value: 'expiry' },
  { label: '缺货风险预警', value: 'stock' },
  { label: '补货建议', value: 'replenish' },
  { label: '签收差异', value: 'sign_diff' },
  { label: '异常记录', value: 'abnormal' }
]
const statusOptions = [
  { label: '启用', value: true },
  { label: '停用', value: false }
]

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '策略名称', key: 'strategy_name', width: 180 },
  { title: '类型', key: 'type', width: 130 },
  { title: '优先级', key: 'priority', width: 80 },
  { title: '触发条件', key: 'conditions', width: 240 },
  { title: '执行动作', key: 'actions_col', width: 240 },
  { title: '状态', key: 'status', width: 120 },
  { title: '生效/失效', key: 'effective', width: 180 },
  { title: '创建人', key: 'created_by', width: 100, render: (r: any) => r.created_by || '-' },
  { title: '操作', key: 'action', width: 100, fixed: 'right' }
]

function typeTagType(t: string) {
  const m: Record<string, any> = { expiry: 'error', stock: 'warning', replenish: 'primary', sign_diff: 'info', abnormal: 'default' }
  return m[t] || 'default'
}
function typeText(t: string) {
  const m: Record<string, string> = { expiry: '近效期', stock: '缺货', replenish: '补货', sign_diff: '签收差异', abnormal: '异常' }
  return m[t] || t
}

const modal = reactive({ show: false, isEdit: false, id: 0 })
const form = reactive({
  strategy_name: '', strategy_type: null as any, priority: 0, is_active: true,
  effective_from: null as any, effective_to: null as any,
  conditions_text: '{}', actions_text: '{}', remark: ''
})
const rules = {
  strategy_name: { required: true, message: '请输入策略名称', trigger: 'blur' },
  strategy_type: { required: true, message: '请选择类型', trigger: 'change' }
}

function resetForm() {
  Object.assign(form, {
    strategy_name: '', strategy_type: null, priority: 0, is_active: true,
    effective_from: null, effective_to: null,
    conditions_text: '{}', actions_text: '{}', remark: ''
  })
}
function openAdd() { resetForm(); modal.isEdit = false; modal.id = 0; modal.show = true }
function openEdit(row: any) {
  Object.assign(form, row, {
    conditions_text: JSON.stringify(row.conditions || {}, null, 2),
    actions_text: JSON.stringify(row.actions || {}, null, 2)
  })
  pendingStrategy.value = row
  modal.isEdit = true; modal.id = row.id; modal.show = true
}
async function save() {
  try {
    await formRef.value?.validate()
    let conditions: any = {}
    let actions: any = {}
    try { conditions = JSON.parse(form.conditions_text) } catch (e) { return message.warning('Conditions JSON 格式错误') }
    try { actions = JSON.parse(form.actions_text) } catch (e) { return message.warning('Actions JSON 格式错误') }
    saving.value = true
    const payload = {
      strategy_name: form.strategy_name,
      strategy_type: form.strategy_type,
      priority: form.priority,
      is_active: form.is_active,
      effective_from: form.effective_from,
      effective_to: form.effective_to,
      conditions, actions,
      remark: form.remark
    }
    if (modal.isEdit) await apiClient.put<any>(`/strategies/${modal.id}`, payload)
    else await apiClient.post<any>('/strategies', payload)
    message.success('保存成功，请注意生效时间')
    pendingStrategy.value = payload
    modal.show = false; loadData()
  } catch (e: any) { message.error(e?.detail || '保存失败') }
  finally { saving.value = false }
}
async function toggle(row: any) {
  try {
    const res: any = await apiClient.post<any>(`/strategies/${row.id}/toggle`)
    row.is_active = res.is_active
    pendingStrategy.value = { effective_from: res.effective_from }
    message.success(`已${row.is_active ? '启用' : '停用'}，请确认生效时间`)
  } catch (e: any) { message.error(e?.detail || '操作失败') }
}
async function loadData() {
  loading.value = true
  try {
    const res = await apiClient.get<any>('/strategies', {
      page: pagination.page, page_size: pagination.pageSize, ...filters
    })
    dataList.value = (res.items || []).map((r: any) => ({ ...r, _active: r.is_active }))
    pagination.itemCount = res.total || 0
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
onMounted(() => {
  auth.init()
  if (!auth.isLoggedIn) return navigateTo('/login')
  if (!auth.canAccessAdmin) {
    message.warning('无权限访问管理中心')
    return navigateTo('/')
  }
  loadData()
})
definePageMeta({ layout: 'default' })
</script>
