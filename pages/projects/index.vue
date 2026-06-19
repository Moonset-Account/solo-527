<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">项目管理</h1>
        <p class="text-slate-500 mt-1">管理所有项目及其巡检进度</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="keyword"
            type="text"
            class="input pl-9 w-64"
            placeholder="搜索项目..."
            @input="handleSearch"
          />
        </div>
        <button class="btn-primary" @click="showCreateModal = true">
          <Plus class="w-4 h-4 mr-1" />
          新建项目
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="currentStatus === tab.value ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-slate-100'"
        @click="currentStatus = tab.value"
      >
        {{ tab.label }}
        <span
          v-if="tab.count !== undefined"
          class="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-slate-200 text-slate-600"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <div class="card overflow-hidden">
      <table class="table">
        <thead>
          <tr>
            <th class="w-10">
              <input
                type="checkbox"
                class="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                :checked="isAllSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th>项目名称</th>
            <th>业主</th>
            <th>状态</th>
            <th>当前预算</th>
            <th>巡检次数</th>
            <th>计划周期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in projects" :key="project.id">
            <td>
              <input
                type="checkbox"
                class="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                :checked="selectedIds.includes(project.id)"
                @change="toggleSelection(project.id)"
              />
            </td>
            <td>
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                  :class="projectStatusColor(project.status)"
                >
                  {{ project.name.charAt(0) }}
                </div>
                <div>
                  <p class="font-medium text-slate-800 cursor-pointer hover:text-primary-600" @click="goToDetail(project.id)">
                    {{ project.name }}
                  </p>
                  <p v-if="project.isDelayed" class="text-xs text-danger-500 flex items-center gap-1">
                    <AlertTriangle class="w-3 h-3" />
                    已延期
                  </p>
                </div>
              </div>
            </td>
            <td>
              <span class="text-slate-700">{{ project.ownerName }}</span>
            </td>
            <td>
              <span class="badge" :class="projectBadgeClass(project.status)">
                {{ projectStatusLabel(project.status) }}
              </span>
            </td>
            <td>
              <span class="font-medium text-slate-800">
                ¥{{ project.currentBudgetVersion?.totalAmount?.toLocaleString() || '-' }}
              </span>
            </td>
            <td>
              <span class="text-slate-600">{{ project.inspectionCount || 0 }} 次</span>
            </td>
            <td>
              <span class="text-slate-500 text-sm">
                {{ formatDate(project.startDate) }} ~ {{ formatDate(project.endDate) }}
              </span>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <button
                  class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  @click="goToDetail(project.id)"
                >
                  查看
                </button>
                <button
                  class="text-slate-500 hover:text-slate-700 text-sm"
                  @click="assignInspection(project.id)"
                >
                  分派巡检
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="projects.length === 0">
            <td colspan="8" class="text-center py-12 text-slate-400">
              暂无项目数据
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between">
      <p class="text-sm text-slate-500">
        共 {{ total }} 个项目
      </p>
      <div class="flex items-center gap-2">
        <button
          class="btn-secondary text-sm px-3 py-1.5"
          :disabled="page === 1"
          @click="prevPage"
        >
          上一页
        </button>
        <span class="text-sm text-slate-600">第 {{ page }} / {{ totalPages }} 页</span>
        <button
          class="btn-secondary text-sm px-3 py-1.5"
          :disabled="page >= totalPages"
          @click="nextPage"
        >
          下一页
        </button>
      </div>
    </div>

    <div v-if="selectedIds.length > 0" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-slate-200 px-6 py-3 flex items-center gap-4 z-40">
      <span class="text-sm text-slate-600">
        已选择 <span class="font-medium text-primary-600">{{ selectedIds.length }}</span> 个项目
      </span>
      <button class="btn-primary text-sm px-4 py-1.5" @click="openBatchModal">
        批量操作
      </button>
      <button class="text-slate-400 hover:text-slate-600" @click="clearSelection">
        <X class="w-4 h-4" />
      </button>
    </div>

    <Transition name="fade">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showCreateModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-lg p-6 animate-slide-up">
          <h3 class="text-lg font-bold text-slate-800 mb-5">新建项目</h3>
          <form @submit.prevent="handleCreate" class="space-y-4">
            <div>
              <label class="input-label">项目名称</label>
              <input v-model="newProject.name" class="input" placeholder="请输入项目名称" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="input-label">开始日期</label>
                <input v-model="newProject.startDate" type="date" class="input" />
              </div>
              <div>
                <label class="input-label">预计完成</label>
                <input v-model="newProject.endDate" type="date" class="input" />
              </div>
            </div>
            <div>
              <label class="input-label">业主</label>
              <select v-model="newProject.ownerId" class="input">
                <option value="">请选择业主</option>
                <option v-for="owner in owners" :key="owner.id" :value="owner.id">
                  {{ owner.name }} ({{ owner.phone }})
                </option>
              </select>
            </div>
            <div>
              <label class="input-label">项目描述</label>
              <textarea v-model="newProject.description" class="input h-24 resize-none" placeholder="请输入项目描述"></textarea>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="showCreateModal = false">取消</button>
              <button type="submit" class="btn-primary">创建项目</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  Plus,
  Search,
  AlertTriangle,
  X,
} from 'lucide-vue-next'
import type { Project, User } from '~/types'

