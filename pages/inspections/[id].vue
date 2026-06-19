<template>
  <div class="space-y-6" v-if="inspection">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="p-2 hover:bg-slate-100 rounded-lg transition-colors" @click="goBack">
          <ArrowLeft class="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-slate-800">{{ inspection.title }}</h1>
            <span class="badge" :class="inspectionBadgeClass(inspection.status)">
              {{ inspectionStatusLabel(inspection.status) }}
            </span>
          </div>
          <p class="text-slate-500 mt-1">
            项目：<span class="text-primary-600 cursor-pointer hover:underline" @click="goToProject">{{ inspection.projectName }}</span>
            · 巡检员：{{ inspection.inspectorName }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button v-if="canAddRectification" class="btn-secondary" @click="showRectificationModal = true">
          <Plus class="w-4 h-4 mr-1" />
          添加整改项
        </button>
        <button v-if="canSubmitFeedback" class="btn-primary" @click="showFeedbackModal = true">
          <CheckCircle class="w-4 h-4 mr-1" />
          提交验收
        </button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-slate-500">计划时间</p>
        <p class="text-lg font-semibold text-slate-800 mt-1">{{ formatDateTime(inspection.scheduledAt) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">现场照片</p>
        <p class="text-lg font-semibold text-slate-800 mt-1">{{ inspection.photos?.length || 0 }} 张</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">整改项</p>
        <p class="text-lg font-semibold text-warning-600 mt-1">{{ pendingRectifications }} / {{ inspection.rectifications?.length || 0 }}</p>
        <p class="text-xs text-slate-400 mt-1">待处理 / 总计</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">关联预算</p>
        <p class="text-lg font-semibold text-slate-800 mt-1">{{ budgetVersionLabel }}</p>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 space-y-6">
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-slate-800">现场照片</h2>
            <button class="btn-secondary text-sm">
              <Upload class="w-4 h-4 mr-1" />
              上传照片
            </button>
          </div>
          <div class="grid grid-cols-4 gap-3">
            <div
              v-for="(photo, index) in inspection.photos"
              :key="photo.id"
              class="aspect-square rounded-lg bg-slate-100 overflow-hidden group relative cursor-pointer"
            >
              <div class="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs">
                {{ photo.category || '现场照片' }}
              </div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Eye class="w-6 h-6 text-white" />
              </div>
              <p v-if="photo.description" class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 truncate">
                {{ photo.description }}
              </p>
            </div>
            <div v-if="!inspection.photos?.length" class="col-span-4 text-center py-12 text-slate-400">
              暂无现场照片
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-slate-800">整改项</h2>
            <span class="text-sm text-slate-500">共 {{ inspection.rectifications?.length || 0 }} 项</span>
          </div>
          <div class="space-y-3">
            <div
              v-for="rect in inspection.rectifications"
              :key="rect.id"
              class="p-4 border border-slate-200 rounded-xl hover:border-primary-300 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start gap-3">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    :class="rectificationIconBg(rect.status)"
                  >
                    <AlertCircle v-if="rect.status === 'pending'" class="w-4 h-4 text-warning-600" />
                    <Loader v-else-if="rect.status === 'processing'" class="w-4 h-4 text-primary-600 animate-spin" />
                    <CheckCircle v-else-if="rect.status === 'completed'" class="w-4 h-4 text-success-600" />
                    <RefreshCw v-else class="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <h3 class="font-medium text-slate-800">{{ rect.title }}</h3>
                    <p class="text-sm text-slate-500 mt-1">{{ rect.description }}</p>
                    <div class="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span class="flex items-center gap-1">
                        <User class="w-3 h-3" />
                        负责人：{{ rect.responsiblePerson }}
                      </span>
                      <span class="flex items-center gap-1">
                        <Clock class="w-3 h-3" />
                        截止：{{ formatDate(rect.deadline) }}
                      </span>
                    </div>
                  </div>
                </div>
                <span class="badge" :class="rectificationBadgeClass(rect.status)">
                  {{ rectificationStatusLabel(rect.status) }}
                </span>
              </div>
            </div>
            <div v-if="!inspection.rectifications?.length" class="text-center py-8 text-slate-400">
              暂无整改项
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="font-semibold text-slate-800 mb-4">验收反馈</h2>
          <div v-if="inspection.feedback" class="space-y-4">
            <div class="p-4 rounded-xl" :class="feedbackBgClass(inspection.feedback.conclusion)">
              <div class="flex items-center gap-2">
                <CheckCircle v-if="inspection.feedback.conclusion === 'pass'" class="w-5 h-5 text-success-600" />
                <AlertTriangle v-else-if="inspection.feedback.conclusion === 'pass_with_rectification'" class="w-5 h-5 text-warning-600" />
                <XCircle v-else class="w-5 h-5 text-danger-600" />
                <span class="font-semibold" :class="feedbackTextClass(inspection.feedback.conclusion)">
                  {{ feedbackLabel(inspection.feedback.conclusion) }}
                </span>
              </div>
            </div>

            <div v-if="inspection.feedback.remark" class="p-3 bg-slate-50 rounded-lg">
              <p class="text-sm text-slate-600">{{ inspection.feedback.remark }}</p>
            </div>

            <div class="text-xs text-slate-400">
              <p>确认人：{{ inspection.feedback.confirmerName }}</p>
              <p class="mt-1">确认时间：{{ formatDateTime(inspection.feedback.confirmedAt) }}</p>
            </div>

            <div v-if="inspection.feedback.beforePhotos?.length || inspection.feedback.afterPhotos?.length">
              <h3 class="text-sm font-medium text-slate-700 mb-2">前后对比</h3>
              <div class="grid grid-cols-2 gap-2">
                <div v-if="inspection.feedback.beforePhotos?.length">
                  <p class="text-xs text-slate-400 mb-1">整改前</p>
                  <div class="aspect-square rounded-lg bg-gradient-to-br from-slate-300 to-slate-400"></div>
                </div>
                <div v-if="inspection.feedback.afterPhotos?.length">
                  <p class="text-xs text-slate-400 mb-1">整改后</p>
                  <div class="aspect-square rounded-lg bg-gradient-to-br from-success-300 to-success-400"></div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-slate-400">
            <ClipboardList class="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>暂无验收反馈</p>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="font-semibold text-slate-800 mb-4">关联信息</h2>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-500">关联预算版本</span>
              <span class="text-slate-700 font-medium">{{ budgetVersionLabel }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">创建时间</span>
              <span class="text-slate-700">{{ formatDateTime(inspection.createdAt) }}</span>
            </div>
            <div v-if="inspection.completedAt" class="flex justify-between">
              <span class="text-slate-500">完成时间</span>
              <span class="text-slate-700">{{ formatDateTime(inspection.completedAt) }}</span>
            </div>
            <div v-if="inspection.remark" class="pt-3 border-t border-slate-100">
              <span class="text-slate-500">备注</span>
              <p class="text-slate-600 mt-1">{{ inspection.remark }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showRectificationModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showRectificationModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
          <h3 class="text-lg font-bold text-slate-800 mb-5">添加整改项</h3>
          <form @submit.prevent="handleAddRectification" class="space-y-4">
            <div>
              <label class="input-label">问题标题</label>
              <input v-model="rectificationForm.title" class="input" placeholder="如：墙面平整度超标" />
            </div>
            <div>
              <label class="input-label">问题描述</label>
              <textarea v-model="rectificationForm.description" class="input h-24 resize-none" placeholder="详细描述问题"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="input-label">负责人</label>
                <input v-model="rectificationForm.responsiblePerson" class="input" placeholder="负责人姓名" />
              </div>
              <div>
                <label class="input-label">截止日期</label>
                <input v-model="rectificationForm.deadline" type="date" class="input" />
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="showRectificationModal = false">取消</button>
              <button type="submit" class="btn-primary">确认添加</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="showFeedbackModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showFeedbackModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-lg p-6 animate-slide-up">
          <h3 class="text-lg font-bold text-slate-800 mb-5">提交验收反馈</h3>
          <form @submit.prevent="handleSubmitFeedback" class="space-y-4">
            <div>
              <label class="input-label">验收结论</label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  class="p-4 border-2 rounded-xl text-center transition-all"
                  :class="feedbackForm.conclusion === 'pass' ? 'border-success-500 bg-success-50' : 'border-slate-200 hover:border-slate-300'"
                  @click="feedbackForm.conclusion = 'pass'"
                >
                  <CheckCircle class="w-8 h-8 mx-auto mb-2" :class="feedbackForm.conclusion === 'pass' ? 'text-success-600' : 'text-slate-400'" />
                  <p class="text-sm font-medium" :class="feedbackForm.conclusion === 'pass' ? 'text-success-700' : 'text-slate-600'">验收通过</p>
                </button>
                <button
                  type="button"
                  class="p-4 border-2 rounded-xl text-center transition-all"
                  :class="feedbackForm.conclusion === 'pass_with_rectification' ? 'border-warning-500 bg-warning-50' : 'border-slate-200 hover:border-slate-300'"
                  @click="feedbackForm.conclusion = 'pass_with_rectification'"
                >
                  <AlertTriangle class="w-8 h-8 mx-auto mb-2" :class="feedbackForm.conclusion === 'pass_with_rectification' ? 'text-warning-600' : 'text-slate-400'" />
                  <p class="text-sm font-medium" :class="feedbackForm.conclusion === 'pass_with_rectification' ? 'text-warning-700' : 'text-slate-600'">整改后通过</p>
                </button>
                <button
                  type="button"
                  class="p-4 border-2 rounded-xl text-center transition-all"
                  :class="feedbackForm.conclusion === 'fail' ? 'border-danger-500 bg-danger-50' : 'border-slate-200 hover:border-slate-300'"
                  @click="feedbackForm.conclusion = 'fail'"
                >
                  <XCircle class="w-8 h-8 mx-auto mb-2" :class="feedbackForm.conclusion === 'fail' ? 'text-danger-600' : 'text-slate-400'" />
                  <p class="text-sm font-medium" :class="feedbackForm.conclusion === 'fail' ? 'text-danger-700' : 'text-slate-600'">验收不通过</p>
                </button>
              </div>
            </div>
            <div>
              <label class="input-label">验收意见</label>
              <textarea v-model="feedbackForm.remark" class="input h-24 resize-none" placeholder="请填写验收意见"></textarea>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="showFeedbackModal = false">取消</button>
              <button type="submit" class="btn-primary">提交反馈</button>
            </div>
          </form>
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
  Plus,
  CheckCircle,
  Upload,
  Eye,
  AlertCircle,
  Loader,
  RefreshCw,
  User,
  Clock,
  AlertTriangle,
  XCircle,
  ClipboardList,
} from 'lucide-vue-next'
import type { Inspection, Rectification, InspectionFeedback } from '~/types'

const route = useRoute()
const inspectionId = computed(() => route.params.id as string)

const inspection = ref<Inspection | null>(null)
const showRectificationModal = ref(false)
const showFeedbackModal = ref(false)

const rectificationForm = reactive({
  title: '',
  description: '',
  responsiblePerson: '',
  deadline: '',
})

const feedbackForm = reactive({
  conclusion: 'pass' as 'pass' | 'pass_with_rectification' | 'fail',
  remark: '',
})

const inspectionStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    rectifying: '整改中',
  }
  return labels[status] || status
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

const rectificationStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    rechecked: '已复查',
  }
  return labels[status] || status
}

const rectificationBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'badge-warning',
    processing: 'badge-primary',
    completed: 'badge-success',
    rechecked: 'badge-slate',
  }
  return classes[status] || 'badge-slate'
}

