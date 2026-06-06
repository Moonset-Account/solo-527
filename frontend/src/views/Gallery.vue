<template>
  <div class="py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h1 class="font-display text-4xl font-bold text-inkBlack mb-4">作品画廊</h1>
        <p class="text-warmGray text-lg">来自学员的真实手作作品，感受创作的温度</p>
      </div>

      <div class="flex flex-wrap gap-3 mb-8 justify-center">
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

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="work in works"
          :key="work.id"
          class="group cursor-pointer"
          @click="openWork(work)"
        >
          <div class="aspect-square overflow-hidden rounded-card relative">
            <img
              :src="work.images?.[0] || `https://picsum.photos/seed/work${work.id}/400/400`"
              :alt="work.title"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="absolute bottom-0 left-0 right-0 p-4">
                <h4 class="text-white font-medium line-clamp-1">{{ work.title }}</h4>
                <p class="text-white/80 text-sm">{{ work.student?.name || '匿名' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12">
        <el-icon class="text-3xl text-primary-500 animate-spin"><Loading /></el-icon>
      </div>

      <div v-if="works.length > 0" class="mt-12 flex justify-center">
        <el-button @click="loadMore" :loading="loading">
          加载更多
        </el-button>
      </div>

      <el-dialog v-model="showDetail" width="800px" :show-close="true" class="work-detail-dialog">
        <div v-if="selectedWork" class="flex flex-col md:flex-row gap-6">
          <div class="md:w-1/2">
            <img
              :src="selectedWork.images?.[0] || `https://picsum.photos/seed/work${selectedWork.id}/600/600`"
              :alt="selectedWork.title"
              class="w-full rounded-lg"
            />
          </div>
          <div class="md:w-1/2">
            <h2 class="font-display text-2xl font-bold text-inkBlack mb-4">
              {{ selectedWork.title }}
            </h2>
            <div class="flex items-center space-x-2 mb-4">
              <span class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
                {{ selectedWork.student?.name?.[0] || '学' }}
              </span>
              <div>
                <p class="font-medium text-inkBlack">{{ selectedWork.student?.name || '匿名学员' }}</p>
                <p class="text-sm text-warmGray">{{ selectedWork.created_at ? formatDate(selectedWork.created_at) : '' }}</p>
              </div>
            </div>
            <p class="text-warmGray mb-6">{{ selectedWork.description }}</p>
            <div v-if="selectedWork.course" class="bg-wood-50 p-4 rounded-lg">
              <p class="text-sm text-warmGray mb-1">学习课程</p>
              <p class="font-medium text-inkBlack">{{ selectedWork.course.title }}</p>
              <p class="text-sm text-warmGray">老师：{{ selectedWork.course.teacher?.name || '未指定' }}</p>
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import type { Work } from '@/types'
import { getWorks } from '@/api/works'

const loading = ref(false)
const works = ref<Work[]>([])
const showDetail = ref(false)
const selectedWork = ref<Work | null>(null)
const activeCategory = ref('')

const filters = reactive({
  category: '',
  page: 1,
  per_page: 12
})

const categories = [
  { label: '全部', value: '', icon: '🎨' },
  { label: '陶艺', value: 'pottery', icon: '🏺' },
  { label: '银饰', value: 'silver', icon: '💍' },
  { label: '皮具', value: 'leather', icon: '👜' }
]

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const selectCategory = (cat: string) => {
  activeCategory.value = cat
  filters.category = cat
  filters.page = 1
  works.value = []
  fetchWorks()
}

const fetchWorks = async () => {
  loading.value = true
  try {
    const params: any = {
      public: 'true',
      page: filters.page,
      per_page: filters.per_page
    }
    if (filters.category) params.category = filters.category

    const response: any = await getWorks(params)
    if (filters.page === 1) {
      works.value = response.data
    } else {
      works.value = [...works.value, ...response.data]
    }
  } catch (e) {
    const mockWorks = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1 + (filters.page - 1) * 12,
      title: `作品${i + 1}`,
      description: '这是一件精美的手工作品，凝聚了学员的心血和创意。',
      images: [`https://picsum.photos/seed/work${i + 1 + (filters.page - 1) * 12}/400/400`],
      student: { name: `学员${i + 1}` },
      course: { title: '陶艺入门课程', teacher: { name: '李老师' } },
      created_at: '2024-01-15'
    } as Work))
    if (filters.page === 1) {
      works.value = mockWorks
    } else {
      works.value = [...works.value, ...mockWorks]
    }
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  filters.page++
  fetchWorks()
}

const openWork = (work: Work) => {
  selectedWork.value = work
  showDetail.value = true
}

onMounted(() => {
  fetchWorks()
})
</script>

<style scoped>
.work-detail-dialog :deep(.el-dialog) {
  border-radius: 16px;
}
</style>
