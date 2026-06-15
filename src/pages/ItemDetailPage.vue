<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'
import { useAuthStore } from '@/stores/auth'
import { configs, logs as logsApi } from '@/lib/api'
import StatusBadge from '@/components/common/StatusBadge.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import Modal from '@/components/common/Modal.vue'
import {
  Calendar,
  User,
  Building2,
  FileText,
  Clock,
  CheckCircle,
  Upload,
  Download,
  History,
  ArrowLeft,
  HandCoins,
  Edit,
  Send,
  ChevronDown,
  ChevronUp,
  Paperclip,
} from 'lucide-vue-next'
import type { Item, Progress, Attachment, Log, Department, User as UserType } from '@/types'

const route = useRoute()
const router = useRouter()
const itemStore = useItemStore()
const authStore = useAuthStore()

const itemId = route.params.id as string

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

const item = computed(() => itemStore.currentItem)
const loading = computed(() => itemStore.loading)

const progressList = computed(() => {
  if (!item.value?.progressList) return []
  return [...item.value.progressList].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const attachments = computed(() => item.value?.attachments || [])

const logs = ref<Log[]>([])
const logsLoading = ref(false)
const showLogs = ref(true)

const showClaimModal = ref(false)
const showProgressModal = ref(false)
const showEditModal = ref(false)
const showCompleteModal = ref(false)

const progressContent = ref('')
const selectedFiles = ref<File[]>([])

const editForm = reactive({
  title: '',
  description: '',
  department: '',
  deadline: '',
  priority: 'medium' as any,
  assignee: '',
})

const editFormErrors = reactive({
  title: '',
  description: '',
  department: '',
  deadline: '',
  priority: '',
})

const departments = ref<Department[]>([])
const users = ref<UserType[]>([])

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
    const response = await (await import('@/lib/api')).users.getList({ pageSize: 100 })
    users.value = response.list
  } catch (error) {
    console.error('获取用户列表失败', error)
  }
}

async function fetchItem() {
  await itemStore.fetchItem(itemId)
}

async function fetchLogs() {
  logsLoading.value = true
  try {
    const response = await logsApi.getList({ pageSize: 100 })
    logs.value = response.list.filter(log => log.targetId === itemId)
  } catch (error) {
    console.error('获取操作日志失败', error)
  } finally {
    logsLoading.value = false
  }
}

function goBack() {
  router.push('/items')
}

