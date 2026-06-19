<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">仓库库位管理</h2>
      <n-space v-if="auth.isWarehouse">
        <n-button type="primary" @click="openAdd">新增库位</n-button>
      </n-space>
    </div>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="关键词">
          <n-input v-model:value="filters.keyword" placeholder="编码/名称" clearable style="width: 200px" />
        </n-form-item>
        <n-form-item label="库区">
          <n-select v-model:value="filters.zone" :options="zoneOptions" clearable filterable allow-create placeholder="全部" style="width: 140px" />
        </n-form-item>
        <n-form-item label="温区">
          <n-select v-model:value="filters.temperature_zone" :options="tempOptions" clearable placeholder="全部" style="width: 140px" />
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
          <n-button size="small" @click="openEdit(row)" v-if="auth.isWarehouse">编辑</n-button>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="modal.show" preset="card" :title="modal.isEdit ? '编辑库位' : '新增库位'" style="width: 600px">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="100px">
        <n-grid :cols="2" :x-gap="16">
          <n-form-item label="库位编码" path="code"><n-input v-model:value="form.code" :disabled="modal.isEdit" /></n-form-item>
          <n-form-item label="库位名称" path="name"><n-input v-model:value="form.name" /></n-form-item>
          <n-form-item label="库区"><n-input v-model:value="form.zone" /></n-form-item>
          <n-form-item label="区域"><n-input v-model:value="form.area" /></n-form-item>
          <n-form-item label="排"><n-input v-model:value="form.row" /></n-form-item>
          <n-form-item label="列"><n-input v-model:value="form.column" /></n-form-item>
          <n-form-item label="层"><n-input v-model:value="form.level" /></n-form-item>
          <n-form-item label="温区">
            <n-select v-model:value="form.temperature_zone" :options="tempOptions" clearable filterable allow-create />
          </n-form-item>
          <n-form-item label="最大容量">
            <n-input-number v-model:value="form.max_capacity" :min="0" style="width: 100%" />
          </n-form-item>
          <n-form-item label="状态"><n-switch v-model:value="form.is_active" /></n-form-item>
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
  NInputNumber, NSwitch, NGrid, useMessage
} from 'naive-ui'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const auth = useAuthStore()
const loading = ref(false); const saving = ref(false); const formRef = ref()

const filters = reactive({ keyword: '', zone: null as any, temperature_zone: null as any })
const pagination = reactive({ page: 1, pageSize: 50, itemCount: 0 })
const dataList = ref<any[]>([])
const zoneOptions = ref<any[]>([])
const tempOptions = ref<any[]>([
  { label: '常温区', value: 'normal' },
  { label: '阴凉区', value: 'cool' },
  { label: '冷藏区', value: 'cold' },
  { label: '冷冻区', value: 'frozen' }
])

const columns = [
  { title: '编码', key: 'code', width: 120 },
  { title: '名称', key: 'name', width: 180 },
  { title: '库区', key: 'zone', width: 100 },
  { title: '区域', key: 'area', width: 100 },
  { title: '排/列/层', key: 'pos', width: 120, render: (r: any) => `${r.row || '-'}-${r.column || '-'}-${r.level || '-'}` },
  { title: '温区', key: 'temperature_zone', width: 100 },
  { title: '最大容量', key: 'max_capacity', width: 100 },
  { title: '状态', key: 'is_active', width: 80, render: (r: any) => h(NTag, { type: r.is_active ? 'success' : 'default' }, () => r.is_active ? '启用' : '停用') },
  { title: '操作', key: 'action', width: 80, fixed: 'right' }
]

const modal = reactive({ show: false, isEdit: false, id: 0 })
const form = reactive({
  code: '', name: '', zone: '', area: '', row: '', column: '', level: '',
  temperature_zone: null as any, max_capacity: 1000, is_active: true, remark: ''
})
const rules = {
  code: { required: true, message: '请输入编码', trigger: 'blur' },
  name: { required: true, message: '请输入名称', trigger: 'blur' }
}

import { h } from 'vue'
import { NTag } from 'naive-ui'

function resetForm() {
  Object.assign(form, {
    code: '', name: '', zone: '', area: '', row: '', column: '', level: '',
    temperature_zone: null, max_capacity: 1000, is_active: true, remark: ''
  })
}
function openAdd() { resetForm(); modal.isEdit = false; modal.id = 0; modal.show = true }
function openEdit(row: any) { Object.assign(form, row); modal.isEdit = true; modal.id = row.id; modal.show = true }
async function save() {
  try {
    await formRef.value?.validate(); saving.value = true
    if (modal.isEdit) await apiClient.put<any>(`/locations/${modal.id}`, form)
    else await apiClient.post<any>('/locations', form)
    message.success('保存成功'); modal.show = false; loadData()
  } catch (e: any) { message.error(e?.detail || '保存失败') }
  finally { saving.value = false }
}
async function loadData() {
  loading.value = true
  try {
    const res = await apiClient.get<any>('/locations', {
      page: pagination.page, page_size: pagination.pageSize, ...filters
    })
    dataList.value = res.items || []; pagination.itemCount = res.total || 0
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
onMounted(() => { auth.init(); if (!auth.isLoggedIn) return navigateTo('/login'); loadData() })
definePageMeta({ layout: 'default' })
</script>
