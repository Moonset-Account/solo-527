<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import Pagination from '@/Components/Pagination.vue'
import SearchInput from '@/Components/SearchInput.vue'
import Modal from '@/Components/Modal.vue'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  hours: Object,
  filters: Object,
  teachers: Array,
  artClasses: Array,
  summary: Object,
})

const showModal = ref(false)
const form = ref(getDefaultForm())

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'regular', label: '常规课' },
  { value: 'makeup', label: '补课' },
  { value: 'trial', label: '试听课' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'disputed', label: '有争议' },
]

const typeLabels = { regular: '常规课', makeup: '补课', trial: '试听课' }

const filterTeacher = ref(props.filters?.teacher_id || '')
const filterArtClass = ref(props.filters?.art_class_id || '')
const filterMonth = ref(props.filters?.month || '')
const filterType = ref(props.filters?.type || '')
const filterStatus = ref(props.filters?.status || '')

function getDefaultForm() {
  return {
    teacher_id: '',
    art_class_id: '',
    date: '',
    start_time: '',
    end_time: '',
    hours: 0,
    type: 'regular',
    notes: '',
  }
}

const autoHours = computed(() => {
  if (form.value.start_time && form.value.end_time) {
    const [sh, sm] = form.value.start_time.split(':').map(Number)
    const [eh, em] = form.value.end_time.split(':').map(Number)
    const diff = (eh * 60 + em - sh * 60 - sm) / 60
    return Math.max(0, Math.round(diff * 10) / 10)
  }
  return 0
})

watch([() => form.value.start_time, () => form.value.end_time], () => {
  form.value.hours = autoHours.value
})

function applyFilters() {
  router.get(route('teacher-hours.index'), {
    teacher_id: filterTeacher.value,
    art_class_id: filterArtClass.value,
    month: filterMonth.value,
    type: filterType.value,
    status: filterStatus.value,
  }, { preserveState: true, preserveScroll: true })
}

watch([filterTeacher, filterArtClass, filterMonth, filterType, filterStatus], () => {
  applyFilters()
})

function openRecordModal() {
  form.value = getDefaultForm()
  showModal.value = true
}

function submitRecord() {
  router.post(route('teacher-hours.store'), form.value, {
    onSuccess: () => { showModal.value = false },
  })
}

function confirmHour(hour) {
  router.put(route('teacher-hours.update', hour.id), { status: 'confirmed' }, { preserveScroll: true })
}

function disputeHour(hour) {
  router.put(route('teacher-hours.update', hour.id), { status: 'disputed' }, { preserveScroll: true })
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="老师课时">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">老师课时</h2>
      <div class="flex items-center gap-3">
        <Link
          :href="route('teacher-hours.summary')"
          class="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          课时汇总
        </Link>
        <button
          @click="openRecordModal"
          class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          记录课时
        </button>
      </div>
    </div>

    <div v-if="summary && Object.keys(summary).length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div v-for="(data, teacherId) in summary" :key="teacherId" class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500 mb-1">{{ data.name || `教师#${teacherId}` }}</div>
        <div class="flex items-baseline gap-3">
          <div>
            <span class="text-2xl font-bold text-gray-900">{{ data.total_hours || 0 }}</span>
            <span class="text-sm text-gray-500 ml-1">课时</span>
          </div>
          <div>
            <span class="text-lg font-bold text-indigo-600">¥{{ data.total_amount || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 mb-6 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <select v-model="filterTeacher" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="">全部教师</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <select v-model="filterArtClass" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="">全部班级</option>
          <option v-for="cls in artClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
        <input v-model="filterMonth" type="month" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        <select v-model="filterType" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select v-model="filterStatus" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
            <th class="px-5 py-3 font-medium">教师</th>
            <th class="px-5 py-3 font-medium">班级</th>
            <th class="px-5 py-3 font-medium">日期</th>
            <th class="px-5 py-3 font-medium">时间段</th>
            <th class="px-5 py-3 font-medium">课时数</th>
            <th class="px-5 py-3 font-medium">类型</th>
            <th class="px-5 py-3 font-medium">状态</th>
            <th class="px-5 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="hour in hours.data" :key="hour.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 text-sm font-medium text-gray-900">{{ hour.teacher?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ hour.art_class?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{{ hour.date }}</td>
            <td class="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{{ hour.start_time }} - {{ hour.end_time }}</td>
            <td class="px-5 py-3 text-sm text-gray-900 font-medium">{{ hour.hours }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ typeLabels[hour.type] || hour.type }}</td>
            <td class="px-5 py-3">
              <StatusBadge :status="hour.status" />
            </td>
            <td class="px-5 py-3">
              <div class="flex items-center gap-2">
                <button v-if="hour.status === 'pending'" @click="confirmHour(hour)" class="text-xs text-green-600 hover:text-green-800 font-medium">确认</button>
                <button v-if="hour.status === 'pending'" @click="disputeHour(hour)" class="text-xs text-red-600 hover:text-red-800 font-medium">争议</button>
                <button v-if="hour.status === 'disputed'" @click="confirmHour(hour)" class="text-xs text-green-600 hover:text-green-800 font-medium">确认</button>
              </div>
            </td>
          </tr>
          <tr v-if="hours.data.length === 0">
            <td colspan="8" class="px-5 py-10 text-center text-sm text-gray-500">暂无课时数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <Pagination :links="hours.links" />
    </div>

    <Modal :show="showModal" title="记录课时" max-width="lg" @close="showModal = false">
      <form @submit.prevent="submitRecord" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">教师</label>
            <select v-model="form.teacher_id" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">请选择教师</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">班级</label>
            <select v-model="form.art_class_id" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">请选择班级</option>
              <option v-for="cls in artClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input v-model="form.date" type="date" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select v-model="form.type" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option v-for="opt in typeOptions.filter(o => o.value)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
            <input v-model="form.start_time" type="time" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
            <input v-model="form.end_time" type="time" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">课时数（自动计算: {{ autoHours }}）</label>
          <input v-model.number="form.hours" type="number" step="0.1" min="0" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea v-model="form.notes" rows="3" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
          <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">提交</button>
        </div>
      </form>
    </Modal>
  </AdminLayout>
</template>
