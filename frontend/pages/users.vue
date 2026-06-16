<template>
  <div>
    <n-page-header title="用户管理" subtitle="管理系统用户和权限">
      <template #extra>
        <n-button type="primary" @click="showCreateModal = true">
          <template #icon><PlusOutlined /></template>
          新增用户
        </n-button>
      </template>
    </n-page-header>

    <n-card class="mt-4">
      <n-space class="mb-4">
        <n-input
          v-model:value="keyword"
          placeholder="搜索用户名/姓名/邮箱"
          style="width: 240px"
          clearable
        />
        <n-select
          v-model:value="filterRole"
          placeholder="角色筛选"
          :options="roleOptions"
          style="width: 160px"
          clearable
        />
        <n-button @click="loadData">
          <template #icon><SearchOutlined /></template>
          搜索
        </n-button>
      </n-space>

      <n-data-table
        :columns="columns"
        :data="users"
        :loading="loading"
        :bordered="false"
      />
    </n-card>

    <n-modal v-model:show="showCreateModal" preset="card" :title="isEdit ? '编辑用户' : '新增用户'" style="width: 500px">
      <n-form :model="formData" label-placement="top">
        <n-form-item label="用户名" required>
          <n-input v-model:value="formData.username" placeholder="请输入用户名" :disabled="isEdit" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="16">
          <n-grid-item>
            <n-form-item label="邮箱" required>
              <n-input v-model:value="formData.email" placeholder="请输入邮箱" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="密码" v-if="!isEdit" required>
              <n-input v-model:value="formData.password" type="password" show-password-on="click" placeholder="请输入密码" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="16">
          <n-grid-item>
            <n-form-item label="姓名">
              <n-input v-model:value="formData.full_name" placeholder="请输入姓名" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="部门">
              <n-input v-model:value="formData.department" placeholder="请输入部门" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="角色" required>
          <n-select
            v-model:value="formData.role"
            :options="roleOptions"
            placeholder="请选择角色"
          />
        </n-form-item>
        <n-form-item label="状态" v-if="isEdit">
          <n-switch v-model:value="formData.is_active" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue'
import {
  NPageHeader,
  NCard,
  NSpace,
  NInput,
  NSelect,
  NButton,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NSwitch,
  NTag,
  useMessage,
  useDialog,
} from 'naive-ui'
import { PlusOutlined, SearchOutlined } from '@vicons/antd'
import { useApiClient } from '~/composables/useApiClient'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
  requiresAuth: true,
  requiresAdmin: true,
})

const message = useMessage()
const dialog = useDialog()
const api = useApiClient()
const authStore = useAuthStore()

const loading = ref(false)
const submitting = ref(false)
const users = ref<any[]>([])
const keyword = ref('')
const filterRole = ref<string | null>(null)
const showCreateModal = ref(false)
const editingId = ref<number | null>(null)

const isEdit = computed(() => editingId.value !== null)

const roleOptions = [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' },
  { label: '安全负责人', value: 'security_officer' },
]

const roleLabel: Record<string, string> = {
  user: '普通用户',
  admin: '管理员',
  security_officer: '安全负责人',
}

const roleTagType: Record<string, string> = {
  user: 'default',
  admin: 'info',
  security_officer: 'error',
}

const formData = reactive<any>({
  username: '',
  email: '',
  password: '',
  full_name: '',
  department: '',
  role: 'user',
  is_active: true,
})

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '用户名', key: 'username', width: 120 },
  { title: '姓名', key: 'full_name', width: 120 },
  { title: '邮箱', key: 'email', width: 180 },
  { title: '部门', key: 'department', width: 120 },
  {
    title: '角色',
    key: 'role',
    width: 120,
    render: (row: any) => h(NTag, { type: roleTagType[row.role] as any, size: 'small' }, { default: () => roleLabel[row.role] }),
  },
  {
    title: '状态',
    key: 'is_active',
    width: 80,
    render: (row: any) => h(NTag, { type: row.is_active ? 'success' : 'error', size: 'small' }, { default: () => row.is_active ? '启用' : '禁用' }),
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row: any) => h(
      NSpace,
      { size: 'small' },
      {
        default: () => [
          h(NButton, { size: 'small', onClick: () => editUser(row) }, { default: () => '编辑' }),
          h(NButton, { size: 'small', type: 'error', onClick: () => deleteUser(row) }, { default: () => '删除' }),
        ],
      }
    ),
  },
]

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { limit: 100 }
    if (keyword.value) params.keyword = keyword.value
    if (filterRole.value) params.role = filterRole.value

    const data = await api.users.list(params)
    users.value = data as any[]
  } catch (error: any) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.username = ''
  formData.email = ''
  formData.password = ''
  formData.full_name = ''
  formData.department = ''
  formData.role = 'user'
  formData.is_active = true
  editingId.value = null
}

const editUser = (row: any) => {
  Object.assign(formData, row)
  editingId.value = row.id
  showCreateModal.value = true
}

const handleSubmit = async () => {
  if (!formData.username || !formData.email) {
    message.error('请填写必填项')
    return
  }

  if (!isEdit.value && !formData.password) {
    message.error('请输入密码')
    return
  }

  if (formData.role === 'security_officer' && !authStore.isSecurityOfficer) {
    message.warning('只有安全负责人可以分配安全负责人角色')
    return
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      const updateData = { ...formData }
      delete updateData.username
      delete updateData.password
      await api.users.update(editingId.value!, updateData)
      message.success('更新成功')
    } else {
      await api.users.create(formData)
      message.success('创建成功')
    }
    showCreateModal.value = false
    resetForm()
    loadData()
  } catch (error: any) {
    message.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const deleteUser = (row: any) => {
  if (row.id === authStore.user?.id) {
    message.warning('不能删除自己')
    return
  }

  dialog.warning({
    title: '确认删除',
    content: `确定要删除用户「${row.username}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.users.remove(row.id)
        message.success('删除成功')
        loadData()
      } catch (error: any) {
        message.error('删除失败')
      }
    },
  })
}

onMounted(() => {
  loadData()
})
</script>
