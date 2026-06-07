<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Users,
  Percent,
  Pill,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import type { PermissionConfig } from '@/types'

const router = useRouter()
const route = useRoute()
const uiStore = useUiStore()
const authStore = useAuthStore()

interface MenuItem {
  path: string
  name: string
  icon: any
  permission?: keyof PermissionConfig
}

const menuItems = computed<MenuItem[]>(() => [
  { path: '/dashboard', name: '仪表盘', icon: LayoutDashboard },
  { path: '/member/repurchase', name: '会员复购分析', icon: Users },
  { path: '/activity/analysis', name: '活动效果分析', icon: Percent, permission: 'canViewAllStores' },
  { path: '/medicine/category', name: '药品分类管理', icon: Pill, permission: 'canManageCategory' },
  { path: '/system/settings', name: '系统设置', icon: Settings, permission: 'canManageCategory' }
])

const filteredMenuItems = computed(() => {
  return menuItems.value.filter(item => {
    if (!item.permission) return true
    return authStore.permissions[item.permission]
  })
})

function isActive(path: string) {
  return route.path.startsWith(path)
}

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <aside
    class="flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300"
    :class="uiStore.sidebarCollapsed ? 'w-16' : 'w-60'"
  >
    <div class="flex items-center justify-between h-16 px-4 border-b border-gray-100">
      <div v-if="!uiStore.sidebarCollapsed" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Pill class="w-5 h-5 text-white" />
        </div>
        <span class="font-bold text-gray-800">药店分析</span>
      </div>
      <div v-else class="w-full flex justify-center">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Pill class="w-5 h-5 text-white" />
        </div>
      </div>
    </div>

    <nav class="flex-1 py-4 px-2 space-y-1">
      <button
        v-for="item in filteredMenuItems"
        :key="item.path"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
        :class="isActive(item.path)
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
        @click="navigate(item.path)"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!uiStore.sidebarCollapsed">{{ item.name }}</span>
      </button>
    </nav>

    <div class="p-2 border-t border-gray-100">
      <button
        class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg"
        @click="uiStore.toggleSidebar()"
      >
        <ChevronLeft v-if="!uiStore.sidebarCollapsed" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
        <span v-if="!uiStore.sidebarCollapsed">收起菜单</span>
      </button>
    </div>
  </aside>
</template>
