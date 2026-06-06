<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">我的报名</h2>
    </div>

    <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        :class="['px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', activeTab === tab.value ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300']"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
    </div>

    <div v-else-if="filteredBookings.length === 0" class="empty-state card">
      <div class="empty-state-icon">📭</div>
      <div class="empty-state-text">暂无报名记录</div>
      <div class="empty-state-desc mb-4">去发现精彩的手作课程吧</div>
      <router-link to="/courses" class="btn btn-primary">浏览课程</router-link>
    </div>

    <div v-else class="space-y-4">
      <div v-for="booking in filteredBookings" :key="booking.id" class="card">
        <div class="p-4">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="font-bold text-gray-800">{{ booking.course_session?.course?.title }}</h3>
              <p class="text-sm text-gray-500 mt-1">
                {{ formatDateTime(booking.course_session?.start_time) }}
              </p>
              <p class="text-sm text-gray-500">{{ booking.course_session?.location }}</p>
            </div>
            <span :class="['badge', getStatusBadge(booking.status)]">
              {{ getStatusLabel(booking.status) }}
            </span>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-gray-100">
            <div class="text-sm">
              <span class="text-gray-500">实付：</span>
              <span class="font-bold text-purple-600">¥{{ booking.paid_amount }}</span>
              <span class="text-gray-400"> / ¥{{ booking.total_amount }}</span>
            </div>
            <div class="flex gap-2">
              <button
                v-if="booking.can_cancel"
                @click="handleCancel(booking)"
                class="btn btn-secondary btn-sm"
              >
                取消报名
              </button>
              <button
                v-if="booking.can_pay"
                @click="handlePay(booking)"
                class="btn btn-primary btn-sm"
              >
                去支付
              </button>
              <router-link
                v-if="booking.attendance_status === 1"
                :to="`/my/artworks/upload?session_id=${booking.course_session_id}`"
                class="btn btn-outline btn-sm"
              >
                上传作品
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { bookingAPI, paymentAPI } from '../../utils/api'
import { BookingStatus } from '../../types'
import type { Booking } from '../../types'

const bookings = ref<Booking[]>([])
const activeTab = ref('all')
const loading = ref(true)

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待付款' },
  { value: 'upcoming', label: '待上课' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

const filteredBookings = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return bookings.value.filter(b => b.status === BookingStatus.PENDING || b.status === BookingStatus.APPROVED)
    case 'upcoming':
      return bookings.value.filter(b =>
        (b.status === BookingStatus.PAID || b.status === BookingStatus.APPROVED) &&
        new Date(b.course_session?.start_time || '') > new Date()
      )
    case 'completed':
      return bookings.value.filter(b => b.status === BookingStatus.COMPLETED)
    case 'cancelled':
      return bookings.value.filter(b => b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED)
    default:
      return bookings.value
  }
})

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
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const loadBookings = async () => {
  loading.value = true
  try {
    const response = await bookingAPI.list({ per_page: 50 })
    bookings.value = response.bookings
  } catch (e) {
    console.error('加载报名失败', e)
  } finally {
    loading.value = false
  }
}

const handleCancel = async (booking: Booking) => {
  if (!confirm('确定要取消报名吗？')) return
  try {
    await bookingAPI.cancel(booking.id)
    await loadBookings()
  } catch (e: any) {
    alert(e.response?.data?.error || '取消失败')
  }
}

const handlePay = async (booking: Booking) => {
  try {
    await paymentAPI.create({ booking_id: booking.id })
    alert('支付成功！')
    await loadBookings()
  } catch (e: any) {
    alert(e.response?.data?.error || '支付失败')
  }
}

onMounted(() => {
  loadBookings()
})
</script>
