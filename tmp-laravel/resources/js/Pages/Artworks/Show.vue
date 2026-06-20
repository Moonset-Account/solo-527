<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref } from 'vue'

const props = defineProps({
  artwork: Object,
})

const feedbackForm = ref({
  content: '',
  score: null,
})

function submitFeedback() {
  router.post(route('artworks.feedback', props.artwork.id), feedbackForm.value, {
    onSuccess: () => {
      feedbackForm.value = { content: '', score: null }
    },
    preserveScroll: true,
  })
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" :page-title="artwork.title">
    <div class="mb-6">
      <Link
        :href="route('artworks.index')"
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回作品列表
      </Link>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="bg-gray-100 flex items-center justify-center min-h-[400px]">
            <img
              v-if="artwork.image_url"
              :src="artwork.image_url"
              :alt="artwork.title"
              class="max-w-full max-h-[600px] object-contain"
            />
            <svg v-else class="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h3 class="text-lg font-bold text-gray-900 mb-4">{{ artwork.title }}</h3>
          <div class="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div>
              <span class="text-gray-500">学生：</span>
              <span class="text-gray-900">{{ artwork.student?.name || '-' }}</span>
            </div>
            <div>
              <span class="text-gray-500">班级：</span>
              <span class="text-gray-900">{{ artwork.art_class?.name || '-' }}</span>
            </div>
            <div>
              <span class="text-gray-500">提交日期：</span>
              <span class="text-gray-900">{{ artwork.created_at }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-500">状态：</span>
              <StatusBadge :status="artwork.status" />
            </div>
          </div>
          <p v-if="artwork.description" class="mt-4 text-sm text-gray-600">{{ artwork.description }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h3 class="text-base font-semibold text-gray-900 mb-4">反馈记录</h3>

          <div v-if="artwork.feedback && artwork.feedback.length" class="space-y-4 mb-6">
            <div
              v-for="fb in artwork.feedback"
              :key="fb.id"
              class="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-900">{{ fb.teacher?.name || '-' }}</span>
                <span v-if="fb.score != null" class="text-sm font-bold text-indigo-600">{{ fb.score }}分</span>
              </div>
              <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ fb.content }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ fb.created_at }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-gray-500 mb-6">暂无反馈记录</p>

          <form @submit.prevent="submitFeedback" class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">反馈内容</label>
              <textarea
                v-model="feedbackForm.content"
                rows="4"
                required
                placeholder="请输入反馈内容..."
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">评分 (0-100)</label>
              <input
                v-model.number="feedbackForm.score"
                type="number"
                min="0"
                max="100"
                placeholder="请输入评分"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              class="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              提交反馈
            </button>
          </form>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
