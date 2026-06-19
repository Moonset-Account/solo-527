<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">字典配置管理</h2>
      <n-space>
        <n-alert type="info" v-if="changedDict" size="small">
          字典修改后，请确认生效时间：<b>{{ changedDict.effective_from || '立即' }}</b>
          <template v-if="changedDict.effective_to"> ~ {{ changedDict.effective_to }}</template>
        </n-alert>
        <n-button type="primary" @click="openAdd" v-if="auth.isAdmin">
          <template #icon><n-icon><AddOutline /></n-icon></template>
          新增字典项
        </n-button>
      </n-space>
    </div>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="字典类型">
          <n-select v-model:value="filters.dict_type" :options="typeOptions" clearable filterable allow-create placeholder="全部或自定义" style="width: 200px" />
        </n-form-item>
        <n-form-item label="关键词">
          <n-input v-model:value="filters.keyword" clearable placeholder="字典值/编码" style="width: 180px" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="filters.is_active" :options="statusOptions" clearable style="width: 120px" />
        </n-form-item>
        <n-form-item><n-button type="primary" @click="loadTypesAndData">查询</n-button></n-form-item>
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
        <template #status="{ row }">
          <n-space vertical size="small">
            <n-tag :type="row.is_active ? 'success' : 'default'" size="small">
              {{ row.is_active ? '启用' : '停用' }}
            </n-tag>
          </n-space>
        </template>
        <template #effective="{ row }">
          <n-space vertical size="tiny" style="font-size: 12px">
            <div>生效: {{ row.effective_from?.slice(0, 16).replace('T', ' ') || '立即' }}</div>
            <div v-if="row.effective_to" style="color: #f0a020">
              失效: {{ row.effective_to?.slice(0, 16).replace('T', ' ') }}
            </div>
          </n-space>
        </template>
        <template #action="{ row }">
          <n-button-group size="small">
            <n-button @click="openEdit(row)" v-if="auth.isAdmin">编辑</n-button>
            <n-button type="error" @click="doDelete(row)" v-if="auth.isAdmin">删除</n-button>
          </n-button-group>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="modal.show" preset="card" :title="modal.isEdit ? '编辑字典项' : '新增字典项'" style="width: 600px">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="100px">
        <n-grid :cols="2" :x-gap="16">
          <n-form-item label="字典类型" path="dict_type" :span="1">
            <n-select v-model:value="form.dict_type" :options="typeOptions" filterable allow-create clearable />
          </n-form-item>
          <n-form-item label="字典编码" path="dict_code" :span="1">
            <n-input v-model:value="form.dict_code" :disabled="modal.isEdit" />
          </n-form-item>
          <n-form-item label="字典值" path="dict_value" :span="2">
            <n-input v-model:value="form.dict_value" />
          </n-form-item>
          <n-form-item label="上级字典" :span="1">
            <n-select v-model:value="form.parent_id" :options="parentOptions" clearable filterable />
          </n-form-item>
          <n-form-item label="排序" :span="1">
            <n-input-number v-model:value="form.sort_order" :min="0" style="width: 100%" />
          </n-form-item>
          <n-form-item label="状态" :span="1">
            <n-switch v-model:value="form.is_active" />
          </n-form-item>
          <n-form-item label="创建人" :span="1">
            <span style="color: #86909c">{{ auth.user?.full_name }}</span>
          </n-form-item>
          <n-form-item label="生效时间" :span="1">
            <n-date-picker v-model:value="form.effective_from" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" clearable style="width: 100%" />
          </n-form-item>
          <n-form-item label="失效时间" :span="1">
            <n-date-picker v-model:value="form.effective_to" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" clearable style="width: 100%" />
          </n-form-item>
          <n-form-item label="备注" :span="2">
            <n-input v-model:value="form.remark" type="textarea" :rows="2" />
          </n-form-item>
        </n-grid>
      </n-form>
      <n-alert type="warning" v-if="modal.isEdit" show-icon style="margin-top: 16px">
        修改字典后请注意查看生效时间，数据变更会在生效时间后影响系统引用。
      </n-alert>
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
import { ref, reactive, onMounted, watch } from 'vue'
import {
  NSpace, NButton, NIcon, NForm, NFormItem, NInput, NInputNumber, NSelect, NDataTable,
  NModal, NButtonGroup, NSwitch, NGrid, NDatePicker, NAlert, useMessage, useDialog
} from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()
const loading = ref(false); const saving = ref(false); const formRef = ref()

