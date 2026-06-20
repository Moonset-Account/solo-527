<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import Pagination from '@/Components/Pagination.vue'
import SearchInput from '@/Components/SearchInput.vue'
import Modal from '@/Components/Modal.vue'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  feedbacks: Object,
  filters: Object,
  students: Array,
  teachers: Array,
})

const showSendModal = ref(false)
const showReplyModal = ref(false)
const selectedFeedback = ref(null)
const form = ref(getDefaultSendForm())
const replyForm = ref({ parent_reply: '' })

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'praise', label: '表扬' },
  { value: 'concern', label: '关注' },
  { value: 'suggestion', label: '建议' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'unread', label: '未读' },
  { value: 'read', label: '已读' },
  { value: 'reminded', label: '已提醒' },
]

const typeLabels = { praise: '表扬', concern: '关注', suggestion: '建议' }
const typeColorMap = { praise: 'bg-green-100 text-green-700', concern: 'bg-red-100 text-red-700', suggestion: 'bg-blue-100 text-blue-700' }
const statusLabels = { unread: '未读', read: '已读', reminded: '已提醒' }

const filterSearch = ref(props.filters?.search || '')
const filterStudent = ref(props.filters?.student_id || '')
const filterTeacher = ref(props.filters?.teacher_id || '')
const filterType = ref(props.filters?.type || '')
const filterDateFrom = ref(props.filters?.date_from || '')
const filterDateTo = ref(props.filters?.date_to || '')

function getDefaultSendForm() {
  return { student_id: '', type: '', content: '' }
}

const exportUrl = computed(() => {
  const params = new URLSearchParams()
  if (filterSearch.value) params.set('search', filterSearch.value)
  if (filterStudent.value) params.set('student_id', filterStudent.value)
  if (filterTeacher.value) params.set('teacher_id', filterTeacher.value)
  if (filterType.value) params.set('type', filterType.value)
  if (filterDateFrom.value) params.set('date_from', filterDateFrom.value)
  if (filterDateTo.value) params.set('date_to', filterDateTo.value)
  return route('home-school-feedback.export') + '?' + params.toString()
})

function applyFilters() {
  router.get(route('home-school-feedback.index'), {
    search: filterSearch.value,
    student_id: filterStudent.value,
    teacher_id: filterTeacher.value,
    type: filterType.value,
    date_from: filterDateFrom.value,
    date_to: filterDateTo.value,
  }, { preserveState: true, preserveScroll: true })
}

watch([filterStudent, filterTeacher, filterType, filterDateFrom, filterDateTo], () => {
  applyFilters()
})

watch(filterSearch, () => {
  applyFilters()
})

function openSendModal() {
  form.value = getDefaultSendForm()
  showSendModal.value = true
}

function submitSend() {
  router.post(route('home-school-feedback.store'), form.value, {
    onSuccess: () => { showSendModal.value = false },
  })
}

function openReplyModal(feedback) {
  selectedFeedback.value = feedback
  replyForm.value.parent_reply = feedback.parent_reply || ''
  showReplyModal.value = true
}

function submitReply() {
  router.put(route('home-school-feedback.update', selectedFeedback.value.id), replyForm.value, {
    onSuccess: () => { showReplyModal.value = false },
  })
}

function remindParent(feedback) {
  router.put(route('home-school-feedback.remind', feedback.id), {}, {
    preserveScroll: true,
  })
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="家校反馈">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">家校反馈</h2>
      <div class="flex items-center gap-3">
        <a
          :href="exportUrl"
          class="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          导出Excel
        </a>
        <button
          @click="openSendModal"
          class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          发送反馈
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 mb-6 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <SearchInput v-model="filterSearch" placeholder="搜索内容..." />
        <select v-model="filterStudent" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="">全部学生</option>
          <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <select v-model="filterTeacher" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="">全部教师</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <select v-model="filterType" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <input v-model="filterDateFrom" type="date" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        <input v-model="filterDateTo" type="date" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
            <th class="px-5 py-3 font-medium">学生</th>
            <th class="px-5 py-3 font-medium">教师</th>
            <th class="px-5 py-3 font-medium">类型</th>
            <th class="px-5 py-3 font-medium">内容</th>
            <th class="px-5 py-3 font-medium">家长回复</th>
            <th class="px-5 py-3 font-medium">状态</th>
            <th class="px-5 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fb in feedbacks.data" :key="fb.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 text-sm font-medium text-gray-900">{{ fb.student?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ fb.teacher?.name || '-' }}</td>
            <td class="px-5 py-3">
              <span :class="[typeColorMap[fb.type] || 'bg-gray-100 text-gray-700', 'inline-block rounded-full px-2 py-0.5 text-xs font-medium']">
                {{ typeLabels[fb.type] || fb.type }}
              </span>
            </td>
            <td class="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{{ fb.content }}</td>
            <td class="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{{ fb.parent_reply || '-' }}</td>
            <td class="px-5 py-3">
              <StatusBadge :status="fb.status" :color-map="{ unread: 'bg-yellow-100 text-yellow-700', read: 'bg-green-100 text-green-700', reminded: 'bg-blue-100 text-blue-700' }" />
            </td>
            <td class="px-5 py-3">
              <div class="flex items-center gap-2">
                <button
                  v-if="fb.status !== 'reminded'"
                  @click="remindParent(fb)"
                  class="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  提醒家长
                </button>
                <button
                  @click="openReplyModal(fb)"
                  class="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  查看回复
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="feedbacks.data.length === 0">
            <td colspan="7" class="px-5 py-10 text-center text-sm text-gray-500">暂无反馈数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <Pagination :links="feedbacks.links" />
    </div>

    <Modal :show="showSendModal" title="发送反馈" max-width="lg" @close="showSendModal = false">
      <form @submit.prevent="submitSend" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">学生</label>
          <select v-model="form.student_id" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">请选择学生</option>
            <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
          <select v-model="form.type" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">请选择类型</option>
            <option v-for="opt in typeOptions.filter(o => o.value)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">内容</label>
          <textarea v-model="form.content" rows="4" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showSendModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
          <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">发送</button>
        </div>
      </form>
    </Modal>

    <Modal :show="showReplyModal" title="查看回复" max-width="lg" @close="showReplyModal = false">
      <div v-if="selectedFeedback" class="space-y-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <span :class="[typeColorMap[selectedFeedback.type] || 'bg-gray-100 text-gray-700', 'inline-block rounded-full px-2 py-0.5 text-xs font-medium']">
              {{ typeLabels[selectedFeedback.type] || selectedFeedback.type }}
            </span>
            <span class="text-sm text-gray-500">{{ selectedFeedback.teacher?.name }}</span>
          </div>
          <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ selectedFeedback.content }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">家长回复</label>
          <textarea v-model="replyForm.parent_reply" rows="4" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showReplyModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
          <button type="button" @click="submitReply" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">提交回复</button>
        </div>
      </div>
    </Modal>
  </AdminLayout>
</template>
