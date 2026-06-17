<template>
  <MainLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <Link href="/assistance" class="text-gray-500 hover:text-gray-700">&larr; 返回列表</Link>
        <h1 class="text-2xl font-bold text-gray-900">帮扶详情</h1>
      </div>

      <div class="bg-white rounded-lg shadow p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-sm font-medium text-gray-500">标题</span>
            <p class="mt-1 text-gray-900">{{ assistance.title }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">状态</span>
            <p class="mt-1">
              <span :class="statusBadgeClass(assistance.status)" class="px-2 py-1 rounded-full text-xs font-medium">{{ statusLabel(assistance.status) }}</span>
            </p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">居民</span>
            <p class="mt-1 text-gray-900">{{ assistance.resident?.name }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">处理人</span>
            <p class="mt-1 text-gray-900">{{ assistance.handler?.name || '未分配' }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">责任部门</span>
            <p class="mt-1 text-gray-900">{{ assistance.department?.name || '-' }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">截止日期</span>
            <p class="mt-1 text-gray-900">{{ assistance.deadline }}</p>
          </div>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-500">描述</span>
          <p class="mt-1 text-gray-900">{{ assistance.description }}</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link } from '@inertiajs/vue3'

defineProps({
  assistance: Object,
})

const statusLabel = (status) => {
  const map = { pending: '待处理', in_progress: '进行中', completed: '已完成', overdue: '已逾期' }
  return map[status] || status
}

const statusBadgeClass = (status) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}
</script>
