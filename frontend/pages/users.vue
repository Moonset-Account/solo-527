<template>
  <div class="users-page">
    <n-card class="action-card">
      <n-space justify="space-between">
        <n-space>
          <n-input
            v-model:value="keyword"
            placeholder="搜索用户名/邮箱/姓名"
            clearable
            style="width: 280px"
            @keyup.enter="fetchUsers"
          >
            <template #prefix>
              <n-icon>🔍</n-icon>
            </template>
          </n-input>
          <n-button @click="fetchUsers">
            <template #icon>
              <n-icon>🔍</n-icon>
            </template>
            查询
          </n-button>
        </n-space>
        <n-button type="primary" @click="openCreateModal">
          <template #icon>
            <n-icon>➕</n-icon>
          </template>
          新建用户
        </n-button>
      </n-space>
    </n-card>

    <n-card class="table-card">
      <n-data-table
        :columns="columns"
        :data="userList"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: UserItem) => row.id"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>

    <n-modal
      v-model:show="showCreateModal"
      :mask-closable="false"
      preset="card"
      title="新建用户"
      style="width: 560px"
      :title-style="{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }"
    >
      <n-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-placement="top"
        :show-label="true"
      >
        <n-space :size="16" style="width: 100%">
          <n-form-item label="用户名" path="username" style="flex: 1">
            <n-input v-model:value="createForm.username" placeholder="请输入用户名" />
          </n-form-item>
          <n-form-item label="邮箱" path="email" style="flex: 1">
            <n-input v-model:value="createForm.email" placeholder="请输入邮箱" />
          </n-form-item>
        </n-space>
        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="createForm.password"
            type="password"
            placeholder="请输入密码"
            show-password-on="click"
          />
        </n-form-item>
        <n-space :size="16" style="width: 100%">
          <n-form-item label="姓名" path="full_name" style="flex: 1">
            <n-input v-model:value="createForm.full_name" placeholder="请输入姓名" />
          </n-form-item>
          <n-form-item label="角色" path="role" style="flex: 1">
            <n-select v-model:value="createForm.role" :options="roleOptions" placeholder="请选择角色" />
          </n-form-item>
        </n-space>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="creating" @click="handleCreate">提交</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showEditModal"
      :mask-closable="false"
      preset="card"
      title="编辑用户"
      style="width: 560px"
      :title-style="{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }"
    >
      <n-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-placement="top"
        :show-label="true"
      >
        <n-space :size="16" style="width: 100%">
          <n-form-item label="邮箱" path="email" style="flex: 1">
            <n-input v-model:value="editForm.email" placeholder="请输入邮箱" />
          </n-form-item>
          <n-form-item label="姓名" path="full_name" style="flex: 1">
            <n-input v-model:value="editForm.full_name" placeholder="请输入姓名" />
          </n-form-item>
        </n-space>
        <n-space :size="16" style="width: 100%">
          <n-form-item label="角色" path="role" style="flex: 1">
            <n-select v-model:value="editForm.role" :options="roleOptions" placeholder="请选择角色" />
          </n-form-item>
          <n-form-item label="是否启用" path="is_active" style="flex: 1">
            <n-space align="center" :size="12" style="height: 34px">
              <n-switch v-model:value="editForm.is_active" />
              <span style="color: #666">{{ editForm.is_active ? '已启用' : '已禁用' }}</span>
            </n-space>
          </n-form-item>
        </n-space>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showEditModal = false">取消</n-button>
          <n-button type="primary" :loading="editing" @click="handleEdit">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import dayjs from 'dayjs'
import type { DataTableColumns, FormInst, SelectMixedOption, TagProps } from 'naive-ui'
import type { User } from '~/stores/auth'

definePageMeta({
  layout: 'default'
})

const { get, post, put } = useApi()
const message = useMessage()

interface UserItem extends User {}

interface UserListResponse {
  items: UserItem[]
  total: number
  page: number
  page_size: number
}

const loading = ref(false)
const creating = ref(false)
const editing = ref(false)
const keyword = ref('')

