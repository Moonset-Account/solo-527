<template>
  <div class="py-12 bg-wood-50 min-h-screen">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="font-display text-3xl font-bold text-inkBlack mb-8">个人中心</h1>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-1">
          <div class="card p-6 sticky top-6">
            <div class="text-center mb-6">
              <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-3xl text-primary-700 font-bold mx-auto mb-3">
                {{ user?.name?.[0] || '学' }}
              </div>
              <h3 class="font-semibold text-inkBlack">{{ user?.name || '学员' }}</h3>
              <p class="text-sm text-warmGray">{{ user?.email }}</p>
            </div>
            <nav class="space-y-1">
              <router-link
                to="/profile/enrollments"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg text-wood-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                :class="{ 'bg-primary-50 text-primary-600': isActive('/profile/enrollments') }"
              >
                <span>📝</span>
                <span>我的报名</span>
              </router-link>
              <router-link
                to="/profile/works"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg text-wood-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                :class="{ 'bg-primary-50 text-primary-600': isActive('/profile/works') }"
              >
                <span>🎨</span>
                <span>我的作品</span>
              </router-link>
              <router-link
                to="/profile/settings"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg text-wood-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                :class="{ 'bg-primary-50 text-primary-600': isActive('/profile/settings') }"
              >
                <span>⚙️</span>
                <span>账户设置</span>
              </router-link>
              <button
                @click="handleLogout"
                class="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <span>🚪</span>
                <span>退出登录</span>
              </button>
            </nav>
          </div>
        </div>

        <div class="lg:col-span-3">
          <router-view />
        </div>
      </div>
    </div>
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

const user = computed(() => authStore.user)

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

const handleLogout = () => {
  authStore.logout()
  ElMessage.success('已退出登录')
  router.push('/')
}
</script>
