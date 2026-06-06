<template>
  <div>
    <h2 class="font-display text-xl font-bold text-inkBlack mb-6">我的评价</h2>

    <div class="space-y-4">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="card p-6"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-14 h-14 rounded-lg overflow-hidden shrink-0">
              <img
                :src="review.course?.cover_image || `https://picsum.photos/seed/course${review.course_id}/100/100`"
                :alt="review.course?.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 class="font-semibold text-inkBlack">{{ review.course?.title || '课程' }}</h3>
              <p class="text-sm text-warmGray">{{ formatDate(review.created_at) }}</p>
            </div>
          </div>
          <el-rate v-model="review.rating" disabled size="small" />
        </div>
        <p class="text-inkBlack mb-4">{{ review.content }}</p>
        <div v-if="review.images && review.images.length > 0" class="flex gap-3 mb-4">
          <img
            v-for="(img, idx) in review.images.slice(0, 4)"
            :key="idx"
            :src="img"
            class="w-20 h-20 object-cover rounded-lg"
          />
        </div>
        <div class="flex justify-end space-x-2">
          <el-button size="small" link type="primary">编辑</el-button>
          <el-button size="small" link type="danger">删除</el-button>
        </div>
      </div>

      <div v-if="reviews.length === 0" class="card p-12 text-center">
        <span class="text-5xl mb-4 block">⭐</span>
        <h3 class="font-medium text-inkBlack mb-2">暂无评价</h3>
        <p class="text-warmGray">完成课程后记得来评价哦</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Review } from '@/types'

const reviews = ref<Review[]>([])

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const fetchReviews = async () => {
  reviews.value = [
    {
      id: 1,
      rating: 5,
      content: '老师非常耐心，零基础也能做出满意的作品。工作室环境很好，材料也很充足。强烈推荐给喜欢手作的朋友！',
      images: ['https://picsum.photos/seed/review1/200/200'],
      created_at: '2024-01-12',
      course_id: 1,
      course: {
        id: 1,
        title: '陶艺入门 · 手工拉坯',
        cover_image: 'https://picsum.photos/seed/course1/100/100'
      }
    },
    {
      id: 2,
      rating: 4,
      content: '整体体验很好，银饰制作比想象中复杂，但是老师指导得很细致。成品很精美，送给女朋友她很喜欢。',
      created_at: '2024-01-08',
      course_id: 2,
      course: {
        id: 2,
        title: '银饰戒指制作',
        cover_image: 'https://picsum.photos/seed/course2/100/100'
      }
    }
  ] as Review[]
}

onMounted(() => {
  fetchReviews()
})
</script>