const rectificationIconBg = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-warning-100',
    processing: 'bg-primary-100',
    completed: 'bg-success-100',
    rechecked: 'bg-slate-100',
  }
  return classes[status] || 'bg-slate-100'
}

const feedbackLabel = (conclusion: string) => {
  const labels: Record<string, string> = {
    pass: '验收通过',
    pass_with_rectification: '整改后通过',
    fail: '验收不通过',
  }
  return labels[conclusion] || conclusion
}

const feedbackBgClass = (conclusion: string) => {
  const classes: Record<string, string> = {
    pass: 'bg-success-50 border border-success-200',
    pass_with_rectification: 'bg-warning-50 border border-warning-200',
    fail: 'bg-danger-50 border border-danger-200',
  }
  return classes[conclusion] || ''
}

const feedbackTextClass = (conclusion: string) => {
  const classes: Record<string, string> = {
    pass: 'text-success-700',
    pass_with_rectification: 'text-warning-700',
    fail: 'text-danger-700',
  }
  return classes[conclusion] || ''
}

const formatDate = (date: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const pendingRectifications = computed(() => {
  if (!inspection.value?.rectifications) return 0
  return inspection.value.rectifications.filter(r => r.status !== 'completed' && r.status !== 'rechecked').length
})

const budgetVersionLabel = computed(() => {
  if (!inspection.value?.budgetVersionId) return '未关联'
  return `第 ${inspection.value.budgetVersionId} 版`
})

const canAddRectification = computed(() => {
  return inspection.value && inspection.value.status !== 'completed'
})

const canSubmitFeedback = computed(() => {
  return inspection.value && !inspection.value.feedback
})

const fetchInspection = async () => {
  try {
    const data = await $fetch<Inspection>(`/api/inspections/${inspectionId.value}`)
    inspection.value = data
  } catch {
    inspection.value = mockInspection
  }
}

const goBack = () => {
  navigateTo('/projects')
}

const goToProject = () => {
  if (inspection.value?.projectId) {
    navigateTo(`/projects/${inspection.value.projectId}`)
  }
}

const handleAddRectification = async () => {
  if (!rectificationForm.title || !rectificationForm.description) return

  try {
    await $fetch(`/api/inspections/${inspectionId.value}/rectifications`, {
      method: 'POST',
      body: rectificationForm,
    })
    showRectificationModal.value = false
    fetchInspection()
    Object.assign(rectificationForm, { title: '', description: '', responsiblePerson: '', deadline: '' })
  } catch (err) {
    console.error('Add rectification failed:', err)
  }
}

const handleSubmitFeedback = async () => {
  try {
    await $fetch(`/api/inspections/${inspectionId.value}/feedback`, {
      method: 'POST',
      body: feedbackForm,
    })
    showFeedbackModal.value = false
    fetchInspection()
  } catch (err) {
    console.error('Submit feedback failed:', err)
  }
}

const mockInspection: Inspection = {
  id: 'ins1',
  projectId: '1',
  projectName: '万科城一期A栋',
  title: '水电工程验收',
  inspectorId: '3',
  inspectorName: '张巡检',
  status: 'rectifying',
  scheduledAt: '2024-01-20T10:00:00',
  completedAt: null,
  budgetVersionId: 'bv1',
  remark: '重点检查水电管线走向和防水工程',
  photos: [
    { id: 'p1', inspectionId: 'ins1', url: '', category: '水电', description: '客厅电路布线', uploadedAt: '2024-01-20T10:30:00' },
    { id: 'p2', inspectionId: 'ins1', url: '', category: '水电', description: '卫生间水管', uploadedAt: '2024-01-20T10:35:00' },
    { id: 'p3', inspectionId: 'ins1', url: '', category: '防水', description: '厨房防水', uploadedAt: '2024-01-20T10:40:00' },
    { id: 'p4', inspectionId: 'ins1', url: '', category: '水电', description: '配电箱', uploadedAt: '2024-01-20T10:45:00' },
  ],
  rectifications: [
    {
      id: 'r1',
      inspectionId: 'ins1',
      title: '卫生间防水高度不足',
      description: '淋浴区防水高度只有1.5米，规范要求1.8米，需要补做',
      responsiblePerson: '李工',
      deadline: '2024-01-25',
      status: 'completed',
      createdAt: '2024-01-20T11:00:00',
      completedAt: '2024-01-24T16:00:00',
    },
    {
      id: 'r2',
      inspectionId: 'ins1',
      title: '客厅插座位置不合理',
      description: '电视背景墙插座位置偏低，需要上移20cm',
      responsiblePerson: '王工',
      deadline: '2024-01-23',
      status: 'processing',
      createdAt: '2024-01-20T11:05:00',
    },
    {
      id: 'r3',
      inspectionId: 'ins1',
      title: '厨房水管走线不规范',
      description: '厨房冷热水管间距不足，需要调整',
      responsiblePerson: '李工',
      deadline: '2024-01-22',
      status: 'pending',
      createdAt: '2024-01-20T11:10:00',
    },
  ],
  feedback: null,
  createdAt: '2024-01-18T09:00:00',
}

onMounted(() => {
  fetchInspection()
})

definePageMeta({ layout: 'default' })
</script>
