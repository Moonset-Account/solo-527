<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="container py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center space-x-2">
          <span class="text-2xl">🎨</span>
          <span class="font-bold text-lg text-gray-800">手作工作室</span>
        </router-link>
        <nav class="flex items-center space-x-6">
          <router-link to="/courses" class="text-purple-600 font-medium">课程</router-link>
          <router-link to="/calendar" class="text-gray-600 hover:text-purple-600">日历</router-link>
          <router-link to="/artworks" class="text-gray-600 hover:text-purple-600">作品</router-link>
          <template v-if="authStore.isAuthenticated">
            <router-link to="/my/bookings" class="text-gray-600 hover:text-purple-600">我的</router-link>
            <button @click="handleLogout" class="text-gray-600 hover:text-red-500 text-sm">退出</button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-outline btn-sm">登录</router-link>
          </template>
        </nav>
      </div>
    </header>

    <main class="container py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">探索手作课程</h1>
        <p class="text-gray-500">发现陶艺、银饰、皮具等精彩手作体验</p>
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectedCategory = cat.id"
          :class="['px-4 py-2 rounded-full text-sm font-medium transition-all', selectedCategory === cat.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-200']"
        >
          {{ cat.name }}
        </button>
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="diff in difficulties"
          :key="diff.value"
          @click="selectedDifficulty = selectedDifficulty === diff.value ? undefined : diff.value"
          :class="['px-3 py-1.5 rounded-lg text-sm transition-all', selectedDifficulty === diff.value ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white text-gray-500 border border-gray-200 hover:border-amber-200']"
        >
          {{ diff.label }}
        </button>
      </div>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
      </div>

      <div v-else-if="courses.length === 0" class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">暂无课程</div>
        <div class="empty-state-desc">请稍后再来查看</div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link
          v-for="course in courses"
          :key="course.id"
          :to="`/courses/${course.id}`"
          class="card overflow-hidden hover:shadow-lg transition-shadow group"
        >
          <div class="aspect-video bg-gradient-to-br from-purple-100 to-amber-100 relative overflow-hidden">
            <div class="absolute inset-0 flex items-center justify-center text-5xl opacity-50 group-hover:scale-110 transition-transform">
              {{ getCategoryIcon(course.course_category?.code) }}
            </div>
            <div class="absolute top-3 left-3">
              <span class="badge badge-primary">{{ course.course_category?.name }}</span>
            </div>
            <div class="absolute top-3 right-3">
              <span :class="['badge', getDifficultyBadge(course.difficulty_level)]">
                {{ getDifficultyLabel(course.difficulty_level) }}
              </span>
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-bold text-lg text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
              {{ course.title }}
            </h3>
            <p class="text-gray-500 text-sm line-clamp-2 mb-3">{{ course.description }}</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-1">
                <span class="text-yellow-500">★</span>
                <span class="text-sm font-medium">{{ course.average_rating || course.rating }}</span>
                <span class="text-gray-400 text-sm">({{ course.reviews_count }})</span>
              </div>
              <div class="text-right">
                <span class="text-xl font-bold text-purple-600">¥{{ course.price }}</span>
                <span class="text-gray-400 text-sm">/人</span>
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { courseAPI, courseCategoryAPI } from '../../utils/api'
import type { Course, CourseCategory, DifficultyLevel } from '../../types'

const router = useRouter()
const authStore = useAuthStore()

const courses = ref<Course[]>([])
const categories = ref<CourseCategory[]>([])
const selectedCategory = ref<number | undefined>()
const selectedDifficulty = ref<number | undefined>()
const loading = ref(true)

const difficulties = [
  { value: DifficultyLevel.VERY_EASY, label: '非常简单' },
  { value: DifficultyLevel.EASY, label: '入门' },
  { value: DifficultyLevel.MEDIUM, label: '中等' },
  { value: DifficultyLevel.HARD, label: '进阶' }
]

const getCategoryIcon = (code?: string) => {
  const icons: Record<string, string> = {
    pottery: '🏺',
    silver: '💍',
    leather: '👜'
  }
  return icons[code || ''] || '🎨'
}

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

const getDifficultyBadge = (level: DifficultyLevel) => {
  if (level <= DifficultyLevel.EASY) return 'badge-success'
  if (level === DifficultyLevel.MEDIUM) return 'badge-warning'
  return 'badge-danger'
}

const loadCourses = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedCategory.value) params.category_id = selectedCategory.value
    if (selectedDifficulty.value !== undefined) params.difficulty = selectedDifficulty.value
    const response = await courseAPI.list(params)
    courses.value = response.courses
  } catch (e) {
    console.error('加载课程失败', e)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    categories.value = await courseCategoryAPI.list()
  } catch (e) {
    console.error('加载分类失败', e)
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  loadCategories()
  loadCourses()
})
</script>
