<template>
  <MainLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <Link href="/notices" class="text-gray-500 hover:text-gray-700">&larr; 返回列表</Link>
        <h1 class="text-2xl font-bold text-gray-900">结果公示详情</h1>
      </div>

      <div class="bg-white rounded-lg shadow p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-sm font-medium text-gray-500">标题</span>
            <p class="mt-1 text-gray-900 text-lg font-semibold">{{ notice.title }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">类型</span>
            <p class="mt-1">
              <span :class="typeBadgeClass(notice.type)" class="px-2 py-1 rounded-full text-xs font-medium">{{ typeLabel(notice.type) }}</span>
            </p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">发布人</span>
            <p class="mt-1 text-gray-900">{{ notice.publisher?.name }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">发布日期</span>
            <p class="mt-1 text-gray-900">{{ notice.published_at }}</p>
          </div>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-500">内容</span>
          <div class="mt-2 text-gray-900 whitespace-pre-line">{{ notice.content }}</div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link } from '@inertiajs/vue3'

defineProps({
  notice: Object,
})

const typeLabel = (type) => {
  const map = { grid_event: '网格事件', assistance: '帮扶', issue: '议题' }
  return map[type] || type
}

const typeBadgeClass = (type) => {
  const map = {
    grid_event: 'bg-blue-100 text-blue-800',
    assistance: 'bg-green-100 text-green-800',
    issue: 'bg-purple-100 text-purple-800',
  }
  return map[type] || 'bg-gray-100 text-gray-800'
}
</script>
