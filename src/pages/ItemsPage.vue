<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'
import { useAuthStore } from '@/stores/auth'
import { configs, users as usersApi } from '@/lib/api'
import StatusBadge from '@/components/common/StatusBadge.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import Modal from '@/components/common/Modal.vue'
import Pagination from '@/components/common/Pagination.vue'
import {
  Calendar,
  User,
  Building2,
  FileText,
  Search,
  Plus,
  Eye,
  HandCoins,
  Edit,
  CheckCircle,
  ChevronDown,
} from 'lucide-vue-next'
import type { Item, ItemStatus, ItemPriority, Department, User as UserType } from '@/types'

const router = useRouter()
const itemStore = useItemStore()
const authStore = useAuthStore()

const currentUser = computed(() => {
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }
  return authStore.user
})

const isAdmin = computed(() => currentUser.value?.role === 'admin')
const canClaimOrProgress = computed(() => currentUser.value?.role === 'admin' || currentUser.value?.role === 'pm')

const filters = reactive({
  status: '' as ItemStatus | '',
  department: '',
  assignee: '',
  priority: '' as ItemPriority | '',
  keyword: '',
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  totalPages: 1,
})

const departments = ref<Department[]>([])
const users = ref<UserType[]>([])
const selectedItems = ref<Set<string>>(new Set())
const showCreateModal = ref(false)
const showClaimModal = ref(false)
const showProgressModal = ref(false)
const showEditModal = ref(false)
const currentEditItem = ref<Item | null>(null)
const currentProgressItem = ref<Item | null>(null)
const currentClaimItem = ref<Item | null>(null)
const progressContent = ref('')

const createForm = reactive({
  title: '',
  description: '',
  department: '',
  deadline: '',
  priority: 'medium' as ItemPriority,
  assignee: '',
})

const createFormErrors = reactive({
  title: '',
  description: '',
  department: '',
  deadline: '',
  priority: '',
})

const items = computed(() => itemStore.items)
const total = computed(() => itemStore.total)
const loading = computed(() => itemStore.loading)

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待认领' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'overdue', label: '已逾期' },
  { value: 'archived', label: '已归档' },
]

const priorityOptions = [
  { value: '', label: '全部' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
]

const formPriorityOptions = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
]

async function fetchDepartments() {
  try {
    const response = await configs.getDepartments()
    departments.value = response
  } catch (error) {
    console.error('获取部门列表失败', error)
  }
}

async function fetchUsers() {
  try {
    const response = await usersApi.getList({ pageSize: 100 })
    users.value = response.list
  } catch (error) {
    console.error('获取用户列表失败', error)
  }
}

async function fetchItems() {
  const params: any = {
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
  }
  if (filters.status) params.status = filters.status
  if (filters.department) params.department = filters.department
  if (filters.assignee) params.assignee = filters.assignee
  if (filters.priority) params.priority = filters.priority
  if (filters.keyword) params.keyword = filters.keyword

  await itemStore.fetchItems(params)
  pagination.totalPages = Math.ceil(total.value / pagination.pageSize) || 1
}

function handleSearch() {
  pagination.currentPage = 1
  fetchItems()
}

function handleReset() {
  filters.status = ''
  filters.department = ''
  filters.assignee = ''
  filters.priority = ''
  filters.keyword = ''
  pagination.currentPage = 1
  fetchItems()
}

function handlePageChange(page: number) {
  pagination.currentPage = page
  fetchItems()
}

function goToDetail(item: Item) {
  router.push(`/items/${item._id}`)
}

function toggleSelectAll() {
  if (selectedItems.value.size === items.value.length) {
    selectedItems.value.clear()
  } else {
    selectedItems.value = new Set(items.value.map(item => item._id))
  }
}

function toggleSelect(itemId: string) {
  if (selectedItems.value.has(itemId)) {
    selectedItems.value.delete(itemId)
  } else {
    selectedItems.value.add(itemId)
  }
}

function isSelected(itemId: string) {
  return selectedItems.value.has(itemId)
}

function getDepartmentName(department: string | Department) {
  if (typeof department === 'string') return '-'
  return department.name
}