const userList = ref<UserItem[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`
})

const showCreateModal = ref(false)
const createFormRef = ref<FormInst | null>(null)
const createForm = reactive({
  username: '',
  email: '',
  password: '',
  full_name: '',
  role: 'agent'
})

const createRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/, message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符之间', trigger: 'blur' }
  ],
  full_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const showEditModal = ref(false)
const editFormRef = ref<FormInst | null>(null)
const editingUserId = ref<number | null>(null)
const editForm = reactive({
  email: '',
  full_name: '',
  role: 'agent',
  is_active: true
})

const editRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/, message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  full_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const roleOptions: SelectMixedOption[] = [
  { label: '管理员', value: 'admin' },
  { label: '客服主管', value: 'supervisor' },
  { label: '客服', value: 'agent' },
  { label: '客户', value: 'customer' }
]

const roleLabelMap: Record<string, string> = {
  admin: '管理员',
  supervisor: '客服主管',
  agent: '客服',
  customer: '客户'
}

const roleTagTypeMap: Record<string, TagProps['type']> = {
  admin: 'error',
  supervisor: 'warning',
  agent: 'info',
  customer: 'default'
}

const columns = computed<DataTableColumns>(() => [
  {
    title: 'ID',
    key: 'id',
    width: 80,
    render: (row: UserItem) => h('span', `#${row.id}`)
  },
  {
    title: '用户名',
    key: 'username',
    width: 140,
    render: (row: UserItem) => h('span', { style: { fontWeight: 500 } }, row.username)
  },
  {
    title: '邮箱',
    key: 'email',
    minWidth: 200,
    ellipsis: { tooltip: true }
  },
  {
    title: '姓名',
    key: 'full_name',
    width: 120,
    render: (row: UserItem) => row.full_name || '-'
  },
  {
    title: '角色',
    key: 'role',
    width: 110,
    render: (row: UserItem) => h(
      'n-tag',
      {
        type: roleTagTypeMap[row.role] || 'default',
        size: 'small'
      },
      () => roleLabelMap[row.role] || row.role
    )
  },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    render: (row: UserItem) => row.is_active
      ? h('n-tag', { type: 'success', size: 'small' }, () => 'active')
      : h('n-tag', { type: 'default', size: 'small' }, () => 'disabled')
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 180,
    render: (row: UserItem) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    fixed: 'right',
    render: (row: UserItem) => h(
      'n-button',
      {
        size: 'small',
        type: 'primary',
        quaternary: true,
        onClick: () => openEditModal(row)
      },
      () => '编辑'
    )
  }
])

const buildQueryString = () => {
  const params = new URLSearchParams()
  params.append('page', String(pagination.page))
  params.append('page_size', String(pagination.pageSize))
  if (keyword.value?.trim()) params.append('keyword', keyword.value.trim())
  return params.toString()
}

const fetchUsers = async () => {
  try {
    loading.value = true
    const query = buildQueryString()
    const res = await get<UserListResponse>(`/auth/users?${query}`)
    userList.value = res.items
    pagination.itemCount = res.total
  } catch (e: any) {
    message.error(e.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchUsers()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchUsers()
}

const openCreateModal = () => {
  resetCreateForm()
  showCreateModal.value = true
}

const resetCreateForm = () => {
  createForm.username = ''
  createForm.email = ''
  createForm.password = ''
  createForm.full_name = ''
  createForm.role = 'agent'
}

const handleCreate = async () => {
  try {
    await createFormRef.value?.validate()
    creating.value = true

    await post('/auth/register', {
      username: createForm.username,
      email: createForm.email,
      password: createForm.password,
      full_name: createForm.full_name,
      role: createForm.role
    })
    message.success('用户创建成功')
    showCreateModal.value = false
    resetCreateForm()
    fetchUsers()
  } catch (e: any) {
    if (e?.errors) return
    message.error(e.message || '创建用户失败')
  } finally {
    creating.value = false
  }
}

const openEditModal = (row: UserItem) => {
  editingUserId.value = row.id
  editForm.email = row.email
  editForm.full_name = row.full_name || ''
  editForm.role = row.role
  editForm.is_active = row.is_active
  showEditModal.value = true
}

const handleEdit = async () => {
  try {
    await editFormRef.value?.validate()
    editing.value = true

    await put(`/auth/users/${editingUserId.value}`, {
      email: editForm.email,
      full_name: editForm.full_name,
      role: editForm.role,
      is_active: editForm.is_active
    })
    message.success('用户更新成功')
    showEditModal.value = false
    fetchUsers()
  } catch (e: any) {
    if (e?.errors) return
    message.error(e.message || '更新用户失败')
  } finally {
    editing.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped lang="scss">
.users-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-card {
  border-radius: 8px;
}

.table-card {
  border-radius: 8px;
  padding: 0;

  :deep(.n-card__content) {
    padding: 0;
  }

  :deep(.n-data-table) {
    border-radius: 0;
    border: none;
  }
}
</style>
