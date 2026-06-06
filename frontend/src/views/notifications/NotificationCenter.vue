<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="container py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">消息通知</h1>
            <p class="text-gray-500 mt-1">共 {{ notifications.length }} 条，{{ unreadCount }} 条未读</p>
          </div>
          <div class="flex gap-2">
            <button @click="markAllRead" class="btn btn-secondary" :disabled="unreadCount === 0">
              全部标为已读
            </button>
            <button @click="handleExport" class="btn btn-primary">
              📥 导出通知
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="container py-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="md:col-span-3">
          <div v-if="loading" class="text-center py-16">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-gray-400">加载通知中...</p>
          </div>

          <div v-else-if="notifications.length === 0" class="text-center py-16 card">
            <div class="text-6xl mb-4">🔔</div>
            <p class="text-gray-500">暂无通知消息</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              :class="['card cursor-pointer transition-all hover:shadow-md', notification.read ? 'bg-white' : 'bg-purple-50 border-purple-200']"
              @click="openNotification(notification)"
            >
              <div class="p-4">
                <div class="flex items-start gap-4">
                  <div :class="['w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0', getTypeIconBg(notification.notification_type)]">
                    {{ getTypeIcon(notification.notification_type) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h3 :class="['font-bold', notification.read ? 'text-gray-700' : 'text-gray-800']">
                        {{ notification.title }}
                      </h3>
                      <span v-if="!notification.read" class="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full"></span>
                    </div>
                    <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ notification.content }}</p>
                    <div class="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{{ formatDate(notification.created_at) }}</span>
                      <span>{{ getTypeLabel(notification.notification_type) }}</span>
                    </div>
                  </div>
                  <button
                    v-if="!notification.read"
                    @click.stop="markRead(notification)"
                    class="text-xs text-purple-600 hover:text-purple-700 px-2 py-1 rounded hover:bg-purple-100"
                  >
                    标为已读
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="pagination && pagination.total_pages > 1" class="mt-6 flex items-center justify-center gap-2">
            <button @click="loadNotifications(currentPage - 1)" :disabled="currentPage <= 1" class="btn btn-secondary text-sm" :class="{ 'opacity-50': currentPage <= 1 }">
              上一页
            </button>
            <span class="px-4 py-2 text-sm text-gray-500">{{ currentPage }} / {{ pagination.total_pages }}</span>
            <button @click="loadNotifications(currentPage + 1)" :disabled="currentPage >= pagination.total_pages" class="btn btn-secondary text-sm" :class="{ 'opacity-50': currentPage >= pagination.total_pages }">
              下一页
            </button>
          </div>
        </div>

        <div class="md:col-span-1">
          <div class="card sticky top-24">
            <div class="card-header font-bold">通知分类</div>
            <div class="card-body space-y-2">
              <button
                v-for="t in typeFilters"
                :key="t.value"
                @click="currentType = t.value"
                :class="['w-full text-left px-3 py-2 rounded-lg text-sm transition-all', currentType === t.value ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-gray-50 text-gray-600']"
              >
                <span class="mr-2">{{ t.icon }}</span>
                {{ t.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="selectedNotification" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="selectedNotification = null">
      <div class="bg-white rounded-2xl w-full max-w-lg">
        <div class="p-6">
          <div class="flex items-start gap-4 mb-4">
            <div :class="['w-14 h-14 rounded-full flex items-center justify-center text-3xl', getTypeIconBg(selectedNotification.notification_type)]">
              {{ getTypeIcon(selectedNotification.notification_type) }}
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-bold text-gray-800">{{ selectedNotification.title }}</h2>
              <p class="text-sm text-gray-500 mt-1">{{ formatDate(selectedNotification.created_at) }}</p>
            </div>
            <button @click="selectedNotification = null" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div class="bg-gray-50 rounded-xl p-4 text-gray-600 leading-relaxed">
            {{ selectedNotification.content }}
          </div>
          <div class="mt-6 flex gap-3">
            <button @click="selectedNotification = null" class="btn btn-secondary flex-1">
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { notificationAPI } from '../utils/api'
import type { Notification } from '../types'

const notifications = ref<Notification[]>([])
const loading = ref(true)
const currentPage = ref(1)
const currentType = ref<string | null>(null)
const pagination = ref<{ total_pages: number; total_count: number; unread_count?: number } | null>(null)
const selectedNotification = ref<Notification | null>(null)

const unreadCount = computed(() => notifications.value.filter((n: Notification) => !n.read).length)

const typeFilters = [
  { label: '全部', value: null, icon: '📬' },
  { label: '课程通知', value: 'course', icon: '📚' },
  { label: '报名通知', value: 'booking', icon: '📝' },
  { label: '作品通知', value: 'artwork', icon: '🎨' },
  { label: '结算通知', value: 'settlement', icon: '💰' },
  { label: '系统通知', value: 'system', icon: '🔔' }
]

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    course: '📚',
    booking: '📝',
    artwork: '🎨',
    settlement: '💰',
    system: '🔔',
    payment: '💳'
  }
  return icons[type] || '🔔'
}

const getTypeIconBg = (type: string) => {
  const bgs: Record<string, string> = {
    course: 'bg-blue-100',
    booking: 'bg-green-100',
    artwork: 'bg-purple-100',
    settlement: 'bg-amber-100',
    system: 'bg-gray-100',
    payment: 'bg-red-100'
  }
  return bgs[type] || 'bg-gray-100'
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    course: '课程通知',
    booking: '报名通知',
    artwork: '作品通知',
    settlement: '结算通知',
    system: '系统通知',
    payment: '支付通知'
  }
  return labels[type] || '通知'
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  return date.toLocaleDateString('zh-CN')
}

const loadNotifications = async (page = 1) => {
  currentPage.value = page
  loading.value = true
  try {
    const params: any = { page, per_page: 20 }
    if (currentType.value) params.type = currentType.value
    const res: any = await notificationAPI.list(params)
    notifications.value = res.notifications || []
    pagination.value = res.meta
  } catch (e) {
    console.error('加载通知失败', e)
  } finally {
    loading.value = false
  }
}

const openNotification = (notification: Notification) => {
  selectedNotification.value = notification
  if (!notification.read) {
    notificationAPI.markRead(notification.id)
    notification.read = true
  }
}

const markRead = async (notification: Notification) => {
  try {
    await notificationAPI.markRead(notification.id)
    notification.read = true
  } catch (e) {
    console.error('标记已读失败', e)
  }
}

const markAllRead = async () => {
  try {
    await notificationAPI.markAllRead()
    notifications.value.forEach((n: Notification) => n.read = true)
  } catch (e) {
    console.error('全部标为已读失败', e)
  }
}

const handleExport = async () => {
  try {
    const blob = await notificationAPI.export()
    const url = URL.createObjectURL(blob as any)
    const a = document.createElement('a')
    a.href = url
    a.download = `通知记录_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('导出失败', e)
    alert('导出失败')
  }
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
