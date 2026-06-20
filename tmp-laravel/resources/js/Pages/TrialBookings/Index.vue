<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import Pagination from '@/Components/Pagination.vue'
import SearchInput from '@/Components/SearchInput.vue'
import Modal from '@/Components/Modal.vue'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  bookings: Object,
  filters: Object,
  artClasses: Array,
})

const showModal = ref(false)
const showConvertModal = ref(false)
const selectedBooking = ref(null)
const form = ref(getDefaultForm())
const convertForm = ref({ conversion_type: 'direct', follow_up_notes: '' })

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

const sourceOptions = [
  { value: '', label: '全部来源' },
  { value: 'online', label: '线上' },
  { value: 'offline', label: '线下' },
  { value: 'referral', label: '转介绍' },
  { value: 'walk_in', label: '自然到访' },
]

const sourceLabels = { online: '线上', offline: '线下', referral: '转介绍', walk_in: '自然到访' }

const filterSearch = ref(props.filters?.search || '')
const filterArtClass = ref(props.filters?.art_class_id || '')
const filterStatus = ref(props.filters?.status || '')
const filterSource = ref(props.filters?.source || '')
const filterDateFrom = ref(props.filters?.date_from || '')
const filterDateTo = ref(props.filters?.date_to || '')

function getDefaultForm() {
  return {
    student_name: '',
    phone: '',
    art_class_id: '',
    preferred_date: '',
    preferred_time: '',
    source: '',
    notes: '',
  }
}

function applyFilters() {
  router.get(route('trial-bookings.index'), {
    search: filterSearch.value,
    art_class_id: filterArtClass.value,
    status: filterStatus.value,
    source: filterSource.value,
    date_from: filterDateFrom.value,
    date_to: filterDateTo.value,
  }, { preserveState: true, preserveScroll: true })
}

watch([filterArtClass, filterStatus, filterSource, filterDateFrom, filterDateTo], () => {
  applyFilters()
})

watch(filterSearch, () => {
  applyFilters()
})

function openNewModal() {
  form.value = getDefaultForm()
  showModal.value = true
}

function submitNew() {
  router.post(route('trial-bookings.store'), form.value, {
    onSuccess: () => { showModal.value = false },
  })
}

function confirmBooking(booking) {
  router.put(route('trial-bookings.update', booking.id), { status: 'confirmed' }, { preserveScroll: true })
}

function completeBooking(booking) {
  router.put(route('trial-bookings.update', booking.id), { status: 'completed' }, { preserveScroll: true })
}

function cancelBooking(booking) {
  router.put(route('trial-bookings.update', booking.id), { status: 'cancelled' }, { preserveScroll: true })
}

function openConvertModal(booking) {
  selectedBooking.value = booking
  convertForm.value = { conversion_type: 'direct', follow_up_notes: '' }
  showConvertModal.value = true
}

function submitConvert() {
  router.post(route('trial-bookings.convert', selectedBooking.value.id), convertForm.value, {
    onSuccess: () => { showConvertModal.value = false },
  })
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="试听预约">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">试听预约</h2>
      <button
        @click="openNewModal"
        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        新增预约
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 mb-6 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <SearchInput v-model="filterSearch" placeholder="搜索学生姓名..." />
        <select v-model="filterArtClass" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="">全部班级</option>
          <option v-for="cls in artClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
        <select v-model="filterStatus" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select v-model="filterSource" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option v-for="opt in sourceOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <input v-model="filterDateFrom" type="date" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        <input v-model="filterDateTo" type="date" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
            <th class="px-5 py-3 font-medium">学生姓名</th>
            <th class="px-5 py-3 font-medium">电话</th>
            <th class="px-5 py-3 font-medium">预约班级</th>
            <th class="px-5 py-3 font-medium">预约日期时间</th>
            <th class="px-5 py-3 font-medium">来源</th>
            <th class="px-5 py-3 font-medium">状态</th>
            <th class="px-5 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in bookings.data" :key="booking.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 text-sm font-medium text-gray-900">{{ booking.student_name }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ booking.phone }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ booking.art_class?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{{ booking.preferred_date }} {{ booking.preferred_time }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ sourceLabels[booking.source] || booking.source }}</td>
            <td class="px-5 py-3">
              <StatusBadge :status="booking.status" />
            </td>
            <td class="px-5 py-3">
              <div class="flex items-center gap-2">
                <button v-if="booking.status === 'pending'" @click="confirmBooking(booking)" class="text-xs text-green-600 hover:text-green-800 font-medium">确认</button>
                <button v-if="booking.status === 'pending'" @click="cancelBooking(booking)" class="text-xs text-red-600 hover:text-red-800 font-medium">取消</button>
                <button v-if="booking.status === 'confirmed'" @click="completeBooking(booking)" class="text-xs text-green-600 hover:text-green-800 font-medium">完成</button>
                <button v-if="booking.status === 'confirmed'" @click="cancelBooking(booking)" class="text-xs text-red-600 hover:text-red-800 font-medium">取消</button>
                <button v-if="booking.status === 'completed'" @click="openConvertModal(booking)" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">转为正式学员</button>
              </div>
            </td>
          </tr>
          <tr v-if="bookings.data.length === 0">
            <td colspan="7" class="px-5 py-10 text-center text-sm text-gray-500">暂无预约数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <Pagination :links="bookings.links" />
    </div>

    <Modal :show="showModal" title="新增预约" max-width="lg" @close="showModal = false">
      <form @submit.prevent="submitNew" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">学生姓名</label>
            <input v-model="form.student_name" type="text" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">电话</label>
            <input v-model="form.phone" type="text" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">预约班级</label>
            <select v-model="form.art_class_id" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">请选择班级</option>
              <option v-for="cls in artClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">来源</label>
            <select v-model="form.source" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">请选择来源</option>
              <option v-for="opt in sourceOptions.filter(o => o.value)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">预约日期</label>
            <input v-model="form.preferred_date" type="date" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">预约时间</label>
            <input v-model="form.preferred_time" type="time" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
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

    <Modal :show="showConvertModal" title="转为正式学员" max-width="md" @close="showConvertModal = false">
      <form @submit.prevent="submitConvert" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">转化类型</label>
          <select v-model="convertForm.conversion_type" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="direct">直接转化</option>
            <option value="follow_up">跟进转化</option>
          </select>
        </div>
        <div v-if="convertForm.conversion_type === 'follow_up'">
          <label class="block text-sm font-medium text-gray-700 mb-1">跟进备注</label>
          <textarea v-model="convertForm.follow_up_notes" rows="3" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showConvertModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
          <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">确认转化</button>
        </div>
      </form>
    </Modal>
  </AdminLayout>
</template>