function getDepartmentName(department: string | Department) {
  if (!department || typeof department === 'string') return '-'
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

function formatDateTime(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

function getLogTypeLabel(type: string) {
  const labels: Record<string, string> = {
    claim: '认领',
    progress: '进度更新',
    review: '评审',
    overdue_mark: '逾期标记',
    user_action: '用户操作',
    config_change: '配置变更',
  }
  return labels[type] || type
}

function openClaimModal() {
  showClaimModal.value = true
}

async function handleClaim() {
  try {
    await itemStore.claimItem(itemId)
    showClaimModal.value = false
  } catch (error) {
    console.error('认领事项失败', error)
  }
}

function openProgressModal() {
  progressContent.value = ''
  selectedFiles.value = []
  showProgressModal.value = true
}

async function handleAddProgress() {
  if (!progressContent.value.trim()) return

  try {
    let attachmentIds: string[] = []
    if (selectedFiles.value.length > 0) {
      for (const file of selectedFiles.value) {
        const response = await configs.uploadAttachment(file, itemId, 'item')
        attachmentIds.push(response._id)
      }
    }
    await itemStore.addProgress(itemId, progressContent.value, attachmentIds.length > 0 ? attachmentIds : undefined)
    showProgressModal.value = false
    progressContent.value = ''
    selectedFiles.value = []
  } catch (error) {
    console.error('补充进度失败', error)
  }
}

function openEditModal() {
  if (!item.value) return
  editForm.title = item.value.title
  editForm.description = item.value.description
  editForm.department = typeof item.value.department === 'string' ? item.value.department : item.value.department._id
  editForm.deadline = item.value.deadline ? item.value.deadline.split('T')[0] : ''
  editForm.priority = item.value.priority
  editForm.assignee = typeof item.value.assignee === 'string' ? item.value.assignee : item.value.assignee?._id || ''
  Object.keys(editFormErrors).forEach(key => {
    editFormErrors[key as keyof typeof editFormErrors] = ''
  })
  showEditModal.value = true
}

function validateEditForm() {
  let valid = true
  Object.keys(editFormErrors).forEach(key => {
    editFormErrors[key as keyof typeof editFormErrors] = ''
  })

  if (!editForm.title.trim()) {
    editFormErrors.title = '请输入事项标题'
    valid = false
  }
  if (!editForm.description.trim()) {
    editFormErrors.description = '请输入事项描述'
    valid = false
  }
  if (!editForm.department) {
    editFormErrors.department = '请选择部门'
    valid = false
  }
  if (!editForm.deadline) {
    editFormErrors.deadline = '请选择截止日期'
    valid = false
  }

  return valid
}

async function handleEdit() {
  if (!validateEditForm()) return

  try {
    await itemStore.updateItem(itemId, {
      title: editForm.title,
      description: editForm.description,
      department: editForm.department,
      deadline: editForm.deadline,
      priority: editForm.priority,
      assignee: editForm.assignee,
    })
    showEditModal.value = false
  } catch (error) {
    console.error('编辑事项失败', error)
  }
}

function openCompleteModal() {
  showCompleteModal.value = true
}

async function handleComplete() {
  try {
    await itemStore.updateItem(itemId, { status: 'completed' })
    showCompleteModal.value = false
  } catch (error) {
    console.error('标记完成失败', error)
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files) {
    selectedFiles.value = [...selectedFiles.value, ...Array.from(target.files)]
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

function downloadAttachment(attachment: Attachment) {
  window.open(attachment.url, '_blank')
}

function toggleLogs() {
  showLogs.value = !showLogs.value
  if (showLogs.value && logs.value.length === 0) {
    fetchLogs()
  }
}

onMounted(() => {
  fetchDepartments()
  fetchUsers()
  fetchItem()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <button
        @click="goBack"
        class="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        返回列表
      </button>
    </div>

    <div v-if="loading" class="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
      加载中...
    </div>

    <div v-else-if="!item" class="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
      事项不存在
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-start justify-between mb-6">
              <div>
                <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ item.title }}</h2>
                <div class="flex items-center gap-2">
                  <StatusBadge :status="item.status" />
                  <PriorityBadge :priority="item.priority" />
                </div>
              </div>
            </div>

            <p class="text-gray-600 text-sm mb-6">{{ item.description }}</p>

            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 class="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div class="text-xs text-gray-500">所属部门</div>
                  <div class="text-sm font-medium text-gray-900">{{ getDepartmentName(item.department) }}</div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User class="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div class="text-xs text-gray-500">负责人</div>
                  <div class="text-sm font-medium text-gray-900">{{ getUserName(item.assignee) }}</div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Calendar class="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div class="text-xs text-gray-500">截止日期</div>
                  <div class="text-sm font-medium text-gray-900">{{ formatDate(item.deadline) }}</div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Clock class="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <div class="text-xs text-gray-500">创建时间</div>
                  <div class="text-sm font-medium text-gray-900">{{ formatDateTime(item.createdAt) }}</div>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <button
                v-if="canClaimOrProgress && item.status === 'pending'"
                @click="openClaimModal"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <HandCoins class="w-4 h-4" />
                认领事项
              </button>

              <button
                v-if="canClaimOrProgress && item.status === 'in_progress'"
                @click="openProgressModal"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
              >
                <Send class="w-4 h-4" />
                补充进度
              </button>

              <button
                v-if="isAdmin"
                @click="openEditModal"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Edit class="w-4 h-4" />
                编辑事项
              </button>

              <button
                v-if="item.status === 'in_progress'"
                @click="openCompleteModal"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <CheckCircle class="w-4 h-4" />
                标记完成
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText class="w-4 h-4 text-primary" />
                附件列表
              </h3>
              <label class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors">
                <Upload class="w-3.5 h-3.5" />
                上传附件
                <input type="file" multiple class="hidden" @change="handleFileSelect" />
              </label>
            </div>

            <div v-if="attachments.length === 0" class="text-center py-6 text-gray-500 text-sm">
              暂无附件
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="attachment in attachments"
                :key="attachment._id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <Paperclip class="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span class="text-sm text-gray-700 truncate">{{ attachment.filename }}</span>
                </div>
                <button
                  @click="downloadAttachment(attachment)"
                  class="p-1.5 text-gray-400 hover:text-primary hover:bg-white rounded transition-colors flex-shrink-0"
                >
                  <Download class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Clock class="w-4 h-4 text-primary" />
              进度时间线
            </h3>

            <div v-if="progressList.length === 0" class="text-center py-12 text-gray-500">
              暂无进度记录
            </div>

            <div v-else class="relative">
              <div class="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />

              <div class="space-y-6">
                <div
                  v-for="(progress, index) in progressList"
                  :key="progress._id"
                  class="relative pl-8"
                >
                  <div
                    class="absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 border-primary bg-white flex items-center justify-center"
                    :class="{ 'bg-primary': index === 0 }"
                  >
                    <div class="w-2 h-2 rounded-full" :class="index === 0 ? 'bg-white' : 'bg-primary'" />
                  </div>

                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User class="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span class="text-sm font-medium text-gray-900">{{ getUserName(progress.operator) }}</span>
                        <span class="text-xs text-gray-500">{{ formatDateTime(progress.createdAt) }}</span>
                      </div>
                    </div>
                    <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ progress.content }}</p>
                    <div
                      v-if="progress.attachments && progress.attachments.length > 0"
                      class="mt-3 pt-3 border-t border-gray-200"
                    >
                      <div class="text-xs text-gray-500 mb-2">附件：</div>
                      <div class="flex flex-wrap gap-2">
                        <span
                          v-for="(attId, attIndex) in progress.attachments"
                          :key="attIndex"
                          class="inline-flex items-center gap-1 px-2 py-1 bg-white rounded text-xs text-gray-600"
                        >
                          <Paperclip class="w-3 h-3" />
                          附件 {{ attIndex + 1 }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm">
            <button
              @click="toggleLogs"
              class="w-full flex items-center justify-between p-6 text-left"
            >
              <h3 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <History class="w-4 h-4 text-primary" />
                操作日志
              </h3>
              <component
                :is="showLogs ? ChevronUp : ChevronDown"
                class="w-5 h-5 text-gray-400"
              />
            </button>

            <div v-if="showLogs" class="px-6 pb-6">
              <div v-if="logsLoading" class="text-center py-6 text-gray-500 text-sm">
                加载中...
              </div>
              <div v-else-if="logs.length === 0" class="text-center py-6 text-gray-500 text-sm">
                暂无操作日志
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="log in logs"
                  :key="log._id"
                  class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User class="w-4 h-4 text-gray-500" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-gray-900">{{ getUserName(log.operator) }}</span>
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                        {{ getLogTypeLabel(log.type) }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">{{ formatDateTime(log.createdAt) }}</p>
                    <div v-if="log.detail && log.detail.field" class="mt-2 text-xs text-gray-600">
                      <span class="text-gray-500">{{ log.detail.field }}：</span>
                      <span>{{ log.detail.oldValue || '无' }} → {{ log.detail.newValue }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

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
          事项标题：<span class="font-medium text-gray-900">{{ item?.title }}</span>
        </p>
        <p class="text-gray-500 text-sm mt-1">
          认领后您将作为负责人跟进此事项
        </p>
      </div>
    </Modal>

    <Modal
      v-model:visible="showProgressModal"
      title="补充进度"
      width="560px"
      confirmText="提交"
      @confirm="handleAddProgress"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">进度内容</label>
          <textarea
            v-model="progressContent"
            rows="4"
            placeholder="请输入当前进度说明..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">上传附件（可选）</label>
          <label class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <Upload class="w-6 h-6 text-gray-400 mb-1" />
            <span class="text-xs text-gray-500">点击或拖拽文件到此处上传</span>
            <input type="file" multiple class="hidden" @change="handleFileSelect" />
          </label>

          <div v-if="selectedFiles.length > 0" class="mt-3 space-y-2">
            <div
              v-for="(file, index) in selectedFiles"
              :key="index"
              class="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-2 min-w-0">
                <Paperclip class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span class="text-sm text-gray-700 truncate">{{ file.name }}</span>
              </div>
              <button
                @click="removeFile(index)"
                class="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                ×
              </button>
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
            v-model="editForm.title"
            type="text"
            placeholder="请输入事项标题"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            :class="{ 'border-red-500': editFormErrors.title }"
          />
          <p v-if="editFormErrors.title" class="mt-1 text-xs text-red-500">{{ editFormErrors.title }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">事项描述</label>
          <textarea
            v-model="editForm.description"
            rows="3"
            placeholder="请输入事项描述"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            :class="{ 'border-red-500': editFormErrors.description }"
          />
          <p v-if="editFormErrors.description" class="mt-1 text-xs text-red-500">{{ editFormErrors.description }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">部门</label>
            <div class="relative">
              <select
                v-model="editForm.department"
                class="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                :class="{ 'border-red-500': editFormErrors.department }"
              >
                <option value="">请选择部门</option>
                <option v-for="dept in departments" :key="dept._id" :value="dept._id">
                  {{ dept.name }}
                </option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <p v-if="editFormErrors.department" class="mt-1 text-xs text-red-500">{{ editFormErrors.department }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
            <div class="relative">
              <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="editForm.deadline"
                type="date"
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                :class="{ 'border-red-500': editFormErrors.deadline }"
              />
            </div>
            <p v-if="editFormErrors.deadline" class="mt-1 text-xs text-red-500">{{ editFormErrors.deadline }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <div class="relative">
              <select
                v-model="editForm.priority"
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
                v-model="editForm.assignee"
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
      v-model:visible="showCompleteModal"
      title="标记完成"
      width="400px"
      confirmText="确认完成"
      @confirm="handleComplete"
    >
      <div class="text-center py-4">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle class="w-8 h-8 text-green-600" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">确认标记此事项为完成？</h3>
        <p class="text-gray-500 text-sm">
          事项标题：<span class="font-medium text-gray-900">{{ item?.title }}</span>
        </p>
        <p class="text-gray-500 text-sm mt-1">
          标记后事项状态将变更为"已完成"
        </p>
      </div>
    </Modal>
  </div>
</template>
