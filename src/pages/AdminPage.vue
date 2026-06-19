<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, Pencil, Trash2, Check, X, Loader2, Inbox, ToggleLeft, ToggleRight } from 'lucide-vue-next'
import { adminApi } from '@/api'
import type { Dictionary, ReminderThreshold, DefaultAssignee, User, UserRole } from '@/types'

type TabKey = 'dictionaries' | 'thresholds' | 'assignees' | 'users'

const activeTab = ref<TabKey>('dictionaries')
const tabs: { key: TabKey; label: string }[] = [
  { key: 'dictionaries', label: '字典管理' },
  { key: 'thresholds', label: '提醒阈值' },
  { key: 'assignees', label: '默认负责人' },
  { key: 'users', label: '用户管理' },
]

const dictCategoryOptions = [
  { label: '部门', value: 'department' },
  { label: '需求类型', value: 'requirement_type' },
  { label: '优先级', value: 'priority' },
]

const roleOptions: { label: string; value: UserRole }[] = [
  { label: '值班人员', value: 'duty_staff' },
  { label: '项目PM', value: 'project_pm' },
  { label: '管理员', value: 'admin' },
]

const roleLabelMap: Record<UserRole, string> = {
  duty_staff: '值班人员',
  project_pm: '项目PM',
  admin: '管理员',
}

const users = ref<User[]>([])

async function fetchUsers() {
  try {
    const res = await adminApi.users.list()
    users.value = res.data
  } catch {}
}

const deptOptions = ref<{ label: string; value: string }[]>([])
const typeOptions = ref<{ label: string; value: string }[]>([])

async function fetchDictOptions() {
  try {
    const [deptRes, typeRes] = await Promise.all([
      adminApi.dictionaries.list('department'),
      adminApi.dictionaries.list('requirement_type'),
    ])
    deptOptions.value = deptRes.data.filter((d: Dictionary) => d.isActive).map((d: Dictionary) => ({ label: d.value, value: d.key }))
    typeOptions.value = typeRes.data.filter((d: Dictionary) => d.isActive).map((d: Dictionary) => ({ label: d.value, value: d.key }))
  } catch {}
}

const dictionaries = ref<Dictionary[]>([])
const dictLoading = ref(false)
const dictFilter = ref('')
const dictFormVisible = ref(false)
const dictEditingId = ref<number | null>(null)
const dictForm = ref({ category: 'department', key: '', value: '', sortOrder: 0, isActive: true })

async function fetchDictionaries() {
  dictLoading.value = true
  try {
    const res = await adminApi.dictionaries.list(dictFilter.value || undefined)
    dictionaries.value = res.data
  } finally {
    dictLoading.value = false
  }
}

function resetDictForm() {
  dictForm.value = { category: 'department', key: '', value: '', sortOrder: 0, isActive: true }
  dictEditingId.value = null
  dictFormVisible.value = false
}

function editDict(item: Dictionary) {
  dictForm.value = { category: item.category, key: item.key, value: item.value, sortOrder: item.sortOrder, isActive: item.isActive }
  dictEditingId.value = item.id
  dictFormVisible.value = true
}

async function saveDict() {
  try {
    if (dictEditingId.value) {
      await adminApi.dictionaries.update(dictEditingId.value, dictForm.value)
    } else {
      await adminApi.dictionaries.create(dictForm.value)
    }
    resetDictForm()
    await fetchDictionaries()
  } catch {}
}

async function deleteDict(id: number) {
  if (!confirm('确认删除此条目？')) return
  try {
    await adminApi.dictionaries.delete(id)
    await fetchDictionaries()
  } catch {}
}

async function toggleDictStatus(item: Dictionary) {
  try {
    await adminApi.dictionaries.update(item.id, { isActive: !item.isActive })
    await fetchDictionaries()
  } catch {}
}

