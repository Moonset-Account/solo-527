<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
    <div class="flex items-center gap-2 text-sm text-slate-500">
      <span class="text-slate-400">施工验收台</span>
      <ChevronRight class="w-4 h-4" />
      <span class="text-slate-700 font-medium">{{ currentPageTitle }}</span>
    </div>

    <div class="flex items-center gap-4">
      <button
        class="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        @click="toggleNotifications"
      >
        <Bell class="w-5 h-5 text-slate-600" />
        <span
          v-if="notificationStore.unreadCount > 0"
          class="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full animate-pulse-soft"
        />
      </button>

      <div class="flex items-center gap-3 pl-4 border-l border-slate-200">
        <div class="text-right">
          <p class="text-sm font-medium text-slate-700">{{ authStore.user?.name }}</p>
          <p class="text-xs text-slate-500">{{ roleLabel }}</p>
        </div>
        <div class="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium text-sm">
          {{ authStore.user?.name?.charAt(0) || '用' }}
        </div>
        <button
          class="p-1 hover:bg-slate-100 rounded transition-colors"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </div>

    <Transition name="slide-right">
      <div
        v-if="showNotifications"
        class="fixed right-4 top-16 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 animate-slide-right"
      >
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800">通知中心</h3>
          <button
            class="text-xs text-primary-600 hover:text-primary-700"
            @click="markAllRead"
          >
            全部已读
          </button>
        </div>
        <div class="max-h-96 overflow-y-auto">
          <div
            v-for="item in notificationStore.items"
            :key="item.id"
            class="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
            :class="{ 'bg-primary-50/30': !item.read }"
            @click="handleNotificationClick(item)"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                :class="notificationTypeClass(item.type)"
              >
                <component :is="notificationIcon(item.type)" class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-800 truncate">{{ item.title }}</p>
                <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">{{ item.content }}</p>
                <p class="text-xs text-slate-400 mt-1">{{ formatTime(item.createdAt) }}</p>
              </div>
            </div>
          </div>
          <div v-if="notificationStore.items.length === 0" class="p-8 text-center text-slate-400 text-sm">
            暂无通知
          </div>
        </div>
      </div>
    </Transition>

    <div
      v-if="showNotifications"
      class="fixed inset-0 z-40"
      @click="showNotifications = false"
    />
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ChevronRight,
  Bell,
  LogOut,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-vue-next'
import type { Notification, NotificationType } from '~/types'

const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const showNotifications = ref(false)

const pageTitles: Record<string, string> = {
  '/dashboard': '项目总览',
  '/projects': '项目管理',
  '/inspections': '巡检任务',
  '/budget': '预算管理',
  '/batch': '批量操作',
  '/reports': '报表中心',
  '/login': '登录',
}

const currentPageTitle = computed(() => {
  for (const [path, title] of Object.entries(pageTitles)) {
    if (route.path.startsWith(path)) {
      return title
    }
  }
  return '施工验收台'
})

const roleLabel = computed(() => {
  const roles: Record<string, string> = {
    owner: '业主',
    manager: '项目经理',
    inspector: '巡检人员',
    customer_service: '客服',
  }
  return roles[authStore.user?.role || ''] || ''
})

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    notificationStore.fetchNotifications()
  }
}

const notificationIcon = (type: NotificationType) => {
  const icons: Record<NotificationType, any> = {
    budget_change: DollarSign,
    delay_warning: AlertTriangle,
    rectification_due: Clock,
    inspection_assigned: CheckCircle,
  }
  return icons[type] || Bell
}

const notificationTypeClass = (type: NotificationType) => {
  const classes: Record<NotificationType, string> = {
    budget_change: 'bg-warning-100 text-warning-700',
    delay_warning: 'bg-danger-100 text-danger-700',
    rectification_due: 'bg-primary-100 text-primary-700',
    inspection_assigned: 'bg-success-100 text-success-700',
  }
  return classes[type] || 'bg-slate-100 text-slate-700'
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString()
}

const handleNotificationClick = async (item: Notification) => {
  if (!item.read) {
    await notificationStore.markAsRead(item.id)
  }
  showNotifications.value = false
}

const markAllRead = async () => {
  await notificationStore.markAllAsRead()
}

const handleLogout = async () => {
  await authStore.logout()
}
</script>
