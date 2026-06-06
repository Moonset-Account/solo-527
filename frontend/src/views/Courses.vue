<template>
  <div class="py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h1 class="font-display text-4xl font-bold text-inkBlack mb-4">全部课程</h1>
        <p class="text-warmGray text-lg">探索陶艺、银饰、皮具等手作课程，开启你的创作之旅</p>
      </div>

      <div class="bg-white rounded-card shadow-sm p-6 mb-8">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[200px]">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索课程名称..."
              :prefix-icon="Search"
              clearable
              @input="fetchCourses"
            />
          </div>
          <el-select
            v-model="filters.category"
            placeholder="课程分类"
            clearable
            class="w-40"
            @change="fetchCourses"
          >
            <el-option label="全部" value="" />
            <el-option label="陶艺" value="pottery" />
            <el-option label="银饰" value="silver" />
            <el-option label="皮具" value="leather" />
          </el-select>
          <el-select
            v-model="filters.priceRange"
            placeholder="价格区间"
            clearable
            class="w-40"
          >
            <el-option label="全部" value="" />
            <el-option label="¥200以下" value="0-200" />
            <el-option label="¥200-400" value="200-400" />
            <el-option label="¥400以上" value="400+" />
          </el-select>
          <el-button type="primary" @click="fetchCourses" :icon="Search">
            搜索
          </el-button>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mb-8">
        <el-tag
          v-for="cat in categories"
          :key="cat.value"
          :type="activeCategory === cat.value ? 'primary' : 'info'"
          effect="plain"
          size="large"
          class="cursor-pointer"
          @click="selectCategory(cat.value)"
        >
          {{ cat.icon }} {{ cat.label }}
        </el-tag>
      </div>

      <div v-if="loading" class="text-center py-20">
        <el-icon class="text-4xl text-primary-500 animate-spin"><Loading /></el-icon>
        <p class="mt-4 text-warmGray">加载中...</p>
      </div>

      <div v-else-if="courses.length === 0" class="text-center py-20">
        <span class="text-6xl mb-4 block">🔍</span>
        <h3 class="text-xl font-medium text-wood-700 mb-2">暂无符合条件的课程</h3>
        <p class="text-warmGray">试试调整筛选条件吧</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="course in courses"
          :key="course.id"
          class="card card-hover"
        >
          <div class="aspect-video overflow-hidden relative">
            <img
              :src="course.cover_image || `https://picsum.photos/seed/course${course.id}/600/340`"
              :alt="course.title"
              class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            />
            <div class="absolute top-4 left-4 flex gap-2">
              <span class="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-primary-700">
                {{ getCategoryName(course.category) }}
              </span>
              <span
                v-if="course.material_kit?.status === 'out_of_stock'"
                class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium"
              >
                材料售罄
              </span>
            </div>
          </div>
          <div class="p-6">
            <h3 class="font-display text-xl font-semibold text-inkBlack mb-2">
              {{ course.title }}
            </h3>
            <p class="text-warmGray text-sm line-clamp-2 mb-4">
              {{ course.description }}
            </p>
            <div class="flex items-center space-x-4 text-sm text-warmGray mb-4">
              <span v-if="course.teacher">👨‍🏫 {{ course.teacher.name }}</span>
              <span>⏱ {{ course.duration }}分钟</span>
              <span>👥 最多{{ course.max_students }}人</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-2xl font-bold text-primary-600">
                ¥{{ course.price }}
              </span>
              <router-link
                :to="`/courses/${course.id}`"
                class="btn-primary text-sm py-2 px-5"
              >
                查看详情
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <div v-if="pagination && pagination.total_pages > 1" class="mt-12 flex justify-center">
        <el-pagination
          v-model:current-page="filters.page"
          :page-size="filters.per_page"
          :total="pagination.total_count"
          layout="prev, pager, next"
          @current-change="fetchCourses"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Loading } from '@element-plus/icons-vue'
import type { Course, PaginatedResponse } from '@/types'
import { getCourses } from '@/api/courses'

const route = useRoute()
const loading = ref(false)
const courses = ref<Course[]>([])
const pagination = ref({ total_pages: 0, total_count: 0 })

const filters = reactive({
  keyword: '',
  category: route.query.category as string || '',
  priceRange: '',
  page: 1,
  per_page: 9
})

const activeCategory = ref(filters.category)

const categories = [
  { label: '全部', value: '', icon: '🎨' },
  { label: '陶艺', value: 'pottery', icon: '🏺' },
  { label: '银饰', value: 'silver', icon: '💍' },
  { label: '皮具', value: 'leather', icon: '👜' }
]

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    pottery: '陶艺',
    silver: '银饰',
    leather: '皮具'
  }
  return names[category] || category
}

const selectCategory = (cat: string) => {
  activeCategory.value = cat
  filters.category = cat
  filters.page = 1
  fetchCourses()
}

const fetchCourses = async () => {
  loading.value = true
  try {
    const params: any = {
      page: filters.page,
      per_page: filters.per_page
    }
    if (filters.category) params.category = filters.category
    if (filters.keyword) params.keyword = filters.keyword

    const response: PaginatedResponse<Course> = await getCourses(params)
    courses.value = response.data
    pagination.value = {
      total_pages: response.meta.total_pages,
      total_count: response.meta.total_count
    }
  } catch (e) {
    courses.value = [
      { id: 1, title: '手工拉坯入门', category: 'pottery', description: '从基础开始学习陶艺拉坯技法', duration: 180, price: 299, max_students: 8, cover_image: 'https://picsum.photos/seed/course1/600/340' } as Course,
      { id: 2, title: '银饰戒指制作', category: 'silver', description: '亲手打造一枚专属银戒指', duration: 240, price: 399, max_students: 6, cover_image: 'https://picsum.photos/seed/course2/600/340' } as Course,
      { id: 3, title: '短款钱包制作', category: 'leather', description: '学习皮具基础缝制技法', duration: 210, price: 349, max_students: 8, cover_image: 'https://picsum.photos/seed/course3/600/340' } as Course
    ]
    pagination.value = { total_pages: 1, total_count: 3 }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCourses()
})
</script>
