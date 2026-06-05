<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="container py-3 flex items-center justify-between">
        <router-link to="/" class="flex items-center space-x-2">
          <span class="text-xl">🎨</span>
          <span class="font-bold text-gray-800">个人中心</span>
        </router-link>
        <div class="flex items-center space-x-4">
          <router-link to="/my/notifications" class="relative text-gray-500 hover:text-purple-600">
            <span class="text-xl">🔔</span>
            <span v-if="unreadCount > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {{ unreadCount }}
            </span>
          </router-link>
          <span class="text-sm text-gray-600">{{ authStore.user?.name }}</span>
          <button @click="handleLogout" class="text-sm text-gray-500 hover:text-red-500">退出</button>
        </div>
      </div>
    </header>

    <div class="container py-6">
      <div class="flex flex-col md:flex-row gap-6">
        <aside class="md:w-56 flex-shrink-0">
          <div class="card">
            <nav class="py-2">
              <router-link
                v-for="item in menuItems"
                :key="item.path"
                :to="item.path"
                class="flex items-center px-4 py-3 text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                :class="{ 'bg-purple-50 text-purple-600 border-r-2 border-purple-600': isActive(item.path) }"
              >
                <span class="mr-3">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
              </router-link>
            </nav>
          </div>
        </aside>

        <main class="flex-1 min-w-0">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { notificationAPI } from '../../utils/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const unreadCount = ref(0)

const menuItems = [
  { path: '/my/bookings', label: '我的报名', icon: '📅' },
  { path: '/my/artworks', label: '我的作品', icon: '🖼️' },
  { path: '/my/artworks/upload', label: '上传作品', icon: '📤' },
  { path: '/my/profile', label: '个人信息', icon: '👤' },
  { path: '/my/notifications', label: '消息通知', icon: '🔔' }
]

const isActive = (path: string) => route.path.startsWith(path)

const loadUnreadCount = async () => {
  try {
    const res = await notificationAPI.unreadCount()
    unreadCount.value = res.count
  } catch (e) {
    console.error(e)
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  loadUnreadCount()
})
</script>
