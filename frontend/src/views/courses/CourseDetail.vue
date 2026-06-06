<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="container py-4">
        <router-link to="/courses" class="text-gray-500 hover:text-purple-600 flex items-center font-medium">
          <span class="mr-2">←</span> 返回课程列表
        </router-link>
      </div>
    </header>

    <main v-if="course" class="container py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <div class="card overflow-hidden mb-6">
            <div class="aspect-[16/9] relative overflow-hidden bg-gray-100">
              <img
                :src="getCourseCover(course.course_category?.code || 'pottery', course.id)"
                :alt="course.title"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
              <div class="absolute top-4 left-4 flex gap-2">
                <span class="bg-white/90 backdrop-blur text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium">
                  {{ course.course_category?.name }}
                </span>
                <span :class="['px-4 py-1.5 rounded-full text-sm font-medium', getDifficultyBadgeClass(course.difficulty_level)]">
                  {{ getDifficultyLabel(course.difficulty_level) }}
                </span>
              </div>
            </div>
          </div>

          <div class="card mb-6">
            <div class="card-body">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-2xl font-bold text-yellow-500">★</span>
                    <span class="text-xl font-bold">{{ (course.average_rating || course.rating || 4.8).toFixed(1) }}</span>
                    <span class="text-gray-500">({{ course.reviews_count || 12 }} 条评价)</span>
                  </div>
                  <div class="text-sm text-gray-500">
                    已有 {{ course.bookings_count || 56 }} 人报名
                  </div>
                </div>
                <div v-if="course.requires_approval" class="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                  ⚠️ 需管理员审批
                </div>
              </div>

              <h1 class="text-3xl font-bold text-gray-800 mb-4">{{ course.title }}</h1>
              <p class="text-gray-600 text-lg leading-relaxed mb-6">{{ course.description }}</p>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-gray-100">
                <div class="text-center">
                  <div class="text-3xl font-bold text-purple-600">{{ course.duration_minutes }}</div>
                  <div class="text-sm text-gray-500 mt-1">课程时长（分钟）</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold text-amber-600">{{ getDifficultyLabel(course.difficulty_level) }}</div>
                  <div class="text-sm text-gray-500 mt-1">难度等级</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold text-green-600">{{ course.min_students }}-{{ course.max_students }}</div>
                  <div class="text-sm text-gray-500 mt-1">上课人数</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold text-blue-600">{{ course.bookings_count || 56 }}</div>
                  <div class="text-sm text-gray-500 mt-1">累计报名</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header text-lg">课程详情</div>
            <div class="card-body">
              <div class="prose max-w-none text-gray-600 leading-relaxed">
                <p class="whitespace-pre-line">{{ course.content || course.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-1">
          <div class="card sticky top-24">
            <div class="card-body">
              <div class="mb-6">
                <div class="flex items-baseline gap-2 mb-2">
                  <span class="text-4xl font-bold text-purple-600">¥{{ course.price }}</span>
                  <span class="text-gray-400">/人</span>
                </div>
                <div v-if="parseFloat(course.material_fee) > 0" class="text-sm text-gray-500">
                  包含材料费 ¥{{ course.material_fee }}
                </div>
              </div>

              <div class="mb-6">
                <h3 class="font-bold text-gray-800 mb-3">选择开课时间</h3>
                <div v-if="loadingSessions" class="py-8 text-center text-gray-400">
                  <div class="loading-spinner mx-auto mb-2"></div>
                  加载中...
                </div>
                <div v-else-if="sessions.length === 0" class="py-8 text-center text-gray-400">
                  暂无开课时间，请稍后再来
                </div>
                <div v-else class="space-y-3 max-h-80 overflow-y-auto pr-1">
                  <button
                    v-for="session in sessions"
                    :key="session.id"
                    @click="selectSession(session)"
                    :disabled="!sessionHasSlots(session)"
                    :class="['w-full p-4 rounded-xl border-2 text-left transition-all', selectedSession?.id === session.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300', !sessionHasSlots(session) ? 'opacity-50 cursor-not-allowed bg-gray-50' : '']"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="font-bold text-gray-800">
                          {{ formatDate(session.start_time) }}
                        </div>
                        <div class="text-sm text-gray-500 mt-1">
                          {{ formatTime(session.start_time) }} - {{ formatTime(session.end_time) }}
                        </div>
                        <div class="text-xs text-gray-400 mt-1">📍 {{ session.location }}</div>
                      </div>
                      <div class="text-right">
                        <div :class="['text-sm font-bold', sessionHasSlots(session) ? 'text-green-600' : 'text-red-500']">
                          {{ session.registered_count }}/{{ course.max_students }}
                        </div>
                        <div class="text-xs text-gray-400">
                          {{ sessionHasSlots(session) ? '可报名' : '已满' }}
                        </div>
                      </div>
                    </div>
                    <div v-if="session.material_package" class="mt-3 pt-3 border-t border-gray-100">
                      <div class="text-xs text-amber-700 flex items-center">
                        <span class="mr-1">📦</span>
                        包含材料包：{{ session.material_package.name }}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div v-if="selectedSession?.material_package" class="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div class="text-sm font-bold text-amber-800 mb-1">📦 材料包说明</div>
                <div class="text-xs text-amber-700">{{ selectedSession.material_package.name }}</div>
                <div class="text-xs text-amber-600 mt-1">
                  库存：{{ selectedSession.material_package.stock_quantity - selectedSession.material_package.reserved_quantity }} 份
                </div>
              </div>

              <button
                @click="handleBooking"
                class="btn btn-primary btn-lg btn-block text-lg py-4"
                :disabled="!selectedSession || booking || !sessionHasSlots(selectedSession)"
              >
                <span v-if="booking" class="loading-spinner inline-block w-5 h-5 mr-2 border-2"></span>
                {{ booking ? '报名中...' : (course.requires_approval ? '提交报名（需审批）' : '立即报名') }}
              </button>

              <p v-if="error" class="text-red-500 text-sm mt-3 text-center">{{ error }}</p>

              <div v-if="course.requires_approval" class="mt-4 p-3 bg-blue-50 rounded-xl">
                <div class="text-sm text-blue-800">
                  <span class="font-bold">ℹ️ 温馨提示：</span>
                  该课程需要管理员审批，审批通过后才能确认报名
                </div>
              </div>

              <div class="mt-6 pt-6 border-t border-gray-100">
                <h4 class="font-bold text-gray-800 mb-3">授课老师</h4>
                <div v-if="teacher" class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                    {{ teacher.user?.name?.charAt(0) || '👨‍🏫' }}
                  </div>
                  <div>
                    <div class="font-bold text-gray-800">{{ teacher.user?.name }}</div>
                    <div class="text-xs text-gray-500">
                      {{ teacher.specialties?.join(' · ') || '资深手作老师' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { courseAPI, bookingAPI } from '../../utils/api'
import { getCourseCover } from '../../utils/images'
import { useAuthStore } from '../../stores/auth'
import { DifficultyLevel } from '../../types'
import type { Course, CourseSession, Teacher } from '../../types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const course = ref<Course | null>(null)
const sessions = ref<CourseSession[]>([])
const teacher = ref<Teacher | null>(null)
const selectedSession = ref<CourseSession | null>(null)
const loading = ref(true)
const loadingSessions = ref(true)
const booking = ref(false)
const error = ref('')

const getDifficultyLabel = (level: DifficultyLevel) => {
  const labels: Record<DifficultyLevel, string> = {
    [DifficultyLevel.VERY_EASY]: '非常简单',
    [DifficultyLevel.EASY]: '入门',
    [DifficultyLevel.MEDIUM]: '中等',
    [DifficultyLevel.HARD]: '进阶',
    [DifficultyLevel.EXPERT]: '专家'
  }
  return labels[level]
}

const getDifficultyBadgeClass = (level: DifficultyLevel) => {
  if (level <= DifficultyLevel.EASY) return 'bg-green-100 text-green-700'
  if (level === DifficultyLevel.MEDIUM) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const sessionHasSlots = (session: CourseSession | null | undefined) => {
  if (!session || !course.value) return false
  return session.registered_count < course.value.max_students
}

const selectSession = (session: CourseSession) => {
  if (!sessionHasSlots(session)) return
  selectedSession.value = session
  error.value = ''
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = getCourseCover('pottery', 999)
}

const loadCourse = async () => {
  const id = Number(route.params.id)
  loading.value = true
  try {
    course.value = await courseAPI.detail(id)
    if (course.value) {
      loadSessions()
    }
  } catch (e) {
    console.error('加载课程失败', e)
  } finally {
    loading.value = false
  }
}

const loadSessions = async () => {
  loadingSessions.value = true
  try {
    const calendar = await courseAPI.calendar()
    const courseId = Number(route.params.id)
    sessions.value = calendar.filter((s: any) => s.course?.id === courseId)
    if (sessions.value.length > 0) {
      teacher.value = sessions.value[0].teacher || null
      const available = sessions.value.find(s => sessionHasSlots(s))
      if (available) selectedSession.value = available
    }
  } catch (e) {
    console.error('加载课程时间失败', e)
  } finally {
    loadingSessions.value = false
  }
}

const handleBooking = async () => {
  if (!authStore.isAuthenticated) {
    router.push(`/login?redirect=/courses/${route.params.id}`)
    return
  }
  if (!authStore.isStudent) {
    error.value = '只有学员身份可以报名课程，请联系管理员'
    return
  }
  if (!selectedSession.value) {
    error.value = '请选择开课时间'
    return
  }
  if (!sessionHasSlots(selectedSession.value)) {
    error.value = '该课程时间已满员，请选择其他时间'
    return
  }

  booking.value = true
  error.value = ''

  try {
    await bookingAPI.create({ course_session_id: selectedSession.value.id })
    router.push('/my/bookings?success=1')
  } catch (e: any) {
    error.value = e.response?.data?.error || '报名失败，请重试'
  } finally {
    booking.value = false
  }
}

onMounted(() => {
  loadCourse()
})
</script>
