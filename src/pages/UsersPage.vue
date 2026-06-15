<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Users, Plus, Search, Edit2, Trash2, UserCheck, UserX, ChevronDown } from 'lucide-vue-next'
import type { User, UserRole, UserStatus, Department } from '@/types'
import { users as usersApi, configs as configsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import Modal from '@/components/common/Modal.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const keyword = ref('')
const roleFilter = ref<'all' | 'pm' | 'admin'>('all')
const currentPage = ref(1)
const pageSize = 10
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize))

const userList = ref<User[]>([])
const departmentList = ref<Department[]>([])
const loading = ref(false)

const modalVisible = ref(false)
const isEditing = ref(false)
const editingUser = ref<User | null>(null)

const confirmDialog = reactive({
  visible: false,
  title: '',
  content: '',
  confirmText: '',
  confirmColor: 'primary' as 'primary' | 'danger' | 'accent',
  action: null as (() => void) | null,
})

const form = reactive({
  username: '',
  password: '',
  name: '',
  role: 'pm' as UserRole,
  department: '',
})

const formErrors = reactive({
  username: '',
  password: '',
  name: '',
  department: '',
})

async function fetchDepartments() {
  try {
    const res = await configsApi.getDepartments()
    if (res.success) {
      departmentList.value = res.data
    }
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

async function fetchUsers() {
  loading.value = true
  try {
    const params: {
      page: number
      pageSize: number
      role?: 'pm' | 'admin'
      keyword?: string
    } = {
      page: currentPage.value,
      pageSize,
    }
    if (roleFilter.value !== 'all') {
      params.role = roleFilter.value
    }
    if (keyword.value.trim()) {
      params.keyword = keyword.value.trim()
    }
    const res = await usersApi.getList(params)
    if (res.success) {
      userList.value = res.data.items
      totalItems.value = res.data.total
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchUsers()
}

function handleRoleFilterChange() {
  currentPage.value = 1
  fetchUsers()
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchUsers()
}

function resetForm() {
  form.username = ''
  form.password = ''
  form.name = ''
  form.role = 'pm'
  form.department = ''
  formErrors.username = ''
  formErrors.password = ''
  formErrors.name = ''
  formErrors.department = ''
}

function validateForm(): boolean {
  let isValid = true
  
  formErrors.username = ''
  formErrors.password = ''
  formErrors.name = ''
  formErrors.department = ''

  if (!form.username.trim()) {
    formErrors.username = '请输入用户名'
    isValid = false
  }

  if (!isEditing.value && !form.password) {
    formErrors.password = '请输入密码'
    isValid = false
  }

  if (!form.name.trim()) {
    formErrors.name = '请输入姓名'
    isValid = false
  }

  if (!form.department) {
    formErrors.department = '请选择部门'
    isValid = false
  }

  return isValid
}

function openCreateModal() {
  isEditing.value = false
  editingUser.value = null
  resetForm()
  modalVisible.value = true
}

function openEditModal(user: User) {
  isEditing.value = true
  editingUser.value = user
  form.username = user.username
  form.password = ''
  form.name = user.name
  form.role = user.role
  form.department = typeof user.department === 'string' ? user.department : user.department._id
  modalVisible.value = true
}

async function handleModalConfirm() {
  if (!validateForm()) {
    return
  }

  try {
    if (isEditing.value && editingUser.value) {
      const updateData: {
        name?: string
        role?: UserRole
        department?: string
        password?: string
      } = {
        name: form.name,
        role: form.role,
        department: form.department,
      }
      if (form.password) {
        updateData.password = form.password
      }
      const res = await usersApi.update(editingUser.value._id, updateData)
      if (res.success) {
        modalVisible.value = false
        fetchUsers()
      }
    } else {
      const res = await usersApi.create({
        username: form.username,
        password: form.password,
        name: form.name,
        role: form.role,
        department: form.department,
      })
      if (res.success) {
        modalVisible.value = false
        fetchUsers()
      }
    }
  } catch (error) {
    console.error('保存用户失败:', error)
  }
}

function showConfirmDialog(
  title: string,
  content: string,
  confirmText: string,
  confirmColor: 'primary' | 'danger' | 'accent',
  action: () => void
) {
  confirmDialog.title = title
  confirmDialog.content = content
  confirmDialog.confirmText = confirmText
  confirmDialog.confirmColor = confirmColor
  confirmDialog.action = action
  confirmDialog.visible = true
}

function handleConfirm() {
  if (confirmDialog.action) {
    confirmDialog.action()
  }
  confirmDialog.visible = false
}

function handleToggleStatus(user: User) {
  const newStatus: UserStatus = user.status === 'active' ? 'disabled' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  showConfirmDialog(
    `确认${action}`,
    `确定要${action}用户「${user.name}」吗？`,
    action,
    newStatus === 'active' ? 'primary' : 'danger',
    async () => {
      try {
        const res = await usersApi.update(user._id, { status: newStatus })
        if (res.success) {
          fetchUsers()
        }
      } catch (error) {
        console.error(`${action}用户失败:`, error)
      }
    }
  )
}

function handleDelete(user: User) {
  showConfirmDialog(
    '确认删除',
    `确定要删除用户「${user.name}」吗？此操作不可恢复。`,
    '删除',
    'danger',
    async () => {
      try {
        const res = await usersApi.remove(user._id)
        if (res.success) {
          fetchUsers()
        }
      } catch (error) {
        console.error('删除用户失败:', error)
      }
    }
  )
}

function getDepartmentName(department: string | Department): string {
  if (typeof department === 'string') {
    const dept = departmentList.value.find(d => d._id === department)
    return dept?.name || '-'
  }
  return department.name
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

onMounted(() => {
  fetchDepartments()
  fetchUsers()
})
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users class="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">用户管理</h2>
            <p class="text-sm text-gray-500">管理系统用户和权限</p>
          </div>
        </div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus class="w-4 h-4" />
          新增用户
        </button>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="keyword"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="搜索用户名、姓名..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
        <div class="flex gap-3">
          <div class="relative">
            <select
              v-model="roleFilter"
              @change="handleRoleFilterChange"
              class="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
            >
              <option value="all">全部角色</option>
              <option value="pm">PM</option>
              <option value="admin">管理员</option>
            </select>
            <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            @click="handleSearch"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            <Search class="w-4 h-4" />
            搜索
          </button>
        </div>
      </div>

      <div class="border border-gray-200 rounded-lg overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                加载中...
              </td>
            </tr>
            <template v-else-if="userList.length > 0">
              <tr
                v-for="user in userList"
                :key="user._id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ user.username }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ user.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    ]"
                  >
                    {{ user.role === 'admin' ? '管理员' : 'PM' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ getDepartmentName(user.department) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      user.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    ]"
                  >
                    {{ user.status === 'active' ? '正常' : '已禁用' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(user.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      @click="openEditModal(user)"
                      class="inline-flex items-center gap-1 px-2 py-1 rounded text-primary hover:bg-primary/10 transition-colors"
                      title="编辑"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleToggleStatus(user)"
                      :class="[
                        'inline-flex items-center gap-1 px-2 py-1 rounded transition-colors',
                        user.status === 'active'
                          ? 'text-gray-500 hover:bg-gray-100'
                          : 'text-green-600 hover:bg-green-50'
                      ]"
                      :title="user.status === 'active' ? '禁用' : '启用'"
                    >
                      <UserX v-if="user.status === 'active'" class="w-4 h-4" />
                      <UserCheck v-else class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleDelete(user)"
                      class="inline-flex items-center gap-1 px-2 py-1 rounded text-danger hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="7">
                <EmptyState
                  title="暂无用户数据"
                  description="系统中还没有用户，点击右上角按钮添加第一个用户"
                  action-text="新增用户"
                  @action="openCreateModal"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="userList.length > 0" class="mt-6">
        <Pagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          @change="handlePageChange"
        />
      </div>
    </div>

    <Modal
      v-model:visible="modalVisible"
      :title="isEditing ? '编辑用户' : '新增用户'"
      width="480px"
      :confirm-text="isEditing ? '保存' : '创建'"
      @confirm="handleModalConfirm"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            用户名 <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.username"
            :disabled="isEditing"
            type="text"
            placeholder="请输入用户名"
            :class="[
              'w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors',
              formErrors.username
                ? 'border-danger focus:ring-danger/20'
                : 'border-gray-300 focus:border-primary',
              isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
            ]"
          />
          <p v-if="formErrors.username" class="mt-1 text-xs text-danger">
            {{ formErrors.username }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            密码
            <span v-if="!isEditing" class="text-danger">*</span>
            <span v-else class="text-gray-400 text-xs font-normal">（不修改请留空）</span>
          </label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :class="[
              'w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors',
              formErrors.password
                ? 'border-danger focus:ring-danger/20'
                : 'border-gray-300 focus:border-primary'
            ]"
          />
          <p v-if="formErrors.password" class="mt-1 text-xs text-danger">
            {{ formErrors.password }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            姓名 <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="请输入姓名"
            :class="[
              'w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors',
              formErrors.name
                ? 'border-danger focus:ring-danger/20'
                : 'border-gray-300 focus:border-primary'
            ]"
          />
          <p v-if="formErrors.name" class="mt-1 text-xs text-danger">
            {{ formErrors.name }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            角色 <span class="text-danger">*</span>
          </label>
          <div class="flex gap-4">
            <label
              :class="[
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors',
                form.role === 'pm'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              ]"
            >
              <input
                v-model="form.role"
                type="radio"
                value="pm"
                class="sr-only"
              />
              <span class="text-sm font-medium">PM</span>
            </label>
            <label
              :class="[
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors',
                form.role === 'admin'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              ]"
            >
              <input
                v-model="form.role"
                type="radio"
                value="admin"
                class="sr-only"
              />
              <span class="text-sm font-medium">管理员</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            部门 <span class="text-danger">*</span>
          </label>
          <div class="relative">
            <select
              v-model="form.department"
              :class="[
                'appearance-none w-full pl-4 pr-10 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors bg-white',
                formErrors.department
                  ? 'border-danger focus:ring-danger/20'
                  : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
              ]"
            >
              <option value="">请选择部门</option>
              <option
                v-for="dept in departmentList"
                :key="dept._id"
                :value="dept._id"
              >
                {{ dept.name }}
              </option>
            </select>
            <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p v-if="formErrors.department" class="mt-1 text-xs text-danger">
            {{ formErrors.department }}
          </p>
        </div>
      </div>
    </Modal>

    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :confirm-text="confirmDialog.confirmText"
      :confirm-color="confirmDialog.confirmColor"
      @confirm="handleConfirm"
    />
  </div>
</template>
