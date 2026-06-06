<template>
  <div v-if="task" class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">任务详情</h2>
        <p class="text-sm text-gray-500 mt-1 font-mono">{{ task.taskNumber }}</p>
      </div>
      <div class="flex space-x-3">
        <button
          v-if="canClaim"
          @click="handleClaim"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          认领任务
        </button>
        <button
          v-if="canSubmitFix"
          @click="showFixModal = true"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          提交整改
        </button>
        <button
          v-if="canReview"
          @click="showReviewModal = true"
          class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
        >
          复查
        </button>
        <button
          v-if="canCancel"
          @click="handleCancel"
          class="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
        >
          撤回
        </button>
        <button
          v-if="canEscalate"
          @click="handleEscalate"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          升级处理
        </button>
        <button
          @click="navigateTo('/tasks')"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          返回列表
        </button>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">问题类型</p>
              <p class="text-gray-800 font-medium">{{ getTypeIcon(task.type) }} {{ getTypeLabel(task.type) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">状态</p>
              <p>
                <span :class="getStatusClass(task.status)" class="px-2 py-1 text-xs rounded-full">
                  {{ getStatusLabel(task.status) }}
                </span>
                <span v-if="task.isEscalated" class="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                  已升级
                </span>
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">点位名称</p>
              <p class="text-gray-800">{{ task.pointName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">所属社区</p>
              <p class="text-gray-800">{{ task.community }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">物业公司</p>
              <p class="text-gray-800">{{ task.propertyCompany }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">认领人</p>
              <p class="text-gray-800">{{ task.assigneeName || '未认领' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">提交人</p>
              <p class="text-gray-800">{{ task.submitterName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">截止时间</p>
              <p class="text-gray-800" :class="isOverdue ? 'text-red-600 font-medium' : ''">
                {{ formatDate(task.deadline) }}
                <span v-if="isOverdue" class="text-red-500 text-xs ml-1">(已逾期)</span>
              </p>
            </div>
          </div>
          <div class="mt-4">
            <p class="text-sm text-gray-500">问题描述</p>
            <p class="text-gray-800 mt-1">{{ task.description }}</p>
          </div>
          <div v-if="task.rejectReason" class="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p class="text-sm text-red-600 font-medium">复查不通过原因</p>
            <p class="text-red-700 mt-1">{{ task.rejectReason }}</p>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">整改前后照片对比</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-medium text-gray-600 mb-3">📷 整改前照片</h4>
              <div v-if="task.beforePhotos.length > 0" class="grid grid-cols-2 gap-2">
                <div v-for="(photo, index) in task.beforePhotos" :key="index" class="relative group">
                  <img :src="photo.url" :alt="photo.caption || '整改前照片'" class="w-full h-32 object-cover rounded-lg cursor-pointer" @click="previewImage(photo.url)" />
                </div>
              </div>
              <p v-else class="text-gray-400 text-sm py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                暂无照片
              </p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-600 mb-3">✅ 整改后照片</h4>
              <div v-if="task.afterPhotos.length > 0" class="grid grid-cols-2 gap-2">
                <div v-for="(photo, index) in task.afterPhotos" :key="index" class="relative group">
                  <img :src="photo.url" :alt="photo.caption || '整改后照片'" class="w-full h-32 object-cover rounded-lg cursor-pointer" @click="previewImage(photo.url)" />
                </div>
              </div>
              <p v-else class="text-gray-400 text-sm py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                暂无整改照片
              </p>
            </div>
          </div>
        </div>
        
        <div v-if="task.reviewRecords.length > 0" class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">复查记录</h3>
          <div class="space-y-4">
            <div v-for="(record, index) in task.reviewRecords" :key="index" class="p-4 rounded-lg border" :class="record.result === 'pass' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
              <div class="flex justify-between items-start">
                <div>
                  <span class="inline-flex items-center px-2 py-1 text-xs rounded-full" :class="record.result === 'pass' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'">
                    {{ record.result === 'pass' ? '✅ 复查通过' : '❌ 复查不通过' }}
                  </span>
                  <p class="text-sm text-gray-600 mt-2">复查人：{{ record.reviewerName }}</p>
                  <p class="text-sm text-gray-500">{{ formatDate(record.reviewedAt) }}</p>
                </div>
              </div>
              <p v-if="record.reason" class="mt-2 text-gray-700">原因：{{ record.reason }}</p>
              <div v-if="record.photos.length > 0" class="mt-3 grid grid-cols-4 gap-2">
                <img v-for="(photo, i) in record.photos" :key="i" :src="photo.url" class="w-full h-16 object-cover rounded cursor-pointer" @click="previewImage(photo.url)" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">操作历史</h3>
          <div class="space-y-0">
            <div v-for="(item, index) in task.history" :key="index" class="timeline-item">
              <div class="flex flex-col">
                <span class="font-medium text-gray-800 text-sm">{{ getStatusLabel(item.status) }}</span>
                <span class="text-xs text-gray-500">{{ item.changedByName }}</span>
                <span class="text-xs text-gray-400">{{ formatDate(item.changedAt) }}</span>
                <p v-if="item.note" class="text-xs text-gray-600 mt-1">{{ item.note }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showFixModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">提交整改</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">整改后照片 *</label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-green-400" @click="$refs.fixFileInput?.click()">
              <input type="file" accept="image/*" multiple class="hidden" @change="handleFixPhotoUpload" ref="fixFileInput" />
              <div class="text-4xl mb-2">📷</div>
              <p class="text-sm text-gray-500">点击上传整改后照片</p>
            </div>
            <div v-if="fixPhotos.length > 0" class="mt-3 grid grid-cols-4 gap-2">
              <div v-for="(photo, index) in fixPhotos" :key="index" class="relative">
                <img :src="photo.url" class="w-full h-16 object-cover rounded" />
                <button @click="fixPhotos.splice(index, 1)" class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs">&times;</button>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">整改说明</label>
            <textarea v-model="fixNote" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none" placeholder="请描述整改情况..."></textarea>
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button @click="showFixModal = false" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
          <button @click="submitFix" :disabled="loading" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">提交</button>
        </div>
      </div>
    </div>
    
    <div v-if="showReviewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">复查任务</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">复查结果 *</label>
            <div class="grid grid-cols-2 gap-3">
              <button @click="reviewResult = 'pass'" :class="['p-4 rounded-lg border-2 text-center', reviewResult === 'pass' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-700 hover:border-gray-300']">
                <div class="text-2xl mb-1">✅</div>
                <div class="font-medium">复查通过</div>
              </button>
              <button @click="reviewResult = 'fail'" :class="['p-4 rounded-lg border-2 text-center', reviewResult === 'fail' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-700 hover:border-gray-300']">
                <div class="text-2xl mb-1">❌</div>
                <div class="font-medium">复查不通过</div>
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">复查说明</label>
            <textarea v-model="reviewReason" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none" :placeholder="reviewResult === 'fail' ? '请说明不通过原因...' : '请输入复查说明（选填）...'"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">复查照片</label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-green-400" @click="$refs.reviewFileInput?.click()">
              <input type="file" accept="image/*" multiple class="hidden" @change="handleReviewPhotoUpload" ref="reviewFileInput" />
              <div class="text-4xl mb-2">📷</div>
              <p class="text-sm text-gray-500">点击上传复查照片</p>
            </div>
            <div v-if="reviewPhotos.length > 0" class="mt-3 grid grid-cols-4 gap-2">
              <div v-for="(photo, index) in reviewPhotos" :key="index" class="relative">
                <img :src="photo.url" class="w-full h-16 object-cover rounded" />
                <button @click="reviewPhotos.splice(index, 1)" class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs">&times;</button>
              </div>
            </div>
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button @click="showReviewModal = false" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
          <button @click="submitReview" :disabled="loading || !reviewResult" class="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">提交复查</button>
        </div>
      </div>
    </div>
    
    <div v-if="previewUrl" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" @click="previewUrl = ''">
      <img :src="previewUrl" class="max-w-full max-h-full object-contain" />
    </div>
  </div>
  
  <div v-else class="text-center py-20 text-gray-400">
    加载中...
  </div>
</template>

<script setup lang="ts">
import { TaskType, TaskStatus, TaskTypeLabels, TaskStatusLabels, type Task } from '~/types'
import { UserRole } from '~/types'

const route = useRoute()
const task = ref<Task | null>(null)
const loading = ref(false)

const showFixModal = ref(false)
const fixPhotos = ref<any[]>([])
const fixNote = ref('')

const showReviewModal = ref(false)
const reviewResult = ref<'pass' | 'fail' | ''>('')
const reviewReason = ref('')
const reviewPhotos = ref<any[]>([])

const previewUrl = ref('')

const { user, hasRole } = useAuth()

const canClaim = computed(() => {
  if (!task.value || !user.value) return false
  if (hasRole([UserRole.PROPERTY])) {
    return task.value.propertyCompany === user.value.propertyCompany &&
      [TaskStatus.SUBMITTED, TaskStatus.REJECTED].includes(task.value.status)
  }
  return false
})

const canSubmitFix = computed(() => {
  if (!task.value || !user.value) return false
  if (hasRole([UserRole.PROPERTY])) {
    return task.value.assigneeId?.toString() === user.value.id &&
      [TaskStatus.CLAIMED, TaskStatus.IN_PROGRESS, TaskStatus.REJECTED].includes(task.value.status)
  }
  return false
})

const canReview = computed(() => {
  if (!task.value) return false
  return hasRole([UserRole.STREET_ADMIN]) && task.value.status === TaskStatus.PENDING_REVIEW
})

const canCancel = computed(() => {
  if (!task.value || !user.value) return false
  const isSubmitter = task.value.submitterId.toString() === user.value.id
  const isAdmin = hasRole([UserRole.STREET_ADMIN])
  return (isSubmitter || isAdmin) && !['closed', 'cancelled'].includes(task.value.status)
})

const canEscalate = computed(() => {
  if (!task.value) return false
  return hasRole([UserRole.STREET_ADMIN]) && !task.value.isEscalated && !['closed', 'cancelled'].includes(task.value.status)
})

const isOverdue = computed(() => {
  if (!task.value) return false
  return new Date(task.value.deadline) < new Date() && !['closed', 'cancelled'].includes(task.value.status)
})

const fetchTask = async () => {
  try {
    const id = route.params.id as string
    task.value = await $fetch<Task>(`/api/tasks/${id}`)
  } catch (e) {
    console.error('Failed to fetch task:', e)
  }
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    [TaskType.MISSED_SORT]: '🗑️',
    [TaskType.BIN_FULL]: '📦',
    [TaskType.POINT_DAMAGED]: '🔧'
  }
  return icons[type] || '📋'
}

const getTypeLabel = (type: string) => TaskTypeLabels[type as TaskType] || type
const getStatusLabel = (status: string) => TaskStatusLabels[status as TaskStatus] || status

const getStatusClass = (status: string) => {
  const colors: Record<string, string> = {
    [TaskStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
    [TaskStatus.CLAIMED]: 'bg-cyan-100 text-cyan-800',
    [TaskStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
    [TaskStatus.PENDING_REVIEW]: 'bg-orange-100 text-orange-800',
    [TaskStatus.REJECTED]: 'bg-red-100 text-red-800',
    [TaskStatus.CLOSED]: 'bg-green-100 text-green-800',
    [TaskStatus.ESCALATED]: 'bg-rose-100 text-rose-800',
    [TaskStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const previewImage = (url: string) => {
  previewUrl.value = url
}

const handleClaim = async () => {
  if (!confirm('确定要认领此任务吗？')) return
  loading.value = true
  try {
    const id = route.params.id as string
    await $fetch(`/api/tasks/${id}/claim`, { method: 'POST' })
    await fetchTask()
  } catch (e: any) {
    alert('认领失败：' + (e.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

const handleFixPhotoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return
  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader()
    reader.onload = (e) => {
      fixPhotos.value.push({ url: e.target?.result as string, caption: files[i].name })
    }
    reader.readAsDataURL(files[i])
  }
}

const submitFix = async () => {
  if (fixPhotos.value.length === 0) {
    alert('请至少上传一张整改后照片')
    return
  }
  loading.value = true
  try {
    const id = route.params.id as string
    await $fetch(`/api/tasks/${id}/submit-fix`, {
      method: 'POST',
      body: {
        afterPhotos: fixPhotos.value,
        note: fixNote.value
      }
    })
    showFixModal.value = false
    fixPhotos.value = []
    fixNote.value = ''
    await fetchTask()
  } catch (e: any) {
    alert('提交失败：' + (e.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

const handleReviewPhotoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return
  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader()
    reader.onload = (e) => {
      reviewPhotos.value.push({ url: e.target?.result as string, caption: files[i].name })
    }
    reader.readAsDataURL(files[i])
  }
}

const submitReview = async () => {
  if (!reviewResult.value) return
  if (reviewResult.value === 'fail' && !reviewReason.value) {
    alert('请填写不通过原因')
    return
  }
  loading.value = true
  try {
    const id = route.params.id as string
    await $fetch(`/api/tasks/${id}/review`, {
      method: 'POST',
      body: {
        result: reviewResult.value,
        reason: reviewReason.value,
        photos: reviewPhotos.value
      }
    })
    showReviewModal.value = false
    reviewResult.value = ''
    reviewReason.value = ''
    reviewPhotos.value = []
    await fetchTask()
  } catch (e: any) {
    alert('提交失败：' + (e.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

const handleCancel = async () => {
  const reason = prompt('请输入撤回原因：')
  if (reason === null) return
  loading.value = true
  try {
    const id = route.params.id as string
    await $fetch(`/api/tasks/${id}/cancel`, {
      method: 'POST',
      body: { reason }
    })
    await fetchTask()
  } catch (e: any) {
    alert('撤回失败：' + (e.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

const handleEscalate = async () => {
  const reason = prompt('请输入升级原因：')
  if (reason === null) return
  loading.value = true
  try {
    const id = route.params.id as string
    await $fetch(`/api/tasks/${id}/escalate`, {
      method: 'POST',
      body: { reason }
    })
    await fetchTask()
  } catch (e: any) {
    alert('升级失败：' + (e.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTask()
})
</script>
