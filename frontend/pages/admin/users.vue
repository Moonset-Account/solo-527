<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">系统用户管理</h2>
      <n-button type="primary" @click="openAdd" v-if="auth.isAdmin">新增用户</n-button>
    </div>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="关键词">
          <n-input v-model:value="filters.keyword" clearable placeholder="用户名/姓名/邮箱" style="width: 220px" />
        </n-form-item>
        <n-form-item label="角色">
          <n-select v-model:value="filters.role" :options="roleOptions" clearable style="width: 140px" />
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
        <template #role="{ row }">
          <n-tag :type="roleTagType(row.role)" size="small">{{ roleText(row.role) }}</n-tag>
        </template>
        <template #status="{ row }">
          <n-tag :type="row.is_active ? 'success' : 'default'" size="small">
            {{ row.is_active ? '启用' : '停用' }}
          </n-tag>
        </template>
        <template #action="{ row }">
          <n-button-group size="small">
            <n-button @click="openEdit(row)" v-if="auth.isAdmin">编辑</n-button>
            <n-button type="error" @click="toggleStatus(row)" v-if="auth.isAdmin && row.username !== 'admin'">
              {{ row.is_active ? '停用' : '启用' }}
            </n-button>
          </n-button-group>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="modal.show" preset="card" :title="modal.isEdit ? '编辑用户' : '新增用户'" style="width: 560px">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="100px">
        <n-grid :cols="2" :x-gap="16">
          <n-form-item label="用户名" path="username">
            <n-input v-model:value="form.username" :disabled="modal.isEdit" />
          </n-form-item>
          <n-form-item :label="modal.isEdit ? '新密码(留空不修改)' : '密码'" path="password">
            <n-input v-model:value="form.password" type="password" show-password-on="click" />
          </n-form-item>
          <n-form-item label="姓名" path="full_name">
            <n-input v-model:value="form.full_name" />
          </n-form-item>
          <n-form-item label="邮箱">
            <n-input v-model:value="form.email" />
          </n-form-item>
          <n-form-item label="手机">
            <n-input v-model:value="form.phone" />
          </n-form-item>
          <n-form-item label="角色" path="role">
            <n-select v-model:value="form.role" :options="roleOptions" />
          </n-form-item>
          <n-form-item label="部门">
            <n-input v-model:value="form.department" />
          </n-form-item>
          <n-form-item label="状态">
            <n-switch v-model:value="form.is_active" />
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
  NSwitch, NButtonGroup, NTag, NGrid, useMessage, useDialog
} from 'naive-ui'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()
const loading = ref(false); const saving = ref(false); const formRef = ref()

const filters = reactive({ keyword: '', role: null as any, is_active: null as any })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])

const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '经理', value: 'manager' },
  { label: '采购员', value: 'purchaser' },
  { label: '库管员', value: 'warehouse' },
  { label: '访客', value: 'viewer' }
]
const statusOptions = [
  { label: '启用', value: true },
  { label: '停用', value: false }
]

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '用户名', key: 'username', width: 120 },
  { title: '姓名', key: 'full_name', width: 120 },
  { title: '角色', key: 'role', width: 100 },
  { title: '部门', key: 'department', width: 120 },
  { title: '邮箱', key: 'email', width: 180 },
  { title: '手机', key: 'phone', width: 130 },
  { title: '状态', key: 'status', width: 90 },
  { title: '创建时间', key: 'created_at', width: 160, render: (r: any) => r.created_at?.slice(0, 16).replace('T', ' ') },
  { title: '操作', key: 'action', width: 160, fixed: 'right' }
]

function roleTagType(r: string) {
  const m: Record<string, any> = { admin: 'error', manager: 'warning', purchaser: 'success', warehouse: 'info', viewer: 'default' }
  return m[r] || 'default'
}
function roleText(r: string) {
  const m: Record<string, string> = { admin: '管理员', manager: '经理', purchaser: '采购员', warehouse: '库管员', viewer: '访客' }
  return m[r] || r
}

const modal = reactive({ show: false, isEdit: false, id: 0 })
const form = reactive({
  username: '', password: '', full_name: '', email: '', phone: '',
  role: 'purchaser' as any, department: '', is_active: true
})
const rules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  full_name: { required: true, message: '请输入姓名', trigger: 'blur' },
  password: {
    validator: (rule: any, value: string) => {
      if (!modal.isEdit && !value) return new Error('请输入密码')
      if (value && value.length < 6) return new Error('密码至少6位')
      return true
    },
    trigger: 'blur'
  },
  role: { required: true, message: '请选择角色', trigger: 'change' }
}

function resetForm() {
  Object.assign(form, {
    username: '', password: '', full_name: '', email: '', phone: '',
    role: 'purchaser', department: '', is_active: true
  })
}
function openAdd() { resetForm(); modal.isEdit = false; modal.id = 0; modal.show = true }
function openEdit(row: any) {
  Object.assign(form, { ...row, password: '' })
  modal.isEdit = true; modal.id = row.id; modal.show = true
}
async function save() {
  try {
    await formRef.value?.validate(); saving.value = true
    if (modal.isEdit) {
      const payload: any = { ...form }
      if (!form.password) delete payload.password
      await apiClient.put<any>(`/users/${modal.id}`, payload)
    } else {
      await apiClient.post<any>('/auth/register', form)
    }
    message.success('保存成功'); modal.show = false; loadData()
  } catch (e: any) { message.error(e?.detail || '保存失败') }
  finally { saving.value = false }
}
function toggleStatus(row: any) {
  dialog.warning({
    title: '确认',
    content: `确定要${row.is_active ? '停用' : '启用'}用户「${row.full_name}」吗？`,
    positiveText: '确认', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await apiClient.put<any>(`/users/${row.id}`, { is_active: !row.is_active })
        message.success('状态已更新'); loadData()
      } catch (e: any) { message.error(e?.detail || '操作失败') }
    }
  })
}
async function loadData() {
  loading.value = true
  try {
    const res = await apiClient.get<any>('/users', {
      page: pagination.page, page_size: pagination.pageSize, ...filters
    })
    dataList.value = res.items || []; pagination.itemCount = res.total || 0
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
onMounted(() => {
  auth.init()
  if (!auth.isLoggedIn) return navigateTo('/login')
  if (!auth.isAdmin) {
    message.warning('仅管理员可管理用户')
  }
  loadData()
})
definePageMeta({ layout: 'default' })
</script>