const thresholds = ref<ReminderThreshold[]>([])
const thresholdLoading = ref(false)
const thresholdFormVisible = ref(false)
const thresholdEditingId = ref<number | null>(null)
const thresholdForm = ref({ name: '', category: '', daysBeforeDeadline: 3, reminderInterval: 24, isActive: true })

async function fetchThresholds() {
  thresholdLoading.value = true
  try {
    const res = await adminApi.thresholds.list()
    thresholds.value = res.data
  } finally {
    thresholdLoading.value = false
  }
}

function resetThresholdForm() {
  thresholdForm.value = { name: '', category: '', daysBeforeDeadline: 3, reminderInterval: 24, isActive: true }
  thresholdEditingId.value = null
  thresholdFormVisible.value = false
}

function editThreshold(item: ReminderThreshold) {
  thresholdForm.value = { name: item.name, category: item.category, daysBeforeDeadline: item.daysBeforeDeadline, reminderInterval: item.reminderInterval, isActive: item.isActive }
  thresholdEditingId.value = item.id
  thresholdFormVisible.value = true
}

async function saveThreshold() {
  try {
    if (thresholdEditingId.value) {
      await adminApi.thresholds.update(thresholdEditingId.value, thresholdForm.value)
    } else {
      await adminApi.thresholds.create(thresholdForm.value)
    }
    resetThresholdForm()
    await fetchThresholds()
  } catch {}
}

async function deleteThreshold(id: number) {
  if (!confirm('确认删除此条目？')) return
  try {
    await adminApi.thresholds.delete(id)
    await fetchThresholds()
  } catch {}
}

async function toggleThresholdStatus(item: ReminderThreshold) {
  try {
    await adminApi.thresholds.update(item.id, { isActive: !item.isActive })
    await fetchThresholds()
  } catch {}
}

const assignees = ref<DefaultAssignee[]>([])
const assigneeLoading = ref(false)
const assigneeFormVisible = ref(false)
const assigneeEditingId = ref<number | null>(null)
const assigneeForm = ref({ department: '', requirementType: '', userId: 0 })

async function fetchAssignees() {
  assigneeLoading.value = true
  try {
    const res = await adminApi.defaultAssignees.list()
    assignees.value = res.data
  } finally {
    assigneeLoading.value = false
  }
}

function resetAssigneeForm() {
  assigneeForm.value = { department: '', requirementType: '', userId: 0 }
  assigneeEditingId.value = null
  assigneeFormVisible.value = false
}

function editAssignee(item: DefaultAssignee) {
  assigneeForm.value = { department: item.department, requirementType: item.requirementType, userId: item.userId }
  assigneeEditingId.value = item.id
  assigneeFormVisible.value = true
}

async function saveAssignee() {
  try {
    if (assigneeEditingId.value) {
      await adminApi.defaultAssignees.update(assigneeEditingId.value, assigneeForm.value)
    } else {
      await adminApi.defaultAssignees.create(assigneeForm.value)
    }
    resetAssigneeForm()
    await fetchAssignees()
  } catch {}
}

async function deleteAssignee(id: number) {
  if (!confirm('确认删除此条目？')) return
  try {
    await adminApi.defaultAssignees.delete(id)
    await fetchAssignees()
  } catch {}
}

const userList = ref<User[]>([])
const userLoading = ref(false)
const userFormVisible = ref(false)
const userEditingId = ref<number | null>(null)
const userForm = ref({ name: '', email: '', password: '', role: 'duty_staff' as UserRole, isActive: true })

async function fetchUserList() {
  userLoading.value = true
  try {
    const res = await adminApi.users.list()
    userList.value = res.data
  } finally {
    userLoading.value = false
  }
}

function resetUserForm() {
  userForm.value = { name: '', email: '', password: '', role: 'duty_staff', isActive: true }
  userEditingId.value = null
  userFormVisible.value = false
}

