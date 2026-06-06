<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <h1 class="text-xl font-bold text-green-600">
              🌱 垃圾分类督导整改系统
            </h1>
          </div>
          <nav class="hidden md:flex space-x-4" v-if="user">
            <NuxtLink to="/" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50">
              仪表盘
            </NuxtLink>
            <NuxtLink to="/tasks" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50">
              整改任务
            </NuxtLink>
            <NuxtLink to="/points" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50">
              点位地图
            </NuxtLink>
            <NuxtLink to="/stats" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50">
              统计报表
            </NuxtLink>
            <NuxtLink to="/public" target="_blank" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50">
              公开看板
            </NuxtLink>
          </nav>
          <div class="flex items-center space-x-4" v-if="user">
            <span class="text-sm text-gray-600">{{ user.name }} ({{ roleLabel }})</span>
            <button @click="handleLogout" class="text-sm text-red-600 hover:text-red-800">
              退出
            </button>
          </div>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { UserRole } from '~/types'

const { user, logout } = useAuth()

const roleLabels: Record<string, string> = {
  [UserRole.STREET_ADMIN]: '街道管理员',
  [UserRole.GRID_MEMBER]: '网格员',
  [UserRole.PROPERTY]: '物业'
}

const roleLabel = computed(() => {
  if (!user.value) return ''
  return roleLabels[user.value.role] || user.value.role
})

const handleLogout = async () => {
  await logout()
}
</script>
