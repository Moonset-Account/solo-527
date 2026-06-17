<template>
  <MainLayout>
    <div class="admin-users-page">
      <n-card :bordered="false">
        <div class="filter-section">
          <n-form inline :model="queryForm">
            <n-form-item label="关键词">
              <n-input
                v-model:value="queryForm.keyword"
                placeholder="用户名/邮箱/姓名"
                clearable
                style="width: 200px"
              />
            </n-form-item>
            <n-form-item label="状态">
              <n-select
                v-model:value="queryForm.status"
                placeholder="请选择"
                clearable
                style="width: 130px"
                :options="[
                  { label: '启用', value: 'active' },
                  { label: '禁用', value: 'inactive' },
                ]"
              />
            </n-form-item>
            <n-form-item>
              <n-space>
                <n-button type="primary" @click="handleSearch">查询</n-button>
                <n-button @click="handleReset">重置</n-button>
              </n-space>
            </n-form-item>
          </n-form>
        </div>

        <div class="table-toolbar">
          <div class="toolbar-left">
            <n-button type="primary" @click="handleCreate">新增用户</n-button>
          </div>
          <div class="toolbar-right">
            <n-button @click="loadData">刷新</n-button>
          </div>
        </div>

        <n-spin :show="loading">
          <n-data-table
            :columns="columns"
            :data="tableData"
            :pagination="pagination"
            :bordered="false"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </n-spin>
      </n-card>

      <n-modal
        v-model:show="showModal"
        preset="card"
        :title="isEdit ? '编辑用户' : '新增用户'"
        style="width: 500px"
      >
        <n-form ref="formRef" :model="formData" :rules="formRules" label-placement="left" label-width="100px">
          <n-form-item label="用户名" path="username">
            <n-input v-model:value="formData.username" />
          </n-form-item>
          <n-form-item v-if="!isEdit" label="密码" path="password">
            <n-input v-model:value="formData.password" type="password" />
          </n-form-item>
          <n-form-item label="邮箱" path="email">
            <n-input v-model:value="formData.email" />
          </n-form-item>
          <n-form-item label="姓名" path="full_name">
            <n-input v-model:value="formData.full_name" />
          </n-form-item>
          <n-form-item label="手机号" path="phone">
            <n-input v-model:value="formData.phone" />
          </n-form-item>
          <n-form-item label="角色" path="role_ids">
            <n-select
              v-model:value="formData.role_ids"
              multiple
              :options="roleOptions"
            />
          </n-form-item>
          <n-form-item label="状态" path="is_active">
            <n-switch v-model:value="formData.is_active" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showModal = false">取消</n-button>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">确定</n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import type { FormInst, FormRules, DataTableColumns } from 'naive-ui'
import MainLayout from '~/components/layout/MainLayout.vue'
import { getUserList, createUser, updateUser, deleteUser, getRoles } from '~/api/system'
import { useMessageUtil, useDialogUtil } from '~/composables/useMessage'

const { success, error } = useMessageUtil()
const { confirm } = useDialogUtil()

const loading = ref(false)
const tableData = ref<any[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
})

const queryForm = reactive({
  keyword: '',
  status: '',
})

const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInst | null>(null)
const editingId = ref<number | null>(null)

const formData = reactive<any>({
  username: '',
  password: '',
  email: '',
  full_name: '',
  phone: '',
  role_ids: [],
  is_active: true,
})

const roleOptions = ref<{ label: string; value: number }[]>([])

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur', type: 'email' }],
}

const columns: DataTableColumns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '用户名', key: 'username', width: 120 },
  { title: '邮箱', key: 'email', width: 200 },
  { title: '姓名', key: 'full_name', width: 100 },
  { title: '手机号', key: 'phone', width: 130 },
  {
    title: '角色',
    key: 'roles',
    width: 180,
    render: (row: any) => row.roles?.map((r: any) => r.name).join(', ') || '-',
  },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    render: (row: any) => h('n-tag', { type: row.is_active ? 'success' : 'error' }, () => row.is_active ? '启用' : '禁用'),
  },
  { title: '创建时间', key: 'created_at', width: 170 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row: any) => h('n-space', null, () => [
      h('n-button', { size: 'small', onClick: () => handleEdit(row) }, () => '编辑'),
      h('n-button', { size: 'small', type: 'error', onClick: () => handleDelete(row.id) }, () => '删除'),
    ]),
  },
]

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...queryForm,
    }
    const res = await getUserList(params)
    if (res.code === 200) {
      tableData.value = res.data.items
      pagination.total = res.data.total
    }
  } catch (e: any) {
    error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  try {
    const res = await getRoles()
    if (res.code === 200) {
      roleOptions.value = res.data.map((r: any) => ({ label: r.name, value: r.id }))
    }
  } catch (e) {
    console.error('加载角色失败', e)
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  queryForm.keyword = ''
  queryForm.status = ''
  pagination.page = 1
  loadData()
}

function handlePageChange(page: number) {
  pagination.page = page
  loadData()
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadData()
}

function handleCreate() {
  isEdit.value = false
  editingId.value = null
  Object.assign(formData, {
    username: '',
    password: '',
    email: '',
    full_name: '',
    phone: '',
    role_ids: [],
    is_active: true,
  })
  showModal.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(formData, {
    username: row.username,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    role_ids: row.roles?.map((r: any) => r.id) || [],
    is_active: row.is_active,
  })
  showModal.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  if (!isEdit.value) {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
  }

  submitting.value = true
  try {
    if (isEdit.value && editingId.value) {
      const data: any = { ...formData }
      delete data.password
      await updateUser(editingId.value, data)
      success('更新成功')
    } else {
      await createUser(formData)
      success('创建成功')
    }
    showModal.value = false
    loadData()
  } catch (e: any) {
    error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function handleDelete(id: number) {
  confirm('确认删除', '确定要删除这个用户吗？', async () => {
    try {
      await deleteUser(id)
      success('删除成功')
      loadData()
    } catch (e: any) {
      error(e.message || '删除失败')
    }
  })
}

onMounted(() => {
  loadData()
  loadRoles()
})
</script>

<style scoped>
.admin-users-page {
  padding: 0;
}

.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