function getUserName(user: string | UserType) {
  if (!user || typeof user === 'string') return '-'
  return user.name
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

function openCreateModal() {
  createForm.title = ''
  createForm.description = ''
  createForm.department = ''
  createForm.deadline = ''
  createForm.priority = 'medium'
  createForm.assignee = ''
  Object.keys(createFormErrors).forEach(key => {
    createFormErrors[key as keyof typeof createFormErrors] = ''
  })
  showCreateModal.value = true
}

function validateCreateForm() {
  let valid = true
  Object.keys(createFormErrors).forEach(key => {
    createFormErrors[key as keyof typeof createFormErrors] = ''
  })

  if (!createForm.title.trim()) {
    createFormErrors.title = '请输入事项标题'
    valid = false
  }
  if (!createForm.description.trim()) {
    createFormErrors.description = '请输入事项描述'
    valid = false
  }
  if (!createForm.department) {
    createFormErrors.department = '请选择部门'
    valid = false
  }
  if (!createForm.deadline) {
    createFormErrors.deadline = '请选择截止日期'
    valid = false
  }

  return valid
}

async function handleCreate() {
  if (!validateCreateForm()) return

  try {
    await itemStore.createItem({
      title: createForm.title,
      description: createForm.description,
      department: createForm.department,
      deadline: createForm.deadline,
      priority: createForm.priority,
      assignee: createForm.assignee,
    })
    showCreateModal.value = false
    fetchItems()
  } catch (error) {
    console.error('创建事项失败', error)
  }
}

function openClaimModal(item: Item) {
  currentClaimItem.value = item
  showClaimModal.value = true
}

async function handleClaim() {
  if (!currentClaimItem.value) return
  try {
    await itemStore.claimItem(currentClaimItem.value._id)
    showClaimModal.value = false
    fetchItems()
  } catch (error) {
    console.error('认领事项失败', error)
  }
}

function openProgressModal(item: Item) {
  currentProgressItem.value = item
  progressContent.value = ''
  showProgressModal.value = true
}

async function handleAddProgress() {
  if (!currentProgressItem.value || !progressContent.value.trim()) return
  try {
    await itemStore.addProgress(currentProgressItem.value._id, progressContent.value)
    showProgressModal.value = false
    progressContent.value = ''
  } catch (error) {
    console.error('补充进度失败', error)
  }
}

function openEditModal(item: Item) {
  currentEditItem.value = item
  createForm.title = item.title
  createForm.description = item.description
  createForm.department = typeof item.department === 'string' ? item.department : item.department._id
  createForm.deadline = item.deadline ? item.deadline.split('T')[0] : ''
  createForm.priority = item.priority
  createForm.assignee = typeof item.assignee === 'string' ? item.assignee : item.assignee?._id || ''
  Object.keys(createFormErrors).forEach(key => {
    createFormErrors[key as keyof typeof createFormErrors] = ''
  })
  showEditModal.value = true
}

async function handleEdit() {
  if (!currentEditItem.value || !validateCreateForm()) return

  try {
    await itemStore.updateItem(currentEditItem.value._id, {
      title: createForm.title,
      description: createForm.description,
      department: createForm.department,
      deadline: createForm.deadline,
      priority: createForm.priority,
      assignee: createForm.assignee,
    })
    showEditModal.value = false
    fetchItems()
  } catch (error) {
    console.error('编辑事项失败', error)
  }
}

onMounted(() => {
  fetchDepartments()
  fetchUsers()
  fetchItems()
})
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">事项管理</h2>
        <button
          v-if="isAdmin"
          @click="openCreateModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus class="w-4 h-4" />
          新建事项
        </button>
      </div>

      <div class="flex flex-wrap gap-4 mb-6">
        <div class="relative">
          <select
            v-model="filters.status"
            class="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[120px]"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div class="relative">
          <select
            v-model="filters.department"
            class="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[120px]"
          >
            <option value="">全部部门</option>
            <option v-for="dept in departments" :key="dept._id" :value="dept._id">
              {{ dept.name }}
            </option>
          </select>
          <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div class="relative">
          <select
            v-model="filters.assignee"
            class="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[120px]"
          >
            <option value="">全部负责人</option>
            <option v-for="user in users" :key="user._id" :value="user._id">
              {{ user.name }}
            </option>
          </select>
          <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div class="relative">
          <select
            v-model="filters.priority"
            class="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[100px]"
          >
            <option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div class="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="搜索关键词..."
            @keyup.enter="handleSearch"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <button
          @click="handleSearch"
          class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          搜索
        </button>

        <button
          @click="handleReset"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          重置
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="py-3 px-4 text-left">
                <input
                  type="checkbox"
                  :checked="selectedItems.size === items.length && items.length > 0"
                  @change="toggleSelectAll"
                  class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </th>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">事项标题</th>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">优先级</th>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负责人</th>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">截止日期</th>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="item in items"
              :key="item._id"
              @click="goToDetail(item)"
              class="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td class="py-4 px-4" @click.stop>
                <input
                  type="checkbox"
                  :checked="isSelected(item._id)"
                  @change="toggleSelect(item._id)"
                  class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center gap-2">
                  <FileText class="w-4 h-4 text-gray-400" />
                  <span class="text-sm font-medium text-gray-900">{{ item.title }}</span>
                </div>
              </td>
              <td class="py-4 px-4">
                <StatusBadge :status="item.status" />
              </td>
              <td class="py-4 px-4">
                <PriorityBadge :priority="item.priority" />
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center gap-1.5 text-sm text-gray-600">
                  <Building2 class="w-4 h-4 text-gray-400" />
                  {{ getDepartmentName(item.department) }}
                </div>
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center gap-1.5 text-sm text-gray-600">
                  <User class="w-4 h-4 text-gray-400" />
                  {{ getUserName(item.assignee) }}
                </div>
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center gap-1.5 text-sm text-gray-600">
                  <Calendar class="w-4 h-4 text-gray-400" />
                  {{ formatDate(item.deadline) }}
                </div>
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center gap-1.5 text-sm text-gray-500">
                  <Calendar class="w-4 h-4 text-gray-400" />
                  {{ formatDate(item.createdAt) }}
                </div>
              </td>
              <td class="py-4 px-4" @click.stop>
                <div class="flex items-center gap-2">
                  <button
                    @click="goToDetail(item)"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors"
                  >
                    <Eye class="w-3.5 h-3.5" />
                    查看
                  </button>
                  <button
                    v-if="canClaimOrProgress && item.status === 'pending'"
                    @click="openClaimModal(item)"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors"
                  >
                    <HandCoins class="w-3.5 h-3.5" />
                    认领
                  </button>
                  <button
                    v-if="canClaimOrProgress && item.status === 'in_progress'"
                    @click="openProgressModal(item)"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs text-accent hover:bg-accent/10 rounded transition-colors"
                  >
                    <CheckCircle class="w-3.5 h-3.5" />
                    补充进度
                  </button>
                  <button
                    v-if="isAdmin"
                    @click="openEditModal(item)"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit class="w-3.5 h-3.5" />
                    编辑
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="items.length === 0 && !loading">
              <td colspan="9" class="py-12 text-center text-gray-500">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="py-12 text-center text-gray-500">
        加载中...
      </div>

      <div class="mt-6">
        <Pagination
          v-model:currentPage="pagination.currentPage"
          :totalPages="pagination.totalPages"
          :totalItems="total"
          @change="handlePageChange"
        />
      </div>
    </div>

    <Modal
      v-model:visible="showCreateModal"
      title="新建事项"
      width="560px"
      confirmText="创建"
      @confirm="handleCreate"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">事项标题</label>
          <input
            v-model="createForm.title"
            type="text"
            placeholder="请输入事项标题"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            :class="{ 'border-red-500': createFormErrors.title }"
          />
          <p v-if="createFormErrors.title" class="mt-1 text-xs text-red-500">{{ createFormErrors.title }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">事项描述</label>
          <textarea
            v-model="createForm.description"
            rows="3"
            placeholder="请输入事项描述"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            :class="{ 'border-red-500': createFormErrors.description }"
          />
          <p v-if="createFormErrors.description" class="mt-1 text-xs text-red-500">{{ createFormErrors.description }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">部门</label>
            <div class="relative">
              <select
                v-model="createForm.department"
                class="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                :class="{ 'border-red-500': createFormErrors.department }"
              >
                <option value="">请选择部门</option>
                <option v-for="dept in departments" :key="dept._id" :value="dept._id">
                  {{ dept.name }}
                </option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <p v-if="createFormErrors.department" class="mt-1 text-xs text-red-500">{{ createFormErrors.department }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
            <div class="relative">
              <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="createForm.deadline"
                type="date"
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                :class="{ 'border-red-500': createFormErrors.deadline }"
              />
            </div>
            <p v-if="createFormErrors.deadline" class="mt-1 text-xs text-red-500">{{ createFormErrors.deadline }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <div class="relative">
              <select
                v-model="createForm.priority"
                class="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option v-for="opt in formPriorityOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">负责人（可选）</label>
            <div class="relative">
              <select
                v-model="createForm.assignee"
                class="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">请选择负责人</option>
                <option v-for="user in users" :key="user._id" :value="user._id">
                  {{ user.name }}
                </option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      v-model:visible="showEditModal"
      title="编辑事项"
      width="560px"
      confirmText="保存"
      @confirm="handleEdit"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">事项标题</label>
          <input
            v-model="createForm.title"
            type="text"
            placeholder="请输入事项标题"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            :class="{ 'border-red-500': createFormErrors.title }"
          />
          <p v-if="createFormErrors.title" class="mt-1 text-xs text-red-500">{{ createFormErrors.title }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">事项描述</label>
          <textarea
            v-model="createForm.description"
            rows="3"
            placeholder="请输入事项描述"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            :class="{ 'border-red-500': createFormErrors.description }"
          />
          <p v-if="createFormErrors.description" class="mt-1 text-xs text-red-500">{{ createFormErrors.description }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">部门</label>
            <div class="relative">
              <select
                v-model="createForm.department"
                class="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                :class="{ 'border-red-500': createFormErrors.department }"
              >
                <option value="">请选择部门</option>
                <option v-for="dept in departments" :key="dept._id" :value="dept._id">
                  {{ dept.name }}
                </option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <p v-if="createFormErrors.department" class="mt-1 text-xs text-red-500">{{ createFormErrors.department }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
            <div class="relative">
              <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="createForm.deadline"
                type="date"
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                :class="{ 'border-red-500': createFormErrors.deadline }"
              />
            </div>
            <p v-if="createFormErrors.deadline" class="mt-1 text-xs text-red-500">{{ createFormErrors.deadline }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <div class="relative">
              <select
                v-model="createForm.priority"
                class="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option v-for="opt in formPriorityOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">负责人（可选）</label>
            <div class="relative">
              <select
                v-model="createForm.assignee"
                class="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">请选择负责人</option>
                <option v-for="user in users" :key="user._id" :value="user._id">
                  {{ user.name }}
                </option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      v-model:visible="showClaimModal"
      title="认领事项"
      width="400px"
      confirmText="确认认领"
      @confirm="handleClaim"
    >
      <div class="text-center py-4">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <HandCoins class="w-8 h-8 text-green-600" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">确认认领此事项？</h3>
        <p class="text-gray-500 text-sm">
          事项标题：<span class="font-medium text-gray-900">{{ currentClaimItem?.title }}</span>
        </p>
        <p class="text-gray-500 text-sm mt-1">
          认领后您将作为负责人跟进此事项
        </p>
      </div>
    </Modal>

    <Modal
      v-model:visible="showProgressModal"
      title="补充进度"
      width="500px"
      confirmText="提交"
      @confirm="handleAddProgress"
    >
      <div class="space-y-4">
        <div class="text-sm text-gray-600">
          事项：<span class="font-medium text-gray-900">{{ currentProgressItem?.title }}</span>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">进度内容</label>
          <textarea
            v-model="progressContent"
            rows="4"
            placeholder="请输入当前进度说明..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>
      </div>
    </Modal>
  </div>
</template>
