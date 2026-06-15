<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ToggleLeft,
  ToggleRight,
  FileText,
  Building2,
  Paperclip,
  History,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Settings,
} from 'lucide-vue-next'
import Pagination from '@/components/common/Pagination.vue'
import Modal from '@/components/common/Modal.vue'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { Department, User, Log, Attachment, ReviewConclusion } from '@/types'

type SettingsTab = 'switches' | 'templates' | 'departments' | 'attachments' | 'changelog'

const activeTab = ref<SettingsTab>('switches')

const switches = ref([
  { key: 'overdue_warning', name: '逾期预警开关', description: '开启后，事项逾期前3天将自动发送提醒', value: true },
  { key: 'auto_reminder', name: '自动提醒开关', description: '开启后，系统将自动提醒事项负责人处理待办事项', value: false },
  { key: 'email_notification', name: '邮件通知开关', description: '开启后，所有通知将同时发送邮件', value: true },
])

const templates = ref<{ id: string; value: ReviewConclusion; label: string }[]>([
  { id: '1', value: 'completed', label: '已完成' },
  { id: '2', value: 'partial', label: '部分完成' },
  { id: '3', value: 'incomplete', label: '未完成' },
  { id: '4', value: 'escalated', label: '需升级处理' },
])

const newTemplateLabel = ref('')
const editingTemplateId = ref<string | null>(null)
const editingTemplateLabel = ref('')

const departments = ref<Department[]>([])
const departmentModalVisible = ref(false)
const editingDepartment = ref<Partial<Department>>({})
const isEditingDepartment = ref(false)

const users = ref<User[]>([])

const attachments = ref<Attachment[]>([])
const attachmentFilter = ref('')
const uploadModalVisible = ref(false)
const selectedFile = ref<File | null>(null)
const selectedRefId = ref('')

const changelogPage = ref(1)
const changelogPageSize = ref(5)
const changelog = ref<Log[]>([])
const totalChangelog = ref(0)

const tabItems = [
  { key: 'switches', label: '系统开关', icon: ToggleRight },
  { key: 'templates', label: '复盘结论模板', icon: FileText },
  { key: 'departments', label: '责任部门管理', icon: Building2 },
  { key: 'attachments', label: '附件版本管理', icon: Paperclip },
  { key: 'changelog', label: '变更记录', icon: History },
]

