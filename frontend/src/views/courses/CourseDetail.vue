<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="container py-4">
        <router-link to="/courses" class="text-gray-500 hover:text-purple-600 flex items-center">
          <span class="mr-1">←</span> 返回课程列表
        </router-link>
      </div>
    </header>

    <main v-if="course" class="container py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <div class="card overflow-hidden mb-6">
            <div class="aspect-video bg-gradient-to-br from-purple-100 to-amber-100 flex items-center justify-center">
              <span class="text-8xl opacity-50">🎨</span>
            </div>
          </div>

          <div class="card mb-6">
            <div class="card-body">
              <div class="flex items-center justify-between mb-4">
                <span class="badge badge-primary">{{ course.course_category?.name }}</span>
                <div class="flex items-center space-x-1">
                  <span class="text-yellow-500">★</span>
                  <span class="font-medium">{{ course.average_rating || course.rating }}</span>
                  <span class="text-gray-400 text-sm">({{ course.reviews_count }}条评价)</span>
                </div>
              </div>

              <h1 class="text-2xl font-bold text-gray-800 mb-4">{{ course.title }}</h1>

              <p class="text-gray-600 mb-6">{{ course.description }}</p>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100">
                <div class="text-center">
                  <div class="text-2xl font-bold text-purple-600">{{ course.duration_minutes }}</div>
                  <div class="text-sm text-gray-500">分钟</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-amber-600">{{ getDifficultyLabel(course.difficulty_level) }}</div>
                  <div class="text-sm text-gray-500">难度</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">{{ course.min_students }}-{{ course.max_students }}</div>
                  <div class="text-sm text-gray-500">人数</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">{{ course.bookings_count }}</div>
                  <div class="text-sm text-gray-500">已报名</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">课程介绍</div>
            <div class="card-body">
              <div class="prose max-w-none text-gray-600">
                <p>{{ course.content || course.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-1">
          <div class="card sticky top-24">
            <div class="card-body">
              <div class="mb-6">
                <div class="flex items-baseline space-x-2">
                  <span class="text-3xl font-bold text-purple-600">¥{{ course.price }}</span>
                  <span class="text-gray-400">/人</span>
                </div>
                <div v-if="parseFloat(course.material_fee) > 0" class="text-sm text-gray-500 mt-1">
                  包含材料费 ¥{{ course.material_fee }}
                </div>
              </div>

              <div class="mb-6">
                <h3 class="font-medium text-gray-800 mb-3">选择开课时间</h3>
                <div v-if="loadingSessions" class="py-4 text-center text-gray-400">加载中...</div>
                <div v-else-if="sessions.length === 0" class="py-4 text-center text-gray-400">
                  暂无开课时间
                </div>
                <div v-else class="space-y-2 max-h-64 overflow-y-auto">
                  <button
                    v-for="session in sessions"
                    :key="session.id"
                    @click="selectedSession = session"
                    :class="['w-full p-3 rounded-lg border text-left transition-all', selectedSession?.id === session.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300']"
                    :disabled="session.registered_count >= (session as any).course?.max_students"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="font-medium text-gray-800">
                          {{ formatDate(session.start_time) }}
                        </div>
                        <div class="text-sm text-gray-500">
                          {{ formatTime(session.start_time) }} - {{ formatTime(session.end_time) }}
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm" :class="session.registered_count >= (session as any).course?.max_students ? 'text-red-500' : 'text-green-500'">
                          {{ session.registered_count }}/{{ (session as any).course?.max_students }}
                        </div>
                        <div class="text-xs text-gray-400">{{ session.location }}</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div v-if="selectedSession?.material_package" class="mb-6 p-3 bg-amber-50 rounded-lg">
                <div class="text-sm font-medium text-amber-800">包含材料包</div>
                <div class="text-xs text-amber-600">{{ selectedSession.material_package.name }}</div>
              </div>

              <button
                @click="handleBooking"
                class="btn btn-primary btn-lg btn-block"
                :disabled="!selectedSession || booking"
              >
                <span v-if="booking" class="loading-spinner inline-block w-4 h-4 mr-2"></span>
                {{ booking ? '报名中...' : '立即报名' }}
              </button>

              <p v-if="error" class="text-red-500 text-sm mt-3 text-center">{{ error }}</p>

              <div v-if="course.requires_approval" class="mt-4 p-3 bg-blue-50 rounded-lg">
                <div class="text-sm text-blue-800">
                  <span class="font-medium">注意：</span>该课程需要管理员审批后才能确认报名
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { courseAPI, bookingAPI } from '../../utils/api'
import { useAuthStore } from '../../stores/auth'
import type { Course, CourseSession, DifficultyLevel } from '../../types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const course = ref<Course | null>(null)
const sessions = ref<CourseSession[]>([])
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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]}`
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const loadCourse = async () => {
  const id = Number(route.params.id)
  try {
    course.value = await courseAPI.detail(id)
  } catch (e) {
    console.error('加载课程失败', e)
  } finally {
    loading.value = false
  }
}

const loadSessions = async () => {
  const id = Number(route.params.id)
  loadingSessions.value = true
  try {
    const calendar = await courseAPI.calendar()
    sessions.value = calendar.filter((s: any) => s.course?.id === id)
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
    error.value = '只有学员身份可以报名课程'
    return
  }
  if (!selectedSession.value) {
    error.value = '请选择开课时间'
    return
  }

  booking.value = true
  error.value = ''

  try {
    await bookingAPI.create({ course_session_id: selectedSession.value.id })
    router.push('/my/bookings')
  } catch (e: any) {
    error.value = e.response?.data?.error || '报名失败，请重试'
  } finally {
    booking.value = false
  }
}

onMounted(() => {
  loadCourse()
  loadSessions()
})
</script>
