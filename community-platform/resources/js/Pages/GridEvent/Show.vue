<template>
  <MainLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <Link href="/grid-events" class="text-gray-500 hover:text-gray-700">&larr; 返回列表</Link>
        <h1 class="text-2xl font-bold text-gray-900">事件详情</h1>
      </div>

      <div class="bg-white rounded-lg shadow p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-sm font-medium text-gray-500">标题</span>
            <p class="mt-1 text-gray-900">{{ gridEvent.title }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">状态</span>
            <p class="mt-1">
              <span :class="statusBadgeClass(gridEvent.status)" class="px-2 py-1 rounded-full text-xs font-medium">{{ statusLabel(gridEvent.status) }}</span>
            </p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">位置</span>
            <p class="mt-1 text-gray-900">{{ gridEvent.location }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">事件时间</span>
            <p class="mt-1 text-gray-900">{{ gridEvent.event_time }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">上报人</span>
            <p class="mt-1 text-gray-900">{{ gridEvent.reporter?.name }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">处理人</span>
            <p class="mt-1 text-gray-900">{{ gridEvent.handler?.name || '未分配' }}</p>
          </div>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-500">描述</span>
          <p class="mt-1 text-gray-900">{{ gridEvent.description }}</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link } from '@inertiajs/vue3'

defineProps({
  gridEvent: Object,
})

const statusLabel = (status) => {
  const map = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
  return map[status] || status
}

const statusBadgeClass = (status) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}
</script>
