<template>
  <div class="flex h-screen bg-wood-50">
    <aside class="w-64 bg-white border-r border-wood-100 flex flex-col">
      <div class="p-6 border-b border-wood-100">
        <router-link to="/admin" class="flex items-center space-x-2">
          <span class="text-2xl">🏺</span>
          <span class="font-display text-xl font-bold text-primary-600">管理后台</span>
        </router-link>
      </div>
      <nav class="flex-1 p-4 space-y-1">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg text-wood-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
          :class="{ 'bg-primary-50 text-primary-600': isActive(item.path) }"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span class="font-medium">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="p-4 border-t border-wood-100">
        <div class="flex items-center space-x-3 px-4 py-3">
          <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
            管
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-inkBlack truncate">管理员</p>
            <p class="text-xs text-warmGray truncate">admin@example.com</p>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="w-full mt-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
        >
          退出登录
        </button>
      </div>
    </aside>

    <main class="flex-1 overflow-auto">
      <div class="p-8">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const menuItems = [
  { path: '/admin', label: '概览', icon: '📊' },
  { path: '/admin/courses', label: '课程管理', icon: '📚' },
  { path: '/admin/enrollments', label: '报名管理', icon: '📝' },
  { path: '/admin/materials', label: '材料管理', icon: '📦' },
  { path: '/admin/works', label: '作品审核', icon: '🎨' },
  { path: '/admin/teachers', label: '老师管理', icon: '👨‍🏫' },
  { path: '/admin/students', label: '学员管理', icon: '👥' },
  { path: '/admin/audits', label: '审计日志', icon: '📋' }
]

const isActive = (path: string) => {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}

const handleLogout = () => {
  authStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>