const filters = reactive({ dict_type: null as any, keyword: '', is_active: null as any })
const pagination = reactive({ page: 1, pageSize: 50, itemCount: 0 })
const dataList = ref<any[]>([])
const typeOptions = ref<any[]>([])
const parentOptions = ref<any[]>([])
const changedDict = ref<any>(null)

const statusOptions = [
  { label: '启用', value: true },
  { label: '停用', value: false }
]

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '字典类型', key: 'dict_type', width: 140 },
  { title: '字典编码', key: 'dict_code', width: 140 },
  { title: '字典值', key: 'dict_value', width: 200 },
  { title: '排序', key: 'sort_order', width: 80 },
  { title: '父级ID', key: 'parent_id', width: 80, render: (r: any) => r.parent_id || '-' },
  { title: '状态', key: 'status', width: 90 },
  { title: '生效/失效', key: 'effective', width: 180 },
  { title: '创建人', key: 'created_by', width: 100, render: (r: any) => r.created_by || '-' },
  { title: '操作', key: 'action', width: 140, fixed: 'right' }
]

const modal = reactive({ show: false, isEdit: false, id: 0 })
const form = reactive({
  dict_type: '', dict_code: '', dict_value: '', sort_order: 0,
  parent_id: null as any, is_active: true,
  effective_from: null as any, effective_to: null as any,
  remark: ''
})
const rules = {
  dict_type: { required: true, message: '请输入类型', trigger: 'blur' },
  dict_code: { required: true, message: '请输入编码', trigger: 'blur' },
  dict_value: { required: true, message: '请输入值', trigger: 'blur' }
}

watch(() => [form.effective_from, form.effective_to], () => {
  if (form.effective_from || form.effective_to) changedDict.value = form
}, { deep: true })

function resetForm() {
  Object.assign(form, {
    dict_type: '', dict_code: '', dict_value: '', sort_order: 0,
    parent_id: null, is_active: true, effective_from: null, effective_to: null, remark: ''
  })
}
function openAdd() { resetForm(); modal.isEdit = false; modal.id = 0; modal.show = true }
function openEdit(row: any) {
  Object.assign(form, row)
  changedDict.value = row
  modal.isEdit = true; modal.id = row.id; modal.show = true
}
async function save() {
  try {
    await formRef.value?.validate(); saving.value = true
    if (modal.isEdit) await apiClient.put<any>(`/dictionaries/${modal.id}`, form)
    else await apiClient.post<any>('/dictionaries', form)
    message.success('保存成功，请确认生效时间')
    modal.show = false; changedDict.value = { ...form }; loadTypesAndData()
  } catch (e: any) { message.error(e?.detail || '保存失败') }
  finally { saving.value = false }
}
function doDelete(row: any) {
  dialog.warning({
    title: '删除确认',
    content: `确定要删除字典项「${row.dict_value}」吗？可能会影响系统引用。`,
    positiveText: '确认', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await apiClient.delete<any>(`/dictionaries/${row.id}`)
        message.success('已删除'); loadTypesAndData()
      } catch (e: any) { message.error(e?.detail || '删除失败') }
    }
  })
}
async function loadTypes() {
  try {
    const [types, list] = await Promise.all([
      apiClient.get<any>('/dictionaries/types'),
      apiClient.get<any>('/dictionaries', { page: 1, page_size: 500 })
    ])
    typeOptions.value = (types || []).map((t: string) => ({ label: t, value: t }))
    parentOptions.value = (list.items || []).map((x: any) => ({
      label: `${x.dict_type}/${x.dict_value}`, value: x.id
    }))
  } catch (e) {}
}
async function loadData() {
  loading.value = true
  try {
    const res = await apiClient.get<any>('/dictionaries', {
      page: pagination.page, page_size: pagination.pageSize, ...filters
    })
    dataList.value = res.items || []; pagination.itemCount = res.total || 0
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
async function loadTypesAndData() { await loadTypes(); loadData() }
onMounted(() => {
  auth.init()
  if (!auth.isLoggedIn) return navigateTo('/login')
  if (!auth.isAdmin) {
    message.warning('仅管理员可管理字典')
  }
  loadTypesAndData()
})
definePageMeta({ layout: 'default' })
</script>
