<template>
  <div class="py-12">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <el-breadcrumb class="mb-6" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/gallery' }">作品画廊</el-breadcrumb-item>
        <el-breadcrumb-item>{{ work?.title || '作品详情' }}</el-breadcrumb-item>
      </el-breadcrumb>

      <div v-if="loading" class="text-center py-20">
        <el-icon class="text-4xl text-primary-500 animate-spin"><Loading /></el-icon>
      </div>

      <div v-else-if="work" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div class="card overflow-hidden">
            <div class="aspect-square">
              <img
                :src="work.images?.[0] || `https://picsum.photos/seed/work${work.id}/800/800`"
                :alt="work.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-if="work.images && work.images.length > 1" class="p-4 grid grid-cols-4 gap-3">
              <div
                v-for="(img, idx) in work.images.slice(0, 4)"
                :key="idx"
                class="aspect-square rounded-lg overflow-hidden cursor-pointer border-2"
                :class="selectedImageIndex === idx ? 'border-primary-500' : 'border-transparent'"
                @click="selectedImageIndex = idx"
              >
                <img :src="img" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="card p-8">
            <div class="flex items-center space-x-2 mb-4">
              <el-tag v-if="work.is_public" type="success" size="small">公开</el-tag>
              <el-tag v-else type="info" size="small">私密</el-tag>
              <span v-if="work.authorized_by_student" class="text-xs text-warmGray">✓ 学员已授权</span>
            </div>

            <h1 class="font-display text-3xl font-bold text-inkBlack mb-4">
              {{ work.title }}
            </h1>

            <div class="flex items-center space-x-3 mb-6 pb-6 border-b border-wood-100">
              <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg">
                {{ work.student?.name?.[0] || '学' }}
              </div>
              <div>
                <p class="font-medium text-inkBlack">{{ work.student?.name || '匿名学员' }}</p>
                <p class="text-sm text-warmGray">{{ formatDate(work.created_at) }} 创作</p>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="font-semibold text-inkBlack mb-2">作品介绍</h3>
              <p class="text-warmGray leading-relaxed">{{ work.description || '暂无介绍' }}</p>
            </div>

            <div v-if="work.course" class="bg-wood-50 p-5 rounded-xl mb-6">
              <p class="text-sm text-warmGray mb-2">学习课程</p>
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold text-inkBlack">{{ work.course.title }}</p>
                  <p class="text-sm text-warmGray">
                    老师：{{ work.course.teacher?.name || '未指定' }}
                  </p>
                </div>
                <router-link :to="`/courses/${work.course.id}`" class="btn-primary text-sm py-2 px-4">
                  了解课程
                </router-link>
              </div>
            </div>

            <div v-if="work.review" class="bg-primary-50 p-5 rounded-xl">
              <p class="text-sm text-warmGray mb-2">学员评价</p>
              <div class="flex items-center mb-2">
                <el-rate v-model="work.review.rating" disabled size="small" />
                <span class="text-sm text-warmGray ml-2">{{ work.review.rating }}分</span>
              </div>
              <p class="text-inkBlack">{{ work.review.content }}</p>
            </div>

            <div class="mt-8 flex gap-3">
              <el-button type="primary" class="flex-1" @click="handleLike">
                ❤️ 喜欢 ({{ work.likes_count || 0 }})
              </el-button>
              <el-button @click="handleShare">分享</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Work } from '@/types'
import { getWork } from '@/api/works'

const route = useRoute()
const loading = ref(false)
const work = ref<Work | null>(null)
const selectedImageIndex = ref(0)

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchWork = async () => {
  const id = Number(route.params.id)
  if (!id) return

  loading.value = true
  try {
    const data = await getWork(id)
    work.value = data as Work
  } catch (e) {
    work.value = {
      id,
      title: '手工陶杯 · 初体验',
      description: '第一次尝试陶艺拉坯，从揉泥开始一步步学习。老师非常耐心地指导，虽然成品还有些不完美，但这是我亲手做的第一件作品，对我来说意义非凡。\n\n制作过程中最困难的是拉坯环节，手的力度和位置都很讲究，失败了好几次才找到感觉。不过看到最终的成品，一切都值得了。',
      images: [
        `https://picsum.photos/seed/work${id}/800/800`,
        `https://picsum.photos/seed/work${id}b/800/800`,
        `https://picsum.photos/seed/work${id}c/800/800`
      ],
      is_public: true,
      authorized_by_student: true,
      likes_count: 24,
      created_at: '2024-01-10',
      student: { id: 1, name: '张小美' },
      course: {
        id: 1,
        title: '陶艺入门 · 手工拉坯',
        teacher: { id: 1, name: '李老师' }
      },
      review: {
        id: 1,
        rating: 5,
        content: '老师非常耐心，零基础也能做出满意的作品。工作室环境很好，材料也很充足。强烈推荐给喜欢手作的朋友！'
      }
    } as Work
  } finally {
    loading.value = false
  }
}

const handleLike = () => {
  if (work.value) {
    work.value.likes_count = (work.value.likes_count || 0) + 1
    ElMessage.success('感谢您的喜欢 💕')
  }
}

const handleShare = () => {
  ElMessage.info('分享功能开发中')
}

onMounted(() => {
  fetchWork()
})
</script>
