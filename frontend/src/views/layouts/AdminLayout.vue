<template>
  <div class="min-h-screen bg-gray-100 flex">
    <aside class="w-64 bg-gray-900 text-white flex-shrink-0 hidden md:block">
      <div class="p-4 border-b border-gray-800">
        <router-link to="/admin/dashboard" class="flex items-center space-x-3">
          <span class="text-2xl">🎨</span>
          <span class="font-bold text-lg">管理后台</span>
        </router-link>
      </div>
      <nav class="py-4">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          :class="{ 'bg-gray-800 text-white border-r-2 border-purple-500': isActive(item.path) }"
        >
          <span class="mr-3">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="bg-white shadow-sm h-14 flex items-center justify-between px-6">
        <h1 class="font-semibold text-gray-800">{{ currentPageTitle }}</h1>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-600">{{ authStore.user?.name }}（管理员）</span>
          <button @click="handleLogout" class="text-sm text-gray-500 hover:text-red-500">退出</button>
        </div>
      </header>

      <main class="flex-1 p-6 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const menuItems = [
  { path: '/admin/dashboard', label: '数据概览', icon: '📊' },
  { path: '/admin/bookings', label: '报名管理', icon: '📋' },
  { path: '/admin/courses', label: '课程管理', icon: '📚' },
  { path: '/admin/materials', label: '材料库存', icon: '📦' },
  { path: '/admin/artworks', label: '作品审核', icon: '🖼️' },
  { path: '/admin/settlements', label: '老师结算', icon: '💰' },
  { path: '/admin/payments', label: '支付记录', icon: '💳' },
  { path: '/admin/audit-logs', label: '审计日志', icon: '📜' },
  { path: '/admin/users', label: '用户管理', icon: '👥' }
]

const isActive = (path: string) => route.path.startsWith(path)

const currentPageTitle = computed(() => {
  const item = menuItems.find(m => isActive(m.path))
  return item?.label || '管理后台'
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