const mockDepartments: Department[] = [
  { _id: 'd1', name: '财务部', head: 'u1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { _id: 'd2', name: '技术部', head: 'u2', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
  { _id: 'd3', name: '市场部', head: 'u3', createdAt: '2024-01-03', updatedAt: '2024-01-03' },
  { _id: 'd4', name: '人事部', head: 'u4', createdAt: '2024-01-04', updatedAt: '2024-01-04' },
]

const mockUsers: User[] = [
  { _id: 'u1', name: '张三', username: 'zhangsan', role: 'pm', department: 'd1', status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { _id: 'u2', name: '李四', username: 'lisi', role: 'pm', department: 'd2', status: 'active', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
  { _id: 'u3', name: '王五', username: 'wangwu', role: 'pm', department: 'd3', status: 'active', createdAt: '2024-01-03', updatedAt: '2024-01-03' },
  { _id: 'u4', name: '赵六', username: 'zhaoliu', role: 'pm', department: 'd4', status: 'active', createdAt: '2024-01-04', updatedAt: '2024-01-04' },
]

const mockItems = [
  { _id: '1', title: '2024年度预算编制' },
  { _id: '2', title: '新系统上线项目' },
  { _id: '3', title: '市场推广活动策划' },
]

const mockAttachments: Attachment[] = [
  { _id: 'a1', filename: '预算方案_v1.xlsx', url: '', version: 1, refId: '1', refType: 'item', operator: 'u1', createdAt: '2024-01-15' },
  { _id: 'a2', filename: '系统设计文档_v2.pdf', url: '', version: 2, refId: '2', refType: 'item', operator: 'u2', createdAt: '2024-01-20' },
  { _id: 'a3', filename: '推广方案_v3.docx', url: '', version: 3, refId: '3', refType: 'item', operator: 'u3', createdAt: '2024-02-01' },
]

const mockChangelog: Log[] = [
  { _id: 'l1', type: 'config_change', operator: 'u1', targetId: 'overdue_warning', detail: { field: '逾期预警开关', oldValue: false, newValue: true }, createdAt: '2024-01-15 10:30:00' },
  { _id: 'l2', type: 'config_change', operator: 'u2', targetId: 'completed', detail: { field: '复盘结论模板', oldValue: '完成', newValue: '已完成' }, createdAt: '2024-01-16 14:20:00' },
  { _id: 'l3', type: 'config_change', operator: 'u1', targetId: 'd2', detail: { field: '部门负责人', oldValue: '李四', newValue: '王五' }, createdAt: '2024-01-17 09:15:00' },
  { _id: 'l4', type: 'config_change', operator: 'u3', targetId: 'email_notification', detail: { field: '邮件通知开关', oldValue: false, newValue: true }, createdAt: '2024-01-18 16:45:00' },
  { _id: 'l5', type: 'config_change', operator: 'u2', targetId: '技术部', detail: { field: '部门名称', oldValue: '研发部', newValue: '技术部' }, createdAt: '2024-01-19 11:00:00' },
  { _id: 'l6', type: 'config_change', operator: 'u1', targetId: 'auto_reminder', detail: { field: '自动提醒开关', oldValue: true, newValue: false }, createdAt: '2024-01-20 08:30:00' },
  { _id: 'l7', type: 'config_change', operator: 'u4', targetId: 'escalated', detail: { field: '新增复盘模板', oldValue: null, newValue: '需升级处理' }, createdAt: '2024-01-21 13:25:00' },
  { _id: 'l8', type: 'config_change', operator: 'u1', targetId: 'd5', detail: { field: '新增部门', oldValue: null, newValue: '运营部' }, createdAt: '2024-01-22 10:10:00' },
]

const filteredAttachments = computed(() => {
  if (!attachmentFilter.value) {
    return mockAttachments
  }
  return mockAttachments.filter(a => a.refId === attachmentFilter.value)
})

const paginatedChangelog = computed(() => {
  const start = (changelogPage.value - 1) * changelogPageSize.value
  return mockChangelog.slice(start, start + changelogPageSize.value)
})

const totalChangelogPages = computed(() => Math.ceil(mockChangelog.length / changelogPageSize.value))

function getUserNameById(id: string | User): string {
  if (typeof id === 'object') return id.name
  const user = mockUsers.find(u => u._id === id)
  return user ? user.name : '-'
}

function getItemTitle(refId: string): string {
  const item = mockItems.find(i => i._id === refId)
  return item ? item.title : refId
}

function formatDate(dateStr: string): string {
  return dateStr
}

async function toggleSwitch(sw: { key: string; value: boolean }) {
  try {
    await api.configs.updateSwitch(sw.key, !sw.value)
    sw.value = !sw.value
  } catch (e) {
    console.error('切换开关失败', e)
  }
}

function startEditTemplate(tpl: { id: string; label: string }) {
  editingTemplateId.value = tpl.id
  editingTemplateLabel.value = tpl.label
}

function cancelEditTemplate() {
  editingTemplateId.value = null
  editingTemplateLabel.value = ''
}

function saveTemplate(tpl: { id: string; label: string }) {
  tpl.label = editingTemplateLabel.value
  editingTemplateId.value = null
  editingTemplateLabel.value = ''
}

async function addTemplate() {
  if (!newTemplateLabel.value.trim()) return
  const newValue = `custom_${Date.now()}` as ReviewConclusion
  templates.value.push({
    id: String(Date.now()),
    value: newValue,
    label: newTemplateLabel.value.trim(),
  })
  newTemplateLabel.value = ''
}

async function deleteTemplate(id: string) {
  const idx = templates.value.findIndex(t => t.id === id)
  if (idx > -1) {
    templates.value.splice(idx, 1)
  }
}

function openAddDepartment() {
  isEditingDepartment.value = false
  editingDepartment.value = { name: '', head: '' }
  departmentModalVisible.value = true
}

function openEditDepartment(dept: Department) {
  isEditingDepartment.value = true
  editingDepartment.value = { ...dept }
  departmentModalVisible.value = true
}

async function saveDepartment() {
  try {
    if (isEditingDepartment.value && editingDepartment.value._id) {
      await api.configs.updateDepartment(editingDepartment.value._id, {
        name: editingDepartment.value.name,
        head: editingDepartment.value.head as string,
      })
      const idx = departments.value.findIndex(d => d._id === editingDepartment.value._id)
      if (idx > -1) {
        departments.value[idx] = {
          ...departments.value[idx],
          name: editingDepartment.value.name || '',
          head: editingDepartment.value.head || '',
          updatedAt: new Date().toISOString(),
        }
      }
    } else {
      const result = await api.configs.createDepartment({
        name: editingDepartment.value.name || '',
        head: editingDepartment.value.head as string,
      })
      departments.value.push({
        _id: result.data?._id || String(Date.now()),
        name: editingDepartment.value.name || '',
        head: editingDepartment.value.head || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    departmentModalVisible.value = false
  } catch (e) {
    console.error('保存部门失败', e)
  }
}

const deleteConfirmVisible = ref(false)
const deletingDepartmentId = ref<string | null>(null)

function confirmDeleteDepartment(id: string) {
  deletingDepartmentId.value = id
  deleteConfirmVisible.value = true
}

async function deleteDepartment() {
  if (!deletingDepartmentId.value) return
  try {
    await api.configs.deleteDepartment(deletingDepartmentId.value)
    const idx = departments.value.findIndex(d => d._id === deletingDepartmentId.value)
    if (idx > -1) {
      departments.value.splice(idx, 1)
    }
    deleteConfirmVisible.value = false
    deletingDepartmentId.value = null
  } catch (e) {
    console.error('删除部门失败', e)
  }
}

function openUploadModal() {
  selectedFile.value = null
  selectedRefId.value = ''
  uploadModalVisible.value = true
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

async function uploadAttachment() {
  if (!selectedFile.value || !selectedRefId.value) return
  try {
    const result = await api.configs.uploadAttachment(selectedFile.value, selectedRefId.value, 'item')
    mockAttachments.unshift({
      _id: result.data?._id || String(Date.now()),
      filename: selectedFile.value.name,
      url: result.data?.url || '',
      version: 1,
      refId: selectedRefId.value,
      refType: 'item',
      operator: 'current',
      createdAt: new Date().toISOString(),
    })
    uploadModalVisible.value = false
  } catch (e) {
    console.error('上传附件失败', e)
  }
}

function downloadAttachment(attachment: Attachment) {
  console.log('下载附件:', attachment.filename)
}

function deleteAttachment(id: string) {
  const idx = mockAttachments.findIndex(a => a._id === id)
  if (idx > -1) {
    mockAttachments.splice(idx, 1)
  }
}

onMounted(() => {
  departments.value = mockDepartments
  users.value = mockUsers
  attachments.value = mockAttachments
  changelog.value = mockChangelog
  totalChangelog.value = mockChangelog.length
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
      <button
        v-for="tab in tabItems"
        :key="tab.key"
        @click="activeTab = tab.key as any"
        class="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap"
        :class="[
          activeTab === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        ]"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <div v-show="activeTab === 'switches'" class="space-y-4">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Settings class="w-5 h-5 text-primary" />
          系统开关配置
        </h3>

        <div class="space-y-4">
          <div
            v-for="sw in switches"
            :key="sw.key"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h4 class="font-medium text-gray-900">{{ sw.name }}</h4>
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    sw.value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600',
                  ]"
                >
                  {{ sw.value ? '已开启' : '已关闭' }}
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-500">{{ sw.description }}</p>
            </div>
            <button
              @click="toggleSwitch(sw)"
              class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full transition-colors duration-200 ease-in-out focus:outline-none"
              :class="sw.value ? 'bg-primary' : 'bg-gray-200'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out"
                :class="sw.value ? 'translate-x-5' : 'translate-x-0'"
            />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'templates'" class="space-y-4">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <FileText class="w-5 h-5 text-primary" />
          复盘结论模板
        </h3>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">新增模板</label>
          <div class="flex items-center gap-3">
            <input
              v-model="newTemplateLabel"
              type="text"
              placeholder="请输入模板名称"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              @keyup.enter="addTemplate"
            />
            <button
              @click="addTemplate"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus class="w-4 h-4" />
              新增
            </button>
          </div>
        </div>

        <div class="mb-4">
          <p class="text-sm text-gray-500 mb-2">预设模板</p>
          <div class="space-y-2">
            <div
              v-for="tpl in templates"
              :key="tpl.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div v-if="editingTemplateId !== tpl.id" class="flex items-center gap-3">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border',
                    tpl.value === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                    tpl.value === 'partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    tpl.value === 'incomplete' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-orange-50 text-orange-700 border-orange-200',
                  ]"
                >
                  {{ tpl.label }}
                </span>
                <span class="text-xs text-gray-400">{{ tpl.value }}</span>
              </div>
              <div v-else class="flex-1 flex items-center gap-2">
                <input
                  v-model="editingTemplateLabel"
                  type="text"
                  class="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div v-if="editingTemplateId !== tpl.id" class="flex items-center gap-2">
                <button
                  @click="startEditTemplate(tpl)"
                  class="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Edit2 class="w-4 h-4" />
                </button>
                <button
                  @click="deleteTemplate(tpl.id)"
                  class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <div v-else class="flex items-center gap-2">
                <button
                  @click="saveTemplate(tpl)"
                  class="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Save class="w-4 h-4" />
                </button>
                <button
                  @click="cancelEditTemplate"
                  class="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'departments'" class="space-y-4">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Building2 class="w-5 h-5 text-primary" />
            责任部门管理
          </h3>
          <button
            @click="openAddDepartment"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus class="w-4 h-4" />
            新增部门
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-medium text-gray-500">部门名称</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">部门负责人</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">创建时间</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="dept in departments"
                :key="dept._id"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4 font-medium text-gray-900">{{ dept.name }}</td>
                <td class="py-3 px-4 text-gray-600">{{ getUserNameById(dept.head) }}</td>
                <td class="py-3 px-4 text-gray-500">{{ formatDate(dept.createdAt) }}</td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <button
                      @click="openEditDepartment(dept)"
                      class="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      @click="confirmDeleteDepartment(dept._id)"
                      class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'attachments'" class="space-y-4">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Paperclip class="w-5 h-5 text-primary" />
            附件版本管理
          </h3>
          <button
            @click="openUploadModal"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus class="w-4 h-4" />
            上传新附件
          </button>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">按事项筛选</label>
          <select
            v-model="attachmentFilter"
            class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">全部事项</option>
            <option v-for="item in mockItems" :key="item._id" :value="item._id">
              {{ item.title }}
            </option>
          </select>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-medium text-gray-500">文件名</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">版本号</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">关联事项</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">上传人</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">上传时间</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="att in filteredAttachments"
                :key="att._id"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4 font-medium text-gray-900">{{ att.filename }}</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded bg-accent/10 text-accent text-xs font-medium">
                    v{{ att.version }}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-600">{{ getItemTitle(att.refId) }}</td>
                <td class="py-3 px-4 text-gray-600">{{ getUserNameById(att.operator) }}</td>
                <td class="py-3 px-4 text-gray-500">{{ formatDate(att.createdAt) }}</td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <button
                      @click="downloadAttachment(att)"
                      class="px-3 py-1 text-primary hover:bg-primary/10 rounded-lg text-xs font-medium transition-colors"
                    >
                      下载
                    </button>
                    <button
                      @click="deleteAttachment(att._id)"
                      class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'changelog'" class="space-y-4">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <History class="w-5 h-5 text-primary" />
          变更记录
        </h3>

        <div class="relative">
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div class="space-y-6">
            <div
              v-for="(log, index) in paginatedChangelog"
              :key="log._id"
              class="relative pl-10"
            >
              <div class="absolute left-0 w-8 h-8 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center">
              <History class="w-4 h-4 text-primary" />
            </div>

              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-start justify-between">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900">{{ getUserNameById(log.operator) }}</span>
                      <span class="text-sm text-gray-500">{{ log.createdAt }}</span>
                    </div>
                    <p class="mt-1 text-sm text-gray-700">
                      变更了「{{ log.detail.field }}」字段
                    </p>
                    <div class="mt-2 flex items-center gap-2 text-sm">
                      <span v-if="log.detail.oldValue !== null && log.detail.oldValue !== undefined" class="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-700">
                        {{ log.detail.oldValue }}
                      </span>
                      <span class="text-gray-400">→</span>
                      <span class="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700">
                        {{ log.detail.newValue }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6">
          <Pagination
            :current-page="changelogPage"
            :total-pages="totalChangelogPages"
            :total-items="mockChangelog.length"
            @update:current-page="changelogPage = $event"
          />
        </div>
      </div>
    </div>

    <Modal
      v-model:visible="departmentModalVisible"
      :title="isEditingDepartment ? '编辑部门' : '新增部门'"
      :confirm-text="isEditingDepartment ? '保存' : '创建'"
      @confirm="saveDepartment"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">部门名称</label>
          <input
            v-model="editingDepartment.name"
            type="text"
            placeholder="请输入部门名称"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">部门负责人</label>
          <select
            v-model="editingDepartment.head"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">请选择负责人</option>
            <option v-for="user in users" :key="user._id" :value="user._id">
              {{ user.name }}
            </option>
          </select>
        </div>
      </div>
    </Modal>

    <Modal
      v-model:visible="deleteConfirmVisible"
      title="确认删除"
      confirm-text="确认删除"
      @confirm="deleteDepartment"
    >
      <div class="text-center py-4">
        <div class="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <Trash2 class="w-6 h-6 text-red-500" />
        </div>
        <p class="text-gray-600">确定要删除该部门吗？此操作不可恢复。</p>
      </div>
    </Modal>

    <Modal
      v-model:visible="uploadModalVisible"
      title="上传附件"
      confirm-text="上传"
      @confirm="uploadAttachment"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">关联事项</label>
          <select
            v-model="selectedRefId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">请选择关联事项</option>
            <option v-for="item in mockItems" :key="item._id" :value="item._id">
              {{ item.title }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择文件</label>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
            <input
              type="file"
              @change="handleFileChange"
              class="hidden"
              id="file-upload"
            />
            <label for="file-upload" class="cursor-pointer">
              <Paperclip class="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p v-if="selectedFile" class="text-sm text-gray-900 font-medium">{{ selectedFile.name }}</p>
              <p v-else class="text-sm text-gray-500">点击或拖拽文件到此处上传</p>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>
