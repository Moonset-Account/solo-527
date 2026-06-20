<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref } from 'vue'

const props = defineProps({
  student: Object,
})

const activeTab = ref('artworks')

const typeColorMap = {
  praise: 'bg-green-100 text-green-700',
  concern: 'bg-red-100 text-red-700',
  suggestion: 'bg-blue-100 text-blue-700',
}
const typeLabels = { praise: '表扬', concern: '关注', suggestion: '建议' }
const genderLabels = { male: '男', female: '女' }
</script>

<template>
  <AdminLayout :auth="$page.props.auth" :page-title="student.name">
    <div class="mb-6">
      <Link
        :href="route('students.index')"
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回学生列表
      </Link>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-bold text-gray-900">{{ student.name }}</h2>
          <span class="text-sm text-gray-500">{{ student.art_class?.name || '-' }}</span>
          <StatusBadge :status="student.status" />
        </div>
        <Link
          :href="route('students.index')"
          class="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          编辑
        </Link>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-3 gap-x-6 text-sm">
        <div>
          <span class="text-gray-500">性别</span>
          <div class="text-gray-900 font-medium mt-0.5">{{ genderLabels[student.gender] || student.gender || '-' }}</div>
        </div>
        <div>
          <span class="text-gray-500">出生日期</span>
          <div class="text-gray-900 font-medium mt-0.5">{{ student.birth_date || '-' }}</div>
        </div>
        <div>
          <span class="text-gray-500">电话</span>
          <div class="text-gray-900 font-medium mt-0.5">{{ student.phone || '-' }}</div>
        </div>
        <div>
          <span class="text-gray-500">监护人</span>
          <div class="text-gray-900 font-medium mt-0.5">{{ student.guardian_name || '-' }}</div>
        </div>
        <div>
          <span class="text-gray-500">监护人电话</span>
          <div class="text-gray-900 font-medium mt-0.5">{{ student.guardian_phone || '-' }}</div>
        </div>
        <div>
          <span class="text-gray-500">入学日期</span>
          <div class="text-gray-900 font-medium mt-0.5">{{ student.enrollment_date || '-' }}</div>
        </div>
      </div>
    </div>

    <div class="mb-4 border-b border-gray-200">
      <nav class="flex gap-6">
        <button
          @click="activeTab = 'artworks'"
          :class="[
            'pb-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'artworks'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
        >
          作品
        </button>
        <button
          @click="activeTab = 'feedback'"
          :class="[
            'pb-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'feedback'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
        >
          反馈记录
        </button>
      </nav>
    </div>

    <div v-if="activeTab === 'artworks'">
      <div v-if="student.artworks && student.artworks.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="artwork in student.artworks"
          :key="artwork.id"
          class="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div class="aspect-[4/3] bg-gray-100 flex items-center justify-center">
            <img
              v-if="artwork.image_url"
              :src="artwork.image_url"
              :alt="artwork.title"
              class="w-full h-full object-cover"
            />
            <svg v-else class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="p-4">
            <h4 class="text-sm font-medium text-gray-900 truncate">{{ artwork.title }}</h4>
            <div class="flex items-center justify-between mt-2">
              <StatusBadge :status="artwork.status" />
              <span v-if="artwork.feedback && artwork.feedback.length && artwork.feedback[0].score != null" class="text-sm font-bold text-indigo-600">{{ artwork.feedback[0].score }}分</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">
        暂无作品
      </div>
    </div>

    <div v-if="activeTab === 'feedback'">
      <div v-if="student.home_school_feedback && student.home_school_feedback.length" class="space-y-4">
        <div
          v-for="fb in student.home_school_feedback"
          :key="fb.id"
          class="bg-white rounded-xl border border-gray-200 p-5"
        >
          <div class="flex items-center gap-3 mb-3">
            <span :class="[typeColorMap[fb.type] || 'bg-gray-100 text-gray-700', 'inline-block rounded-full px-2 py-0.5 text-xs font-medium']">
              {{ typeLabels[fb.type] || fb.type }}
            </span>
            <span class="text-sm font-medium text-gray-900">{{ fb.teacher?.name || '-' }}</span>
            <span class="text-xs text-gray-400">{{ fb.created_at }}</span>
          </div>
          <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ fb.content }}</p>
          <div v-if="fb.parent_reply" class="mt-3 pl-4 border-l-2 border-gray-200">
            <p class="text-xs text-gray-500 mb-1">家长回复</p>
            <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ fb.parent_reply }}</p>
          </div>
        </div>
      </div>
      <div v-else class="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">
        暂无反馈记录
      </div>
    </div>
  </AdminLayout>
</template>