function editUser(item: User) {
  userForm.value = { name: item.name, email: item.email, password: '', role: item.role, isActive: item.isActive }
  userEditingId.value = item.id
  userFormVisible.value = true
}

async function saveUser() {
  try {
    if (userEditingId.value) {
      const data: Partial<User> = { name: userForm.value.name, email: userForm.value.email, role: userForm.value.role, isActive: userForm.value.isActive }
      await adminApi.users.update(userEditingId.value, data)
    } else {
      await adminApi.users.create(userForm.value)
    }
    resetUserForm()
    await fetchUserList()
    await fetchUsers()
  } catch {}
}

async function deleteUser(id: number) {
  if (!confirm('确认删除此用户？')) return
  try {
    await adminApi.users.delete(id)
    await fetchUserList()
    await fetchUsers()
  } catch {}
}

async function toggleUserStatus(item: User) {
  try {
    await adminApi.users.update(item.id, { isActive: !item.isActive })
    await fetchUserList()
    await fetchUsers()
  } catch {}
}

function formatDate(date: string) {
  if (!date) return '-'
  return date.slice(0, 16).replace('T', ' ')
}

watch(activeTab, (tab) => {
  if (tab === 'dictionaries') fetchDictionaries()
  else if (tab === 'thresholds') fetchThresholds()
  else if (tab === 'assignees') { fetchAssignees(); fetchDictOptions(); fetchUsers() }
  else if (tab === 'users') fetchUserList()
}, { immediate: true })
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-slate-800 mb-6">后台管理</h1>

    <div class="flex border-b mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="px-5 py-2.5 text-sm font-medium transition-colors relative -mb-px border-b-2"
        :class="activeTab === tab.key
          ? 'text-amber-600 border-amber-500'
          : 'text-slate-500 border-transparent hover:text-slate-700'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'dictionaries'">
      <div class="flex items-center justify-between mb-4">
        <select v-model="dictFilter" class="select w-auto min-w-[160px]" @change="fetchDictionaries">
          <option value="">全部类别</option>
          <option v-for="opt in dictCategoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <button class="btn-accent" @click="resetDictForm(); dictFormVisible = true">
          <Plus class="w-4 h-4 mr-1" />
          添加字典
        </button>
      </div>

      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">类别</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Key</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Value</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">排序</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">状态</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="dictFormVisible" class="border-b border-slate-100 bg-amber-50/50">
                <td class="px-4 py-2">
                  <select v-model="dictForm.category" class="select text-sm">
                    <option v-for="opt in dictCategoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </td>
                <td class="px-4 py-2"><input v-model="dictForm.key" class="input text-sm" /></td>
                <td class="px-4 py-2"><input v-model="dictForm.value" class="input text-sm" /></td>
                <td class="px-4 py-2"><input v-model.number="dictForm.sortOrder" type="number" class="input text-sm w-20" /></td>
                <td class="px-4 py-2">
                  <span class="badge" :class="dictForm.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                    {{ dictForm.isActive ? '启用' : '禁用' }}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <div class="flex items-center gap-1">
                    <button class="btn-accent btn-sm" @click="saveDict"><Check class="w-3.5 h-3.5" /></button>
                    <button class="btn-outline btn-sm" @click="resetDictForm"><X class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
              <tr v-if="dictLoading">
                <td colspan="6" class="text-center py-12 text-slate-400">
                  <Loader2 class="w-6 h-6 mx-auto animate-spin" />
                </td>
              </tr>
              <tr v-else-if="dictionaries.length === 0 && !dictFormVisible">
                <td colspan="6" class="text-center py-16">
                  <div class="flex flex-col items-center text-slate-400">
                    <Inbox class="w-12 h-12 mb-3" />
                    <span>暂无数据</span>
                  </div>
                </td>
              </tr>
              <tr
                v-for="item in dictionaries"
                :key="item.id"
                class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td class="px-4 py-3 whitespace-nowrap text-slate-600">
                  {{ dictCategoryOptions.find(o => o.value === item.category)?.label ?? item.category }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-500">{{ item.key }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-slate-700">{{ item.value }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ item.sortOrder }}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <button class="cursor-pointer" @click="toggleDictStatus(item)">
                    <component :is="item.isActive ? ToggleRight : ToggleLeft" class="w-6 h-6" :class="item.isActive ? 'text-green-500' : 'text-slate-300'" />
                  </button>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <button class="btn-outline btn-sm" @click="editDict(item)">
                      <Pencil class="w-3.5 h-3.5" />
                    </button>
                    <button class="btn-danger btn-sm" @click="deleteDict(item.id)">
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'thresholds'">
      <div class="flex items-center justify-end mb-4">
        <button class="btn-accent" @click="resetThresholdForm(); thresholdFormVisible = true">
          <Plus class="w-4 h-4 mr-1" />
          添加阈值
        </button>
      </div>

      <div v-if="thresholdFormVisible" class="card p-4 mb-4">
        <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div>
            <label class="block text-xs text-slate-500 mb-1">名称</label>
            <input v-model="thresholdForm.name" class="input text-sm" />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">类别</label>
            <input v-model="thresholdForm.category" class="input text-sm" />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">截止前天数</label>
            <input v-model.number="thresholdForm.daysBeforeDeadline" type="number" class="input text-sm" />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">提醒间隔(小时)</label>
            <input v-model.number="thresholdForm.reminderInterval" type="number" class="input text-sm" />
          </div>
          <div class="flex items-end gap-2">
            <button class="btn-accent btn-sm" @click="saveThreshold"><Check class="w-3.5 h-3.5 mr-1" />保存</button>
            <button class="btn-outline btn-sm" @click="resetThresholdForm"><X class="w-3.5 h-3.5 mr-1" />取消</button>
          </div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">名称</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">类别</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">截止前天数</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">提醒间隔(小时)</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">状态</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="thresholdLoading">
                <td colspan="6" class="text-center py-12 text-slate-400">
                  <Loader2 class="w-6 h-6 mx-auto animate-spin" />
                </td>
              </tr>
              <tr v-else-if="thresholds.length === 0">
                <td colspan="6" class="text-center py-16">
                  <div class="flex flex-col items-center text-slate-400">
                    <Inbox class="w-12 h-12 mb-3" />
                    <span>暂无数据</span>
                  </div>
                </td>
              </tr>
              <tr
                v-for="item in thresholds"
                :key="item.id"
                class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td class="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">{{ item.name }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ item.category }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ item.daysBeforeDeadline }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ item.reminderInterval }}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <button class="cursor-pointer" @click="toggleThresholdStatus(item)">
                    <component :is="item.isActive ? ToggleRight : ToggleLeft" class="w-6 h-6" :class="item.isActive ? 'text-green-500' : 'text-slate-300'" />
                  </button>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <button class="btn-outline btn-sm" @click="editThreshold(item)">
                      <Pencil class="w-3.5 h-3.5" />
                    </button>
                    <button class="btn-danger btn-sm" @click="deleteThreshold(item.id)">
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'assignees'">
      <div class="flex items-center justify-end mb-4">
        <button class="btn-accent" @click="resetAssigneeForm(); assigneeFormVisible = true">
          <Plus class="w-4 h-4 mr-1" />
          添加负责人
        </button>
      </div>

      <div v-if="assigneeFormVisible" class="card p-4 mb-4">
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label class="block text-xs text-slate-500 mb-1">部门</label>
            <select v-model="assigneeForm.department" class="select text-sm">
              <option value="" disabled>请选择部门</option>
              <option v-for="opt in deptOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">需求类型</label>
            <select v-model="assigneeForm.requirementType" class="select text-sm">
              <option value="" disabled>请选择需求类型</option>
              <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">负责人</label>
            <select v-model="assigneeForm.userId" class="select text-sm">
              <option :value="0" disabled>请选择负责人</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          <div class="flex items-end gap-2">
            <button class="btn-accent btn-sm" @click="saveAssignee"><Check class="w-3.5 h-3.5 mr-1" />保存</button>
            <button class="btn-outline btn-sm" @click="resetAssigneeForm"><X class="w-3.5 h-3.5 mr-1" />取消</button>
          </div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">部门</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">需求类型</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">负责人</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="assigneeLoading">
                <td colspan="4" class="text-center py-12 text-slate-400">
                  <Loader2 class="w-6 h-6 mx-auto animate-spin" />
                </td>
              </tr>
              <tr v-else-if="assignees.length === 0 && !assigneeFormVisible">
                <td colspan="4" class="text-center py-16">
                  <div class="flex flex-col items-center text-slate-400">
                    <Inbox class="w-12 h-12 mb-3" />
                    <span>暂无数据</span>
                  </div>
                </td>
              </tr>
              <tr
                v-for="item in assignees"
                :key="item.id"
                class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td class="px-4 py-3 whitespace-nowrap text-slate-700">{{ item.department }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ item.requirementType }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ item.user?.name ?? '-' }}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <button class="btn-outline btn-sm" @click="editAssignee(item)">
                      <Pencil class="w-3.5 h-3.5" />
                    </button>
                    <button class="btn-danger btn-sm" @click="deleteAssignee(item.id)">
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'users'">
      <div class="flex items-center justify-end mb-4">
        <button class="btn-accent" @click="resetUserForm(); userFormVisible = true">
          <Plus class="w-4 h-4 mr-1" />
          添加用户
        </button>
      </div>

      <div v-if="userFormVisible" class="card p-4 mb-4">
        <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div>
            <label class="block text-xs text-slate-500 mb-1">姓名</label>
            <input v-model="userForm.name" class="input text-sm" />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">邮箱</label>
            <input v-model="userForm.email" type="email" class="input text-sm" />
          </div>
          <div v-if="!userEditingId">
            <label class="block text-xs text-slate-500 mb-1">密码</label>
            <input v-model="userForm.password" type="password" class="input text-sm" />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">角色</label>
            <select v-model="userForm.role" class="select text-sm">
              <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="flex items-end gap-2">
            <button class="btn-accent btn-sm" @click="saveUser"><Check class="w-3.5 h-3.5 mr-1" />保存</button>
            <button class="btn-outline btn-sm" @click="resetUserForm"><X class="w-3.5 h-3.5 mr-1" />取消</button>
          </div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">姓名</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">邮箱</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">角色</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">状态</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">创建时间</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="userLoading">
                <td colspan="6" class="text-center py-12 text-slate-400">
                  <Loader2 class="w-6 h-6 mx-auto animate-spin" />
                </td>
              </tr>
              <tr v-else-if="userList.length === 0">
                <td colspan="6" class="text-center py-16">
                  <div class="flex flex-col items-center text-slate-400">
                    <Inbox class="w-12 h-12 mb-3" />
                    <span>暂无数据</span>
                  </div>
                </td>
              </tr>
              <tr
                v-for="item in userList"
                :key="item.id"
                class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td class="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">{{ item.name }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ item.email }}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="badge bg-amber-100 text-amber-700">{{ roleLabelMap[item.role] }}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <button class="cursor-pointer" @click="toggleUserStatus(item)">
                    <component :is="item.isActive ? ToggleRight : ToggleLeft" class="w-6 h-6" :class="item.isActive ? 'text-green-500' : 'text-slate-300'" />
                  </button>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-slate-500">{{ formatDate(item.createdAt) }}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <button class="btn-outline btn-sm" @click="editUser(item)">
                      <Pencil class="w-3.5 h-3.5" />
                    </button>
                    <button class="btn-danger btn-sm" @click="deleteUser(item.id)">
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
