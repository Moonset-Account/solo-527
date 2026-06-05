<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">报名管理</h2>
      <div class="flex gap-2">
        <button @click="handleExport" class="btn btn-secondary">
          📥 导出数据
        </button>
      </div>
    </div>

    <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        :class="['px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', activeTab === tab.value ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300']"
      >
        {{ tab.label }}
        <span v-if="tab.count" class="ml-1 px-2 py-0.5 text-xs rounded-full" :class="activeTab === tab.value ? 'bg-white/20' : 'bg-gray-100'">
          {{ tab.count }}
        </span>
      </button>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="text-sm text-gray-500">学员姓名</label>
            <input v-model="filters.student_name" type="text" class="form-input mt-1" placeholder="搜索学员" />
          </div>
          <div>
            <label class="text-sm text-gray-500">报名编号</label>
            <input v-model="filters.booking_no" type="text" class="form-input mt-1" placeholder="搜索编号" />
          </div>
          <div>
            <label class="text-sm text-gray-500">开始日期</label>
            <input v-model="filters.start_date" type="date" class="form-input mt-1" />
          </div>
          <div class="flex items-end">
            <button @click="handleSearch" class="btn btn-primary w-full">🔍 搜索</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">报名编号</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学员</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">课程</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="booking in bookings" :key="booking.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ booking.booking_no }}</td>
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-gray-800">{{ booking.student?.user?.name }}</div>
                <div class="text-xs text-gray-500">{{ booking.student?.user?.phone }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ booking.course_session?.course?.title }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ formatDateTime(booking.course_session?.start_time) }}
              </td>
              <td class="px-4 py-3 text-sm font-medium text-gray-800">¥{{ booking.total_amount }}</td>
              <td class="px-4 py-3">
                <span :class="['badge', getStatusBadge(booking.status)]">{{ getStatusLabel(booking.status) }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button v-if="booking.status === 0" @click="handleApprove(booking)" class="text-green-600 hover:text-green-700 text-sm">
                    通过
                  </button>
                  <button v-if="booking.status === 0" @click="handleReject(booking)" class="text-red-600 hover:text-red-700 text-sm">
                    拒绝
                  </button>
                  <button v-if="booking.status === 1 || booking.status === 2" @click="handleCheckIn(booking)" class="text-blue-600 hover:text-blue-700 text-sm">
                    签到
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { bookingAPI } from '../../utils/api'
import type { Booking, BookingStatus } from '../../types'

const bookings = ref<Booking[]>([])
const activeTab = ref('all')
const loading = ref(false)

const filters = reactive({
  student_name: '',
  booking_no: '',
  start_date: ''
})

const tabs = computed(() => [
  { value: 'all', label: '全部', count: bookings.value.length },
  { value: 'pending', label: '待审批', count: bookings.value.filter(b => b.status === BookingStatus.PENDING).length },
  { value: 'approved', label: '已确认', count: bookings.value.filter(b => b.status === BookingStatus.APPROVED || b.status === BookingStatus.PAID).length },
  { value: 'completed', label: '已完成', count: bookings.value.filter(b => b.status === BookingStatus.COMPLETED).length }
])

const getStatusLabel = (status: BookingStatus) => {
  const labels: Record<BookingStatus, string> = {
    [BookingStatus.PENDING]: '待审批',
    [BookingStatus.APPROVED]: '已通过',
    [BookingStatus.PAID]: '已付款',
    [BookingStatus.COMPLETED]: '已完成',
    [BookingStatus.CANCELLED]: '已取消',
    [BookingStatus.REJECTED]: '已拒绝'
  }
  return labels[status]
}

const getStatusBadge = (status: BookingStatus) => {
  const badges: Record<BookingStatus, string> = {
    [BookingStatus.PENDING]: 'badge-warning',
    [BookingStatus.APPROVED]: 'badge-info',
    [BookingStatus.PAID]: 'badge-success',
    [BookingStatus.COMPLETED]: 'badge-primary',
    [BookingStatus.CANCELLED]: 'badge-secondary',
    [BookingStatus.REJECTED]: 'badge-danger'
  }
  return badges[status]
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

const loadBookings = async () => {
  loading.value = true
  try {
    const params: any = { per_page: 50 }
    if (activeTab.value === 'pending') params.status = 'pending'
    const response = await bookingAPI.list(params)
    bookings.value = response.bookings
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loadBookings()
}

const handleApprove = async (booking: Booking) => {
  if (!confirm('确定通过该报名？')) return
  try {
    await bookingAPI.approve(booking.id)
    await loadBookings()
  } catch (e: any) {
    alert(e.response?.data?.error || '操作失败')
  }
}

const handleReject = async (booking: Booking) => {
  const reason = prompt('请输入拒绝原因')
  if (reason === null) return
  try {
    await bookingAPI.reject(booking.id)
    await loadBookings()
  } catch (e: any) {
    alert(e.response?.data?.error || '操作失败')
  }
}

const handleCheckIn = async (booking: Booking) => {
  if (!confirm('确认该学员已签到？')) return
  try {
    await bookingAPI.checkIn(booking.id)
    await loadBookings()
  } catch (e: any) {
    alert(e.response?.data?.error || '操作失败')
  }
}

const handleExport = async () => {
  try {
    const blob = await bookingAPI.export()
    const url = URL.createObjectURL(blob as any)
    const a = document.createElement('a')
    a.href = url
    a.download = `报名记录_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadBookings()
})
</script>
