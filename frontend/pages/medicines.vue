<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">药品基础档案</h2>
      <n-space v-if="auth.isPurchaser">
        <n-button type="primary" @click="openAdd">新增药品</n-button>
      </n-space>
    </div>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="关键词">
          <n-input v-model:value="filters.keyword" placeholder="编码/名称/厂家" clearable style="width: 220px" />
        </n-form-item>
        <n-form-item label="分类">
          <n-select v-model:value="filters.category" :options="categoryOptions" clearable placeholder="全部" style="width: 140px" />
        </n-form-item>
        <n-form-item label="供应商">
          <n-select v-model:value="filters.supplier_id" :options="supplierOptions" clearable filterable placeholder="全部" style="width: 180px" />
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
        <template #action="{ row }">
          <n-button size="small" @click="openEdit(row)" v-if="auth.isPurchaser">编辑</n-button>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="modal.show" preset="card" :title="modal.isEdit ? '编辑药品' : '新增药品'" style="width: 720px">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="110px">
        <n-grid :cols="2" :x-gap="16">
          <n-form-item label="药品编码" path="code"><n-input v-model:value="form.code" :disabled="modal.isEdit" /></n-form-item>
          <n-form-item label="商品名称" path="name"><n-input v-model:value="form.name" /></n-form-item>
          <n-form-item label="通用名称" path="generic_name"><n-input v-model:value="form.generic_name" /></n-form-item>
          <n-form-item label="规格" path="specification"><n-input v-model:value="form.specification" /></n-form-item>
          <n-form-item label="剂型"><n-input v-model:value="form.dosage_form" /></n-form-item>
          <n-form-item label="生产厂家"><n-input v-model:value="form.manufacturer" /></n-form-item>
          <n-form-item label="批准文号"><n-input v-model:value="form.approval_no" /></n-form-item>
          <n-form-item label="单位"><n-input v-model:value="form.unit" /></n-form-item>
          <n-form-item label="分类">
            <n-select v-model:value="form.category" :options="categoryOptions" clearable filterable allow-create />
          </n-form-item>
          <n-form-item label="供应商">
            <n-select v-model:value="form.supplier_id" :options="supplierOptions" clearable filterable />
          </n-form-item>
          <n-form-item label="存储条件"><n-input v-model:value="form.storage_condition" /></n-form-item>
          <n-form-item label="保质期(天)"><n-input-number v-model:value="form.shelf_life_days" :min="1" style="width: 100%" /></n-form-item>
          <n-form-item label="安全库存"><n-input-number v-model:value="form.safety_stock" :min="0" style="width: 100%" /></n-form-item>
          <n-form-item label="补货点"><n-input-number v-model:value="form.reorder_point" :min="0" style="width: 100%" /></n-form-item>
          <n-form-item label="最大库存"><n-input-number v-model:value="form.max_stock" :min="0" style="width: 100%" /></n-form-item>
          <n-form-item label="状态">
            <n-switch v-model:value="form.is_active" />
          </n-form-item>
          <n-form-item label="备注" :span="2">
            <n-input v-model:value="form.remark" type="textarea" :rows="2" />
          </n-form-item>
        </n-grid>
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
  NSpace, NButton, NForm, NFormItem, NInput, NSelect, NDataTable, NModal,
  NInputNumber, NSwitch, NGrid, useMessage, useDialog
} from 'naive-ui'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const auth = useAuthStore()
const loading = ref(false); const saving = ref(false); const formRef = ref()

const filters = reactive({ keyword: '', category: null as any, supplier_id: null as any })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])
const supplierOptions = ref<any[]>([])
const categoryOptions = ref<any[]>([])

const columns = [
  { title: '编码', key: 'code', width: 100 },
  { title: '名称', key: 'name', width: 160 },
  { title: '规格', key: 'specification', width: 140 },
  { title: '剂型', key: 'dosage_form', width: 90 },
  { title: '厂家', key: 'manufacturer', width: 140, ellipsis: { tooltip: true } },
  { title: '分类', key: 'category', width: 100 },
  { title: '单位', key: 'unit', width: 70 },
  { title: '供应商', key: ['supplier', 'name'], width: 120, render: (r: any) => r.supplier?.name || '-' },
  { title: '安全库存', key: 'safety_stock', width: 90 },
  { title: '补货点', key: 'reorder_point', width: 90 },
  { title: '最大库存', key: 'max_stock', width: 90 },
  { title: '状态', key: 'is_active', width: 80, render: (r: any) => h(NTag, { type: r.is_active ? 'success' : 'default' }, () => r.is_active ? '启用' : '停用') },
  { title: '操作', key: 'action', width: 80, fixed: 'right' }
]

const modal = reactive({ show: false, isEdit: false, id: 0 })
const form = reactive({
  code: '', name: '', generic_name: '', specification: '', dosage_form: '', manufacturer: '',
  approval_no: '', unit: '盒', category: null as any, supplier_id: null as any,
  storage_condition: '', shelf_life_days: 730, safety_stock: 50, reorder_point: 100,
  max_stock: 1000, is_active: true, remark: ''
})
const rules = {
  code: { required: true, message: '请输入编码', trigger: 'blur' },
  name: { required: true, message: '请输入名称', trigger: 'blur' },
  specification: { required: true, message: '请输入规格', trigger: 'blur' }
}

import { h } from 'vue'
function resetForm() {
  Object.assign(form, {
    code: '', name: '', generic_name: '', specification: '', dosage_form: '', manufacturer: '',
    approval_no: '', unit: '盒', category: null, supplier_id: null,
    storage_condition: '', shelf_life_days: 730, safety_stock: 50, reorder_point: 100,
    max_stock: 1000, is_active: true, remark: ''
  })
}
function openAdd() { resetForm(); modal.isEdit = false; modal.id = 0; modal.show = true }
function openEdit(row: any) { Object.assign(form, row); modal.isEdit = true; modal.id = row.id; modal.show = true }
async function save() {
  try {
    await formRef.value?.validate(); saving.value = true
    if (modal.isEdit) await apiClient.put<any>(`/medicines/${modal.id}`, form)
    else await apiClient.post<any>('/medicines', form)
    message.success('保存成功'); modal.show = false; loadData()
  } catch (e: any) { message.error(e?.detail || '保存失败') }
  finally { saving.value = false }
}
async function loadMeta() {
  try {
    const [sup, dict] = await Promise.all([
      apiClient.get<any>('/suppliers', { page: 1, page_size: 500, is_active: true }),
      apiClient.get<any>('/dictionaries', { page: 1, page_size: 500, dict_type: 'category' })
    ])
    supplierOptions.value = (sup.items || []).map((x: any) => ({ label: x.name, value: x.id }))
    categoryOptions.value = (dict.items || []).map((x: any) => ({ label: x.dict_value, value: x.dict_code }))
  } catch (e) {}
}
async function loadData() {
  loading.value = true
  try {
    const res = await apiClient.get<any>('/medicines', {
      page: pagination.page, page_size: pagination.pageSize, ...filters
    })
    dataList.value = res.items || []; pagination.itemCount = res.total || 0
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
onMounted(() => { auth.init(); if (!auth.isLoggedIn) return navigateTo('/login'); loadMeta(); loadData() })
definePageMeta({ layout: 'default' })
</script>
