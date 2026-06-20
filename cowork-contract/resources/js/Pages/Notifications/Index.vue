<script setup>
import { Link, router } from '@inertiajs/vue3'


const props = defineProps({
  notifications: Object,
})

const categoryColors = {
  contract: 'bg-blue-100 text-blue-800',
  bill: 'bg-green-100 text-green-800',
  risk: 'bg-red-100 text-red-800',
  system: 'bg-gray-100 text-gray-800',
}

const categoryLabels = {
  contract: '合同',
  bill: '账单',
  risk: '风险',
  system: '系统',
}

function markAsRead(notificationId) {
  router.put(route('notifications.read', notificationId))
}

function markAllRead() {
  router.post(route('notifications.readAll'))
}
</script>

<template>
  <div>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">通知</h1>
        <button @click="markAllRead" class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
          <svg class="mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          全部标记已读
        </button>
      </div>

      <div class="space-y-3">
        <div v-for="notification in notifications.data" :key="notification.id" :class="[notification.read_at ? 'bg-white' : 'bg-blue-50 border-l-4 border-l-blue-500', 'rounded-lg shadow p-4 transition-colors']">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 mb-1">
                <h3 :class="[notification.read_at ? 'text-gray-700' : 'text-gray-900 font-semibold', 'text-sm']">{{ notification.title }}</h3>
                <span v-if="notification.category" :class="[categoryColors[notification.category] || 'bg-gray-100 text-gray-800', 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium']">{{ categoryLabels[notification.category] || notification.category }}</span>
                <span v-if="!notification.read_at" class="inline-flex items-center rounded-full bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white">未读</span>
              </div>
              <p class="text-sm text-gray-600">{{ notification.body }}</p>
              <p class="mt-1 text-xs text-gray-400">{{ notification.created_at }}</p>
            </div>
            <div class="ml-4 flex-shrink-0">
              <button v-if="!notification.read_at" @click="markAsRead(notification.id)" class="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-blue-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">标记已读</button>
            </div>
          </div>
        </div>
        <div v-if="notifications.data.length === 0" class="rounded-lg bg-white p-8 text-center shadow">
          <p class="text-sm text-gray-500">暂无通知</p>
        </div>
      </div>

      <div v-if="notifications.last_page > 1" class="flex items-center justify-between">
        <p class="text-sm text-gray-600">显示第 {{ notifications.from }} 至 {{ notifications.to }} 条，共 {{ notifications.total }} 条</p>
        <div class="flex space-x-1">
          <Link v-for="page in notifications.last_page" :key="page" :href="route('notifications.index', { page })" :class="[page === notifications.current_page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50', 'inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium']">{{ page }}</Link>
        </div>
      </div>
    </div>
  </div>
</template>
