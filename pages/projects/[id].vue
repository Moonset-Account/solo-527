<template>
  <div class="space-y-6" v-if="project">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="p-2 hover:bg-slate-100 rounded-lg transition-colors" @click="goBack">
          <ArrowLeft class="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-slate-800">{{ project.name }}</h1>
            <span class="badge" :class="projectBadgeClass(project.status)">
              {{ projectStatusLabel(project.status) }}
            </span>
            <span v-if="project.isDelayed" class="badge-danger flex items-center gap-1">
              <AlertTriangle class="w-3 h-3" />
              已延期
            </span>
          </div>
          <p class="text-slate-500 mt-1">业主：{{ project.ownerName }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button class="btn-secondary" @click="activeTab = 'budget'">
          预算版本
        </button>
        <button class="btn-primary" @click="showAssignModal = true">
          <Plus class="w-4 h-4 mr-1" />
          分派巡检
        </button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-slate-500">当前预算</p>
        <p class="text-xl font-bold text-slate-800 mt-1">
          ¥{{ project.currentBudgetVersion?.totalAmount?.toLocaleString() || '-' }}
        </p>
        <p v-if="project.currentBudgetVersion?.changeAmount" class="text-xs text-warning-600 mt-1">
          较初版 {{ project.currentBudgetVersion.changeAmount >= 0 ? '+' : '' }}{{ project.currentBudgetVersion.changeAmount.toLocaleString() }} 元
        </p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">巡检次数</p>
        <p class="text-xl font-bold text-slate-800 mt-1">{{ project.inspections?.length || 0 }} 次</p>
        <p class="text-xs text-slate-400 mt-1">最近：{{ latestInspectionDate }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">待整改项</p>
        <p class="text-xl font-bold text-warning-600 mt-1">{{ pendingRectifications }}</p>
        <p class="text-xs text-slate-400 mt-1">需要跟进处理</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">计划周期</p>
        <p class="text-xl font-bold text-slate-800 mt-1">{{ projectPeriod }}</p>
        <p class="text-xs text-slate-400 mt-1">{{ remainingDays }}</p>
      </div>
    </div>

    <div class="flex gap-1 border-b border-slate-200">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
        :class="activeTab === tab.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'timeline'" class="card p-6">
      <h2 class="font-semibold text-slate-800 mb-6">巡检记录时间线</h2>
      <div class="relative">
        <div class="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>
        <div class="space-y-6">
          <div
            v-for="inspection in project.inspections"
            :key="inspection.id"
            class="relative pl-10 cursor-pointer group"
            @click="goToInspection(inspection.id)"
          >
            <div
              class="absolute left-2 top-1 w-4 h-4 rounded-full border-2 border-white z-10 transition-transform group-hover:scale-110"
              :class="inspectionStatusDot(inspection.status)"
            ></div>
            <div class="bg-slate-50 rounded-xl p-4 group-hover:bg-slate-100 transition-colors">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-medium text-slate-800">{{ inspection.title }}</h3>
                  <p class="text-sm text-slate-500 mt-1">
                    巡检员：{{ inspection.inspectorName }} · {{ formatDate(inspection.scheduledAt) }}
                  </p>
                </div>
                <span class="badge" :class="inspectionBadgeClass(inspection.status)">
                  {{ inspectionStatusLabel(inspection.status) }}
                </span>
              </div>
              <div v-if="inspection.photos?.length > 0" class="flex gap-2 mt-3">
                <div
                  v-for="(photo, idx) in inspection.photos.slice(0, 4)"
                  :key="idx"
                  class="w-16 h-16 rounded-lg bg-slate-200 overflow-hidden"
                >
                  <div class="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs">
                    现场照片
                  </div>
                </div>
              </div>
              <div v-if="inspection.rectifications?.length > 0" class="mt-3">
                <span class="text-xs text-warning-600 font-medium">
                  {{ inspection.rectifications.length }} 项整改待处理
                </span>
              </div>
              <div v-if="inspection.feedback" class="mt-3 p-3 bg-white rounded-lg">
                <p class="text-sm font-medium text-slate-700">验收结论：</p>
                <p class="text-sm text-slate-600 mt-1">
                  <span class="font-medium" :class="feedbackClass(inspection.feedback.conclusion)">
                    {{ feedbackLabel(inspection.feedback.conclusion) }}
                  </span>
                  <span v-if="inspection.feedback.remark"> - {{ inspection.feedback.remark }}</span>
                </p>
              </div>
            </div>
          </div>

          <div v-if="!project.inspections?.length" class="text-center py-12 text-slate-400">
            暂无巡检记录
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'budget'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-slate-800">预算版本历史</h2>
        <button class="btn-primary text-sm" @click="showBudgetModal = true">
          <Plus class="w-4 h-4 mr-1" />
          新建版本
        </button>
      </div>

      <div class="space-y-4">
        <div
          v-for="(version, index) in project.budgetVersions"
          :key="version.id"
          class="card p-5"
          :class="{ 'border-primary-300 bg-primary-50/30': index === 0 && version.status === 'confirmed' }"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                :class="version.status === 'confirmed' ? 'bg-success-500' : version.status === 'pending_confirm' ? 'bg-warning-500' : 'bg-slate-400'"
              >
                V{{ version.version }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-slate-800">第 {{ version.version }} 版预算</h3>
                  <span class="badge" :class="versionBadgeClass(version.status)">
                    {{ versionStatusLabel(version.status) }}
                  </span>
                </div>
                <p class="text-sm text-slate-500 mt-1">
                  创建人：{{ version.creatorName }} · {{ formatDateTime(version.createdAt) }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-slate-800">
                ¥{{ version.totalAmount.toLocaleString() }}
              </p>
              <p
                v-if="index < project.budgetVersions.length - 1"
                class="text-sm mt-1"
                :class="version.changeAmount >= 0 ? 'text-danger-600' : 'text-success-600'"
              >
                {{ version.changeAmount >= 0 ? '+' : '' }}{{ version.changeAmount.toLocaleString() }} 元
              </p>
            </div>
          </div>

          <div v-if="version.changeReason" class="mt-3 p-3 bg-slate-50 rounded-lg">
            <p class="text-sm text-slate-600">
              <span class="font-medium">变更原因：</span>{{ version.changeReason }}
            </p>
          </div>

          <div v-if="version.items?.length > 0" class="mt-4">
            <button
              class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              @click="toggleBudgetItems(version.id)"
            >
              {{ expandedBudgetIds.includes(version.id) ? '收起明细' : '展开明细' }}
              <ChevronDown
                class="w-4 h-4 transition-transform"
                :class="{ 'rotate-180': expandedBudgetIds.includes(version.id) }"
              />
            </button>

            <Transition name="slide-up">
              <div v-if="expandedBudgetIds.includes(version.id)" class="mt-3">
                <div class="table-container">
                  <table class="table text-sm">
                    <thead>
                      <tr>
                        <th>项目名称</th>
                        <th>类别</th>
                        <th>单位</th>
                        <th>数量</th>
                        <th>单价</th>
                        <th>金额</th>
                        <th>备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in version.items" :key="item.id">
                        <td class="font-medium">{{ item.name }}</td>
                        <td>{{ item.category }}</td>
                        <td>{{ item.unit }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>¥{{ item.unitPrice.toLocaleString() }}</td>
                        <td class="font-medium">¥{{ item.amount.toLocaleString() }}</td>
                        <td class="text-slate-500">{{ item.remark || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Transition>
          </div>

          <div v-if="version.status === 'pending_confirm'" class="mt-4 flex justify-end gap-3">
            <button
              class="btn-danger text-sm px-4"
              @click="rejectBudget(version.id)"
            >
              拒绝
            </button>
            <button
              class="btn-success text-sm px-4"
              @click="confirmBudget(version.id)"
            >
              确认生效
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'attachments'" class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-slate-800">合同附件</h2>
        <button class="btn-secondary text-sm">
          <Upload class="w-4 h-4 mr-1" />
          上传附件
        </button>
      </div>
      <div class="grid grid-cols-4 gap-4">
        <div
          v-for="(attachment, index) in project.attachments"
          :key="attachment.id"
          class="p-4 border border-slate-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all"
        >
          <div class="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
            <FileText class="w-6 h-6 text-slate-500" />
          </div>
          <p class="font-medium text-slate-700 truncate text-sm">{{ attachment.name }}</p>
          <p class="text-xs text-slate-400 mt-1">{{ formatFileSize(attachment.size) }}</p>
        </div>
        <div v-if="!project.attachments?.length" class="col-span-4 text-center py-12 text-slate-400">
          暂无合同附件
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showAssignModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showAssignModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
          <h3 class="text-lg font-bold text-slate-800 mb-5">分派巡检</h3>
          <form @submit.prevent="handleAssignInspection" class="space-y-4">
            <div>
              <label class="input-label">巡检标题</label>
              <input v-model="assignForm.title" class="input" placeholder="如：水电工程验收" />
            </div>
            <div>
              <label class="input-label">巡检人员</label>
              <select v-model="assignForm.inspectorId" class="input">
                <option value="">请选择巡检人员</option>
                <option v-for="inspector in inspectors" :key="inspector.id" :value="inspector.id">
                  {{ inspector.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="input-label">巡检时间</label>
              <input v-model="assignForm.scheduledAt" type="datetime-local" class="input" />
            </div>
            <div>
              <label class="input-label">关联预算版本</label>
              <select v-model="assignForm.budgetVersionId" class="input">
                <option value="">不关联</option>
                <option
                  v-for="bv in project?.budgetVersions?.filter(b => b.status === 'confirmed')"
                  :key="bv.id"
                  :value="bv.id"
                >
                  第 {{ bv.version }} 版 - ¥{{ bv.totalAmount.toLocaleString() }}
                </option>
              </select>
            </div>
            <div>
              <label class="input-label">备注</label>
              <textarea v-model="assignForm.remark" class="input h-20 resize-none" placeholder="巡检注意事项"></textarea>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="showAssignModal = false">取消</button>
              <button type="submit" class="btn-primary">确认分派</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="showBudgetModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showBudgetModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-2xl p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
          <h3 class="text-lg font-bold text-slate-800 mb-5">新建预算版本</h3>
          <div class="space-y-4">
            <div>
              <label class="input-label">变更原因</label>
              <textarea v-model="newBudgetForm.changeReason" class="input h-20 resize-none" placeholder="请说明预算变更原因"></textarea>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="input-label mb-0">预算明细</label>
                <button class="text-sm text-primary-600 hover:text-primary-700" @click="addBudgetItem">
                  + 添加项目
                </button>
              </div>
              <div class="table-container">
                <table class="table text-sm">
                  <thead>
                    <tr>
                      <th>项目名称</th>
                      <th>类别</th>
                      <th>单位</th>
                      <th>数量</th>
                      <th>单价</th>
                      <th>金额</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in newBudgetForm.items" :key="index">
                      <td><input v-model="item.name" class="input text-sm py-1" /></td>
                      <td><input v-model="item.category" class="input text-sm py-1 w-20" /></td>
                      <td><input v-model="item.unit" class="input text-sm py-1 w-16" /></td>
                      <td><input v-model.number="item.quantity" type="number" class="input text-sm py-1 w-20" @input="calculateItemAmount(index)" /></td>
                      <td><input v-model.number="item.unitPrice" type="number" class="input text-sm py-1 w-24" @input="calculateItemAmount(index)" /></td>
                      <td class="font-medium">¥{{ item.amount.toLocaleString() }}</td>
                      <td>
                        <button class="text-danger-500 hover:text-danger-600" @click="removeBudgetItem(index)">
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="5" class="text-right font-medium">合计</td>
                      <td class="font-bold text-primary-600">¥{{ totalBudgetAmount.toLocaleString() }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div class="p-4 bg-slate-50 rounded-xl">
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">上一版本预算</span>
                <span class="text-slate-800">¥{{ lastBudgetAmount.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between text-sm mt-2">
                <span class="text-slate-600">本次变更</span>
                <span :class="budgetChangeAmount >= 0 ? 'text-danger-600' : 'text-success-600'" class="font-medium">
                  {{ budgetChangeAmount >= 0 ? '+' : '' }}¥{{ budgetChangeAmount.toLocaleString() }}
                </span>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="showBudgetModal = false">取消</button>
              <button class="btn-secondary" @click="saveBudgetDraft">保存草稿</button>
              <button class="btn-primary" @click="submitBudget">提交确认</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>

  <div v-else class="flex items-center justify-center h-64">
    <div class="text-slate-400">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  ArrowLeft,
  AlertTriangle,
  Plus,
  ChevronDown,
  Upload,
  FileText,
  Trash2,
} from 'lucide-vue-next'
import type { Project, BudgetVersion, User, BudgetItem } from '~/types'

const route = useRoute()
const projectId = computed(() => route.params.id as string)

const project = ref<Project | null>(null)
const inspectors = ref<User[]>([])
const activeTab = ref('timeline')
const expandedBudgetIds = ref<string[]>([])
const showAssignModal = ref(false)
const showBudgetModal = ref(false)

const tabs = [
  { key: 'timeline', label: '巡检时间线' },
  { key: 'budget', label: '预算版本' },
  { key: 'attachments', label: '合同附件' },
]

const assignForm = reactive({
  title: '',
  inspectorId: '',
  scheduledAt: '',
  budgetVersionId: '',
  remark: '',
})

const newBudgetForm = reactive({
  changeReason: '',
  items: [] as any[],
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

const inspectionStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    rectifying: '整改中',
  }
  return labels[status] || status
}

const inspectionStatusDot = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-slate-400',
    in_progress: 'bg-primary-500',
    completed: 'bg-success-500',
    rectifying: 'bg-warning-500',
  }
  return classes[status] || 'bg-slate-400'
}

const inspectionBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'badge-slate',
    in_progress: 'badge-primary',
    completed: 'badge-success',
    rectifying: 'badge-warning',
  }
  return classes[status] || 'badge-slate'
}

const versionStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: '草稿',
    pending_confirm: '待确认',
    confirmed: '已确认',
    rejected: '已拒绝',
  }
  return labels[status] || status
}

const versionBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'badge-slate',
    pending_confirm: 'badge-warning',
    confirmed: 'badge-success',
    rejected: 'badge-danger',
  }
  return classes[status] || 'badge-slate'
}

const feedbackLabel = (conclusion: string) => {
  const labels: Record<string, string> = {
    pass: '验收通过',
    pass_with_rectification: '整改后通过',
    fail: '验收不通过',
  }
  return labels[conclusion] || conclusion
}

const feedbackClass = (conclusion: string) => {
  const classes: Record<string, string> = {
    pass: 'text-success-600',
    pass_with_rectification: 'text-warning-600',
    fail: 'text-danger-600',
  }
  return classes[conclusion] || ''
}

const formatDate = (date: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString()
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const latestInspectionDate = computed(() => {
  if (!project.value?.inspections?.length) return '-'
  return formatDate(project.value.inspections[0]?.scheduledAt)
})

const pendingRectifications = computed(() => {
  if (!project.value?.inspections) return 0
  return project.value.inspections.reduce((sum, ins) => sum + (ins.rectifications?.filter(r => r.status !== 'completed').length || 0), 0)
})

const projectPeriod = computed(() => {
  if (!project.value?.startDate || !project.value?.endDate) return '-'
  return `${formatDate(project.value.startDate)} ~ ${formatDate(project.value.endDate)}`
})

const remainingDays = computed(() => {
  if (!project.value?.endDate) return ''
  const diff = new Date(project.value.endDate).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return `已超期 ${Math.abs(days)} 天`
  return `剩余 ${days} 天`
})

const totalBudgetAmount = computed(() => {
  return newBudgetForm.items.reduce((sum, item) => sum + (item.amount || 0), 0)
})

const lastBudgetAmount = computed(() => {
  if (!project.value?.budgetVersions?.length) return 0
  return project.value.budgetVersions[0]?.totalAmount || 0
})

const budgetChangeAmount = computed(() => {
  return totalBudgetAmount.value - lastBudgetAmount.value
})

const fetchProject = async () => {
  try {
    const data = await $fetch<Project>(`/api/projects/${projectId.value}`)
    project.value = data
    if (data.budgetVersions?.length > 0) {
      expandedBudgetIds.value = [data.budgetVersions[0].id]
    }
  } catch {
    project.value = mockProject
  }
}

const fetchInspectors = async () => {
  try {
    const data = await $fetch<User[]>('/api/users?role=inspector')
    inspectors.value = data
  } catch {
    inspectors.value = []
  }
}

const goBack = () => {
  navigateTo('/projects')
}

const goToInspection = (id: string) => {
  navigateTo(`/inspections/${id}`)
}

const toggleBudgetItems = (id: string) => {
  const index = expandedBudgetIds.value.indexOf(id)
  if (index > -1) {
    expandedBudgetIds.value.splice(index, 1)
  } else {
    expandedBudgetIds.value.push(id)
  }
}

const handleAssignInspection = async () => {
  if (!assignForm.title || !assignForm.inspectorId || !assignForm.scheduledAt) return

  try {
    await $fetch(`/api/projects/${projectId.value}/inspections`, {
      method: 'POST',
      body: assignForm,
    })
    showAssignModal.value = false
    fetchProject()
    Object.assign(assignForm, { title: '', inspectorId: '', scheduledAt: '', budgetVersionId: '', remark: '' })
  } catch (err) {
    console.error('Assign failed:', err)
  }
}

const confirmBudget = async (id: string) => {
  try {
    await $fetch(`/api/budget-versions/${id}/confirm`, { method: 'POST' })
    fetchProject()
  } catch (err) {
    console.error('Confirm failed:', err)
  }
}

const rejectBudget = async (id: string) => {
  console.log('Reject budget:', id)
}

const addBudgetItem = () => {
  newBudgetForm.items.push({
    name: '',
    category: '其他',
    unit: '项',
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    remark: '',
  })
}

const removeBudgetItem = (index: number) => {
  newBudgetForm.items.splice(index, 1)
}

const calculateItemAmount = (index: number) => {
  const item = newBudgetForm.items[index]
  item.amount = item.quantity * item.unitPrice
}

const saveBudgetDraft = () => {
  console.log('Save draft')
  showBudgetModal.value = false
}

const submitBudget = async () => {
  if (newBudgetForm.items.length === 0) return

  try {
    await $fetch(`/api/projects/${projectId.value}/budget-versions`, {
      method: 'POST',
      body: {
        items: newBudgetForm.items,
        changeReason: newBudgetForm.changeReason,
        status: 'pending_confirm',
      },
    })
    showBudgetModal.value = false
    fetchProject()
    newBudgetForm.changeReason = ''
    newBudgetForm.items = []
  } catch (err) {
    console.error('Submit failed:', err)
  }
}

const mockProject: Project = {
  id: '1',
  name: '万科城一期A栋',
  ownerId: '1',
  ownerName: '王先生',
  status: 'in_progress',
  currentBudgetVersionId: '1',
  currentBudgetVersion: { id: '1', projectId: '1', version: 3, totalAmount: 285000, changeAmount: 15000, status: 'confirmed', confirmedAt: '', confirmedBy: '', createdBy: '', items: [], createdAt: '' },
  startDate: '2024-01-01',
  endDate: '2024-06-30',
  description: '精装修工程',
  attachments: [
    { id: '1', projectId: '1', name: '装修合同.pdf', url: '', type: 'pdf', size: 2048000, uploadedAt: '' },
    { id: '2', projectId: '1', name: '设计图纸.dwg', url: '', type: 'dwg', size: 5120000, uploadedAt: '' },
    { id: '3', projectId: '1', name: '报价单.xlsx', url: '', type: 'xlsx', size: 256000, uploadedAt: '' },
  ],
  budgetVersions: [
    {
      id: 'bv1',
      projectId: '1',
      version: 3,
      totalAmount: 285000,
      changeAmount: 15000,
      changeReason: '增加水电改造工程量及材料升级',
      status: 'confirmed',
      confirmedAt: '2024-01-15',
      confirmedBy: '1',
      confirmerName: '王先生',
      createdBy: '2',
      creatorName: '李经理',
      items: [
        { id: '1', budgetVersionId: 'bv1', name: '水电改造', category: '基础工程', unit: '项', quantity: 1, unitPrice: 35000, amount: 35000, remark: '含强弱电、给排水' },
        { id: '2', budgetVersionId: 'bv1', name: '瓦工工程', category: '泥工', unit: '㎡', quantity: 120, unitPrice: 280, amount: 33600, remark: '含墙地砖铺贴' },
        { id: '3', budgetVersionId: 'bv1', name: '木工工程', category: '木工', unit: '项', quantity: 1, unitPrice: 45000, amount: 45000, remark: '吊顶、柜体基层' },
      ],
      createdAt: '2024-01-10',
    },
    {
      id: 'bv2',
      projectId: '1',
      version: 2,
      totalAmount: 270000,
      changeAmount: 5000,
      changeReason: '材料升级',
      status: 'confirmed',
      confirmedAt: '2024-01-05',
      confirmedBy: '1',
      confirmerName: '王先生',
      createdBy: '2',
      creatorName: '李经理',
      items: [],
      createdAt: '2024-01-03',
    },
    {
      id: 'bv3',
      projectId: '1',
      version: 1,
      totalAmount: 265000,
      changeAmount: 0,
      status: 'confirmed',
      confirmedAt: '2024-01-01',
      confirmedBy: '1',
      confirmerName: '王先生',
      createdBy: '2',
      creatorName: '李经理',
      items: [],
      createdAt: '2024-01-01',
    },
  ],
  inspections: [
    {
      id: 'ins1',
      projectId: '1',
      projectName: '万科城一期A栋',
      title: '水电工程验收',
      inspectorId: '3',
      inspectorName: '张巡检',
      status: 'completed',
      scheduledAt: '2024-01-20',
      completedAt: '2024-01-20',
      budgetVersionId: 'bv1',
      photos: [
        { id: 'p1', inspectionId: 'ins1', url: '', category: '水电', uploadedAt: '' },
        { id: 'p2', inspectionId: 'ins1', url: '', category: '水电', uploadedAt: '' },
        { id: 'p3', inspectionId: 'ins1', url: '', category: '水电', uploadedAt: '' },
      ],
      rectifications: [
        { id: 'r1', inspectionId: 'ins1', title: '卫生间防水高度不足', description: '淋浴区防水高度只有1.5米，需做到1.8米', responsiblePerson: '李工', deadline: '2024-01-25', status: 'completed', createdAt: '' },
      ],
      feedback: { id: 'f1', inspectionId: 'ins1', conclusion: 'pass_with_rectification', remark: '整体合格，防水问题已整改完成', confirmedBy: '1', confirmerName: '王先生', confirmedAt: '2024-01-22', beforePhotos: [], afterPhotos: [] },
      createdAt: '2024-01-18',
    },
    {
      id: 'ins2',
      projectId: '1',
      projectName: '万科城一期A栋',
      title: '瓦工阶段巡检',
      inspectorId: '3',
      inspectorName: '张巡检',
      status: 'rectifying',
      scheduledAt: '2024-02-05',
      completedAt: null,
      photos: [],
      rectifications: [
        { id: 'r2', inspectionId: 'ins2', title: '墙面平整度超标', description: '主卧墙面平整度偏差5mm', responsiblePerson: '王工', deadline: '2024-02-10', status: 'pending', createdAt: '' },
        { id: 'r3', inspectionId: 'ins2', title: '地砖空鼓', description: '客厅有3块地砖空鼓', responsiblePerson: '王工', deadline: '2024-02-08', status: 'processing', createdAt: '' },
      ],
      feedback: null,
      createdAt: '2024-02-01',
    },
  ],
  isDelayed: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-20',
}

onMounted(() => {
  fetchProject()
  fetchInspectors()
})

definePageMeta({ layout: 'default' })
</script>