const projects = ref<Project[]>([])
const owners = ref<User[]>([])
const keyword = ref('')
const currentStatus = ref('all')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedIds = ref<string[]>([])
const showCreateModal = ref(false)

const newProject = reactive({
  name: '',
  startDate: '',
  endDate: '',
  ownerId: '',
  description: '',
})

const statusTabs = computed(() => [
  { label: '全部', value: 'all', count: total.value },
  { label: '进行中', value: 'in_progress' },
  { label: '报价中', value: 'quoting' },
  { label: '已完成', value: 'completed' },
  { label: '已延期', value: 'delayed' },
])

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

const isAllSelected = computed(() => {
  return projects.value.length > 0 && selectedIds.value.length === projects.value.length
})

const projectStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: '草稿',
    quoting: '报价中',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return labels[status] || status
}

const projectStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-slate-400',
    quoting: 'bg-warning-500',
    in_progress: 'bg-primary-500',
    completed: 'bg-success-500',
    cancelled: 'bg-slate-300',
  }
  return colors[status] || 'bg-slate-400'
}

const projectBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'badge-slate',
    quoting: 'badge-warning',
    in_progress: 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-slate',
  }
  return classes[status] || 'badge-slate'
}

const formatDate = (date: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const fetchProjects = async () => {
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (currentStatus.value !== 'all' && currentStatus.value !== 'delayed') {
      params.status = currentStatus.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }

    const data = await $fetch<any>('/api/projects', { query: params })

    if (currentStatus.value === 'delayed') {
      projects.value = data.data.filter((p: Project) => p.isDelayed)
      total.value = data.data.filter((p: Project) => p.isDelayed).length
    } else {
      projects.value = data.data
      total.value = data.total
    }
  } catch {
    projects.value = mockProjects
    total.value = mockProjects.length
  }
}

const fetchOwners = async () => {
  try {
    const data = await $fetch<User[]>('/api/users?role=owner')
    owners.value = data
  } catch {
    owners.value = []
  }
}

const handleSearch = () => {
  page.value = 1
  fetchProjects()
}

const toggleSelection = (id: string) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = projects.value.map(p => p.id)
  }
}

const clearSelection = () => {
  selectedIds.value = []
}

const goToDetail = (id: string) => {
  navigateTo(`/projects/${id}`)
}

const assignInspection = (id: string) => {
  // TODO: open inspection assignment modal
  console.log('Assign inspection to project:', id)
}

const openBatchModal = () => {
  navigateTo('/batch?ids=' + selectedIds.value.join(','))
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchProjects()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    fetchProjects()
  }
}

const handleCreate = async () => {
  if (!newProject.name || !newProject.ownerId) return

  try {
    await $fetch('/api/projects', {
      method: 'POST',
      body: { ...newProject },
    })
    showCreateModal.value = false
    Object.assign(newProject, { name: '', startDate: '', endDate: '', ownerId: '', description: '' })
    fetchProjects()
  } catch (err) {
    console.error('Create failed:', err)
  }
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: '万科城一期A栋',
    ownerId: '1',
    ownerName: '王先生',
    status: 'in_progress',
    currentBudgetVersionId: '1',
    currentBudgetVersion: { id: '1', projectId: '1', version: 3, totalAmount: 285000, changeAmount: 15000, status: 'confirmed', confirmedAt: '', confirmedBy: '', createdBy: '', items: [], createdAt: '' },
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    attachments: [],
    inspectionCount: 5,
    isDelayed: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '2',
    name: '碧桂园2号楼',
    ownerId: '2',
    ownerName: '李女士',
    status: 'in_progress',
    currentBudgetVersionId: '2',
    currentBudgetVersion: { id: '2', projectId: '2', version: 2, totalAmount: 350000, changeAmount: 0, status: 'confirmed', confirmedAt: '', confirmedBy: '', createdBy: '', items: [], createdAt: '' },
    startDate: '2024-01-05',
    endDate: '2024-01-20',
    attachments: [],
    inspectionCount: 3,
    isDelayed: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '3',
    name: '华润城花园',
    ownerId: '3',
    ownerName: '张先生',
    status: 'quoting',
    currentBudgetVersionId: null,
    startDate: '2024-02-01',
    endDate: '2024-08-31',
    attachments: [],
    inspectionCount: 0,
    isDelayed: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '4',
    name: '保利天汇广场',
    ownerId: '4',
    ownerName: '刘女士',
    status: 'completed',
    currentBudgetVersionId: '3',
    currentBudgetVersion: { id: '3', projectId: '4', version: 4, totalAmount: 520000, changeAmount: 45000, status: 'confirmed', confirmedAt: '', confirmedBy: '', createdBy: '', items: [], createdAt: '' },
    startDate: '2023-09-01',
    endDate: '2024-01-10',
    attachments: [],
    inspectionCount: 12,
    isDelayed: false,
    createdAt: '',
    updatedAt: '',
  },
]

watch(currentStatus, () => {
  page.value = 1
  fetchProjects()
})

onMounted(() => {
  fetchProjects()
  fetchOwners()
})

definePageMeta({ layout: 'default' })
</script>
