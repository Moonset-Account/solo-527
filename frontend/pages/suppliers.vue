<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">供应商档案管理</h2>
      <n-space v-if="auth.isPurchaser">
        <n-button type="primary" @click="openAdd">
          <template #icon><n-icon><AddOutline /></n-icon></template>
          新增供应商
        </n-button>
      </n-space>
    </div>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="关键词">
          <n-input v-model:value="filters.keyword" placeholder="编码/名称/联系人" clearable style="width: 220px" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="filters.is_active" :options="statusOptions" clearable placeholder="全部" style="width: 120px" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="loadData">查询</n-button>
        </n-form-item>
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
        bordered
        striped
      >
        <template #status="{ row }">
          <n-tag :type="row.is_active ? 'success' : 'default'" size="small">
            {{ row.is_active ? '启用' : '停用' }}
          </n-tag>
        </template>
        <template #rating="{ row }">
          <n-space>{{ row.rating }} <n-rate :value="row.rating" readonly size="small" /></n-space>
        </template>
        <template #action="{ row }">
          <n-button-group size="small">
            <n-button @click="openEdit(row)" v-if="auth.isPurchaser">编辑</n-button>
            <n-button type="error" @click="doDelete(row)" v-if="auth.isAdmin">删除</n-button>
          </n-button-group>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="modal.show" preset="card" :title="modal.isEdit ? '编辑供应商' : '新增供应商'" style="width: 640px">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="100">
        <n-grid :cols="2" :x-gap="16">
          <n-form-item label="编码" path="code" :span="1">
            <n-input v-model:value="form.code" :disabled="modal.isEdit" />
          </n-form-item>
          <n-form-item label="名称" path="name" :span="1">
            <n-input v-model:value="form.name" />
          </n-form-item>
          <n-form-item label="许可证号" :span="1">
            <n-input v-model:value="form.license_no" />
          </n-form-item>
          <n-form-item label="税号" :span="1">
            <n-input v-model:value="form.tax_no" />
          </n-form-item>
          <n-form-item label="联系人" :span="1">
            <n-input v-model:value="form.contact_person" />
          </n-form-item>
          <n-form-item label="联系电话" :span="1">
            <n-input v-model:value="form.contact_phone" />
          </n-form-item>
          <n-form-item label="邮箱" :span="1">
            <n-input v-model:value="form.contact_email" />
          </n-form-item>
          <n-form-item label="评级" :span="1">
            <n-rate v-model:value="form.rating" />
          </n-form-item>
          <n-form-item label="地址" :span="2">
            <n-input v-model:value="form.address" type="textarea" :rows="2" />
          </n-form-item>
          <n-form-item label="银行信息" :span="2">
            <n-input v-model:value="form.bank_info" type="textarea" :rows="2" />
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
import { ref, reactive, onMounted, h } from 'vue'
import {
  NSpace, NButton, NIcon, NForm, NFormItem, NInput, NSelect, NTag, NDataTable,
  NModal, NButtonGroup, NRate, NGrid, useMessage, useDialog
} from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const formRef = ref()

const filters = reactive({ keyword: '', is_active: null as any })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])
const statusOptions = [
  { label: '启用', value: true },
  { label: '停用', value: false }
]

const columns = [
  { title: '编码', key: 'code', width: 120 },
  { title: '名称', key: 'name', width: 200 },
  { title: '许可证号', key: 'license_no', width: 140 },
  { title: '联系人', key: 'contact_person', width: 100 },
  { title: '电话', key: 'contact_phone', width: 130 },
  { title: '评级', key: 'rating', width: 140 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', key: 'created_at', width: 160, render: (r: any) => r.created_at?.slice(0, 16).replace('T', ' ') },
  { title: '操作', key: 'action', width: 140, fixed: 'right' }
]

const modal = reactive({ show: false, isEdit: false, id: 0 })
const form = reactive({
  code: '', name: '', license_no: '', tax_no: '', contact_person: '',
  contact_phone: '', contact_email: '', address: '', bank_info: '',
  rating: 3, remark: ''
})
const rules = {
  code: { required: true, message: '请输入编码', trigger: 'blur' },
  name: { required: true, message: '请输入名称', trigger: 'blur' }
}

function resetForm() {
  Object.assign(form, {
    code: '', name: '', license_no: '', tax_no: '', contact_person: '',
    contact_phone: '', contact_email: '', address: '', bank_info: '',
    rating: 3, remark: ''
  })
}
function openAdd() { resetForm(); modal.isEdit = false; modal.id = 0; modal.show = true }
function openEdit(row: any) {
  Object.assign(form, row)
  modal.isEdit = true; modal.id = row.id; modal.show = true
}
async function save() {
  try {
    await formRef.value?.validate()
    saving.value = true
    if (modal.isEdit) await apiClient.put<any>(`/suppliers/${modal.id}`, form)
    else await apiClient.post<any>('/suppliers', form)
    message.success('保存成功')
    modal.show = false; loadData()
  } catch (e: any) { message.error(e?.detail || '保存失败') }
  finally { saving.value = false }
}
function doDelete(row: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除供应商「${row.name}」吗？关联药品将无法删除。`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await apiClient.delete<any>(`/suppliers/${row.id}`)
        message.success('操作成功'); loadData()
      } catch (e: any) { message.error(e?.detail || '操作失败') }
    }
  })
}
async function loadData() {
  loading.value = true
  try {
    const res = await apiClient.get<any>('/suppliers', {
      page: pagination.page, page_size: pagination.pageSize, ...filters
    })
    dataList.value = res.items || []
    pagination.itemCount = res.total || 0
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
onMounted(() => { auth.init(); if (!auth.isLoggedIn) return navigateTo('/login'); loadData() })
definePageMeta({ layout: 'default' })
</script>
