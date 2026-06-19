<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">项目总览</h1>
        <p class="text-slate-500 mt-1">实时掌握所有项目的巡检进度和预算情况</p>
      </div>
      <button class="btn-primary" @click="showCreateModal = true">
        <Plus class="w-4 h-4 mr-1" />
        新建项目
      </button>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="card p-5"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-slate-500">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-slate-800 mt-2">{{ stat.value }}</p>
            <p class="text-xs mt-1" :class="stat.trend > 0 ? 'text-success-600' : 'text-slate-400'">
              <span v-if="stat.trend > 0">↑ {{ stat.trend }} 较上周</span>
              <span v-else>— 暂无变化</span>
            </p>
          </div>
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center"
            :class="stat.bgClass"
          >
            <component :is="stat.icon" class="w-5 h-5" :class="stat.iconClass" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-slate-800">近期项目</h2>
          <NuxtLink to="/projects" class="text-sm text-primary-600 hover:text-primary-700">
            查看全部 →
          </NuxtLink>
        </div>
        <div class="space-y-3">
          <div
            v-for="project in recentProjects"
            :key="project.id"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            @click="navigateToProject(project.id)"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
                :class="projectStatusColor(project.status)"
              >
                {{ project.name.charAt(0) }}
              </div>
              <div>
                <p class="font-medium text-slate-800">{{ project.name }}</p>
                <p class="text-xs text-slate-500">业主：{{ project.ownerName }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span
                v-if="project.isDelayed"
                class="badge-danger flex items-center gap-1"
              >
                <AlertTriangle class="w-3 h-3" />
                已延期
              </span>
              <span class="text-sm text-slate-500">
                ¥{{ project.currentBudgetVersion?.totalAmount?.toLocaleString() || '0' }}
              </span>
              <span class="badge" :class="projectBadgeClass(project.status)">
                {{ projectStatusLabel(project.status) }}
              </span>
            </div>
          </div>
          <div v-if="recentProjects.length === 0" class="text-center py-8 text-slate-400">
            暂无项目
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-slate-800">待办提醒</h2>
          <span class="badge-warning">{{ pendingCount }} 项</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="item in pendingItems"
            :key="item.id"
            class="p-3 bg-slate-50 rounded-lg"
          >
            <div class="flex items-start gap-2">
              <component
                :is="item.icon"
                class="w-4 h-4 mt-0.5 flex-shrink-0"
                :class="item.iconClass"
              />
              <div>
                <p class="text-sm font-medium text-slate-700">{{ item.title }}</p>
                <p class="text-xs text-slate-500 mt-0.5">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-slate-800">最新巡检动态</h2>
      </div>
      <div class="relative">
        <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
        <div class="space-y-4">
          <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="relative pl-10"
          >
            <div
              class="absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 border-white"
              :class="activity.dotClass"
            ></div>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-700">
                  <span class="font-medium">{{ activity.user }}</span>
                  {{ activity.action }}
                  <span class="text-primary-600 font-medium">{{ activity.target }}</span>
                </p>
                <p class="text-xs text-slate-400 mt-0.5">{{ activity.time }}</p>
              </div>
              <span class="text-xs text-slate-400">{{ activity.project }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showCreateModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-lg p-6 animate-slide-up">
          <h3 class="text-lg font-bold text-slate-800 mb-5">新建项目</h3>
          <form @submit.prevent="handleCreateProject" class="space-y-4">
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
              <textarea
                v-model="newProject.description"
                class="input h-24 resize-none"
                placeholder="请输入项目描述"
              ></textarea>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="showCreateModal = false">
                取消
              </button>
              <button type="submit" class="btn-primary">
                创建项目
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Plus,
  FolderKanban,
  ClipboardCheck,
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle,
  FileText,
} from 'lucide-vue-next'
import type { Project, User } from '~/types'

const projects = ref<Project[]>([])
const owners = ref<User[]>([])
const showCreateModal = ref(false)

const newProject = reactive({
  name: '',
  startDate: '',
  endDate: '',
  ownerId: '',
  description: '',
})

const stats = computed(() => [
  {
    label: '进行中项目',
    value: projects.value.filter(p => p.status === 'in_progress').length,
    trend: 2,
    icon: FolderKanban,
    bgClass: 'bg-primary-100',
    iconClass: 'text-primary-600',
  },
  {
    label: '待验收',
    value: projects.value.filter(p => p.inspectionCount && p.inspectionCount > 0).length,
    trend: 1,
    icon: ClipboardCheck,
    bgClass: 'bg-warning-100',
    iconClass: 'text-warning-600',
  },
  {
    label: '已延期',
    value: projects.value.filter(p => p.isDelayed).length,
    trend: 0,
    icon: AlertTriangle,
    bgClass: 'bg-danger-100',
    iconClass: 'text-danger-600',
  },
  {
    label: '本月预算变化',
    value: '¥' + '28,500',
    trend: 3,
    icon: DollarSign,
    bgClass: 'bg-success-100',
    iconClass: 'text-success-600',
  },
])

const recentProjects = computed(() => projects.value.slice(0, 5))

const pendingCount = computed(() => pendingItems.value.length)

const pendingItems = computed(() => {
  const items: any[] = []

  const delayedProjects = projects.value.filter(p => p.isDelayed)
  if (delayedProjects.length > 0) {
    items.push({
      id: 'delay-1',
      title: `${delayedProjects.length} 个项目已延期`,
      desc: '请及时跟进处理',
      icon: AlertTriangle,
      iconClass: 'text-danger-500',
    })
  }

  const pendingInspections = projects.value.filter(p => p.status === 'in_progress')
  if (pendingInspections.length > 0) {
    items.push({
      id: 'inspect-1',
      title: `${pendingInspections.length} 个项目待巡检`,
      desc: '请分派巡检人员',
      icon: Clock,
      iconClass: 'text-warning-500',
    })
  }

  items.push({
    id: 'budget-1',
    title: '3 个预算版本待确认',
    desc: '等待业主确认',
    icon: FileText,
    iconClass: 'text-primary-500',
  })

  return items.slice(0, 4)
})

const recentActivities = ref([
  {
    id: '1',
    user: '张巡检',
    action: '提交了巡检报告',
    target: '水电工程验收',
    project: '万科城一期A栋',
    time: '10 分钟前',
    dotClass: 'bg-success-500',
  },
  {
    id: '2',
    user: '李经理',
    action: '分派了新的巡检任务',
    target: '瓦工阶段巡检',
    project: '碧桂园2号楼',
    time: '1 小时前',
    dotClass: 'bg-primary-500',
  },
  {
    id: '3',
    user: '王业主',
    action: '确认了预算版本',
    target: '第3版预算',
    project: '华润城花园',
    time: '3 小时前',
    dotClass: 'bg-warning-500',
  },
  {
    id: '4',
    user: '张巡检',
    action: '记录了整改项',
    target: '墙面平整度问题',
    project: '万科城一期A栋',
    time: '昨天',
    dotClass: 'bg-danger-500',
  },
])

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

const navigateToProject = (id: string) => {
  navigateTo(`/projects/${id}`)
}

const fetchProjects = async () => {
  try {
    const data = await $fetch<any>('/api/projects?pageSize=10')
    projects.value = data.data
  } catch {
    projects.value = mockProjects
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

const handleCreateProject = async () => {
  if (!newProject.name || !newProject.ownerId) {
    return
  }

  try {
    await $fetch('/api/projects', {
      method: 'POST',
      body: {
        name: newProject.name,
        ownerId: newProject.ownerId,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
        description: newProject.description,
      },
    })
    showCreateModal.value = false
    fetchProjects()
    newProject.name = ''
    newProject.startDate = ''
    newProject.endDate = ''
    newProject.ownerId = ''
    newProject.description = ''
  } catch (err: any) {
    console.error('创建失败:', err)
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
    currentBudgetVersion: {
      id: '1',
      projectId: '1',
      version: 3,
      totalAmount: 285000,
      changeAmount: 15000,
      status: 'confirmed',
      confirmedAt: '2024-01-15',
      confirmedBy: '1',
      createdBy: '2',
      creatorName: '李经理',
      items: [],
      createdAt: '2024-01-10',
    },
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    attachments: [],
    isDelayed: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-20',
  },
  {
    id: '2',
    name: '碧桂园2号楼',
    ownerId: '2',
    ownerName: '李女士',
    status: 'in_progress',
    currentBudgetVersionId: '2',
    currentBudgetVersion: {
      id: '2',
      projectId: '2',
      version: 2,
      totalAmount: 350000,
      changeAmount: 0,
      status: 'confirmed',
      confirmedAt: '2024-01-05',
      confirmedBy: '2',
      createdBy: '2',
      creatorName: '李经理',
      items: [],
      createdAt: '2024-01-02',
    },
    startDate: '2024-01-05',
    endDate: '2024-01-20',
    attachments: [],
    isDelayed: true,
    createdAt: '2024-01-02',
    updatedAt: '2024-01-18',
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
    isDelayed: false,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-18',
  },
]

onMounted(() => {
  fetchProjects()
  fetchOwners()
})

definePageMeta({
  layout: 'default',
})
</script>
