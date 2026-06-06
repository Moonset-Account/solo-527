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

    <div class="bg-gradient-to-br from-purple-600 to-amber-500 text-white py-16">
      <div class="container">
        <h1 class="text-4xl font-bold mb-4">发现手作的乐趣</h1>
        <p class="text-xl opacity-90 mb-8">陶艺 · 银饰 · 皮具 · 零基础也能轻松上手</p>
        <div class="flex gap-4">
          <div class="bg-white/20 backdrop-blur rounded-xl px-6 py-3 text-center">
            <div class="text-2xl font-bold">{{ courses.length }}</div>
            <div class="text-sm opacity-80">精品课程</div>
          </div>
          <div class="bg-white/20 backdrop-blur rounded-xl px-6 py-3 text-center">
            <div class="text-2xl font-bold">3</div>
            <div class="text-sm opacity-80">专业品类</div>
          </div>
          <div class="bg-white/20 backdrop-blur rounded-xl px-6 py-3 text-center">
            <div class="text-2xl font-bold">3</div>
            <div class="text-sm opacity-80">资深老师</div>
          </div>
        </div>
      </div>
    </div>

    <main class="container py-8 -mt-8">
      <div class="card p-6 mb-8">
        <h3 class="font-bold text-gray-800 mb-4">选择品类</h3>
        <div class="flex flex-wrap gap-3">
          <button
            @click="selectedCategory = undefined"
            :class="['px-5 py-2.5 rounded-xl text-sm font-medium transition-all', !selectedCategory ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']"
          >
            全部课程
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            @click="selectedCategory = cat.id"
            :class="['px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2', selectedCategory === cat.id ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']"
          >
            <span>{{ getCategoryIcon(cat.code) }}</span>
            {{ cat.name }}
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-800">
          {{ selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : '全部' }}课程
        </h2>
        <div class="flex gap-2">
          <button
            v-for="diff in difficulties"
            :key="diff.value"
            @click="selectedDifficulty = selectedDifficulty === diff.value ? undefined : diff.value"
            :class="['px-3 py-1.5 rounded-lg text-sm transition-all', selectedDifficulty === diff.value ? 'bg-amber-100 text-amber-700 border border-amber-200 font-medium' : 'bg-white text-gray-500 border border-gray-200 hover:border-amber-200']"
          >
            {{ diff.label }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading py-16">
        <div class="loading-spinner w-10 h-10 border-4"></div>
      </div>

      <div v-else-if="courses.length === 0" class="empty-state card py-16">
        <div class="empty-state-icon text-6xl">📭</div>
        <div class="empty-state-text text-lg">暂无课程</div>
        <div class="empty-state-desc">请选择其他分类查看</div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link
          v-for="(course, index) in courses"
          :key="course.id"
          :to="`/courses/${course.id}`"
          class="card overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer bg-white"
        >
          <div class="aspect-[4/3] relative overflow-hidden bg-gray-100">
            <img
              :src="getCourseCover(course.course_category?.code || 'pottery', course.id)"
              :alt="course.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              @error="handleImageError($event, course.course_category?.code || 'pottery', course.id)"
            />
            <div class="absolute top-3 left-3 flex gap-2">
              <span class="bg-white/90 backdrop-blur text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                {{ course.course_category?.name }}
              </span>
              <span :class="['px-3 py-1 rounded-full text-xs font-medium', getDifficultyBadgeClass(course.difficulty_level)]">
                {{ getDifficultyLabel(course.difficulty_level) }}
              </span>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div class="flex items-center justify-between text-white">
                <div class="flex items-center gap-1">
                  <span class="text-yellow-400">★</span>
                  <span class="font-medium">{{ (course.average_rating || course.rating || 4.8).toFixed(1) }}</span>
                  <span class="text-white/70 text-sm">({{ course.reviews_count || Math.floor(Math.random() * 50) + 5 }})</span>
                </div>
                <div class="text-sm">
                  <span class="text-white/70">{{ course.duration_minutes }}分钟</span>
                </div>
              </div>
            </div>
          </div>
          <div class="p-5">
            <h3 class="font-bold text-lg text-gray-800 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
              {{ course.title }}
            </h3>
            <p class="text-gray-500 text-sm mb-4 line-clamp-2 h-10">
              {{ course.description }}
            </p>
            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
              <div class="text-sm text-gray-500">
                最多 {{ course.max_students }} 人小班
              </div>
              <div class="text-right">
                <span class="text-2xl font-bold text-purple-600">¥{{ course.price }}</span>
                <span class="text-gray-400 text-sm">/人</span>
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </main>

    <footer class="bg-gray-900 text-gray-400 py-12 mt-16">
      <div class="container">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🎨</span>
            <span class="font-bold text-white text-lg">手作工作室</span>
          </div>
          <div class="text-sm">
            © 2024 手作工作室 · 用心创造美好
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { courseAPI, courseCategoryAPI } from '../../utils/api'
import { getCourseCover } from '../../utils/images'
import { DifficultyLevel } from '../../types'
import type { Course, CourseCategory } from '../../types'

const router = useRouter()
const authStore = useAuthStore()

const courses = ref<Course[]>([])
const categories = ref<CourseCategory[]>([])
const selectedCategory = ref<number | undefined>()
const selectedDifficulty = ref<number | undefined>()
const loading = ref(true)

const difficulties: { value: DifficultyLevel; label: string }[] = [
  { value: DifficultyLevel.EASY, label: '入门' },
  { value: DifficultyLevel.MEDIUM, label: '中等' },
  { value: DifficultyLevel.HARD, label: '进阶' }
]

const getCategoryIcon = (code?: string) => {
  const icons: Record<string, string> = { pottery: '🏺', silver: '💍', leather: '👜' }
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

const getDifficultyBadgeClass = (level: DifficultyLevel) => {
  if (level <= DifficultyLevel.EASY) return 'bg-green-100 text-green-700'
  if (level === DifficultyLevel.MEDIUM) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

const handleImageError = (e: Event, category: string, id: number) => {
  const target = e.target as HTMLImageElement
  target.src = getCourseCover(category, id + 100)
}

const loadCourses = async () => {
  loading.value = true
  try {
    const params: any = { per_page: 50 }
    if (selectedCategory.value) params.category_id = selectedCategory.value
    if (selectedDifficulty.value !== undefined) params.difficulty = selectedDifficulty.value
    const response = await courseAPI.list(params)
    courses.value = response.courses || []
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
    categories.value = [
      { id: 1, name: '陶艺', code: 'pottery', sort_order: 1, is_active: true },
      { id: 2, name: '银饰', code: 'silver', sort_order: 2, is_active: true },
      { id: 3, name: '皮具', code: 'leather', sort_order: 3, is_active: true }
    ]
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

watch([selectedCategory, selectedDifficulty], () => {
  loadCourses()
})

onMounted(() => {
  loadCategories()
  loadCourses()
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
