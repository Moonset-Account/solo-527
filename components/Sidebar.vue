<template>
  <aside class="w-64 bg-white border-r border-slate-200 flex flex-col">
    <div class="h-16 flex items-center px-5 border-b border-slate-100">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <ClipboardCheck class="w-5 h-5 text-white" />
        </div>
        <span class="font-bold text-lg text-slate-800">施工验收台</span>
      </div>
    </div>

    <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-link"
        :class="isActive(item.path) ? 'sidebar-link-active' : 'sidebar-link-inactive'"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span>{{ item.label }}</span>
        <span
          v-if="item.badge && item.badge > 0"
          class="ml-auto bg-danger-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
        >
          {{ item.badge > 99 ? '99+' : item.badge }}
        </span>
      </NuxtLink>
    </nav>

    <div class="p-3 border-t border-slate-100">
      <div class="bg-slate-50 rounded-lg p-3">
        <p class="text-xs text-slate-500 mb-2">快捷统计</p>
        <div class="flex justify-between text-sm">
          <span class="text-slate-600">待处理</span>
          <span class="font-semibold text-danger-600">{{ notificationStore.unreadCount }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardCheck,
  DollarSign,
  Layers,
  BarChart3,
  Bell,
} from 'lucide-vue-next'

const route = useRoute()
const notificationStore = useNotificationStore()

const menuItems = computed(() => [
  { path: '/dashboard', label: '项目总览', icon: LayoutDashboard, badge: 0 },
  { path: '/projects', label: '项目管理', icon: FolderKanban, badge: 0 },
  { path: '/inspections', label: '巡检任务', icon: ClipboardCheck, badge: 0 },
  { path: '/budget', label: '预算管理', icon: DollarSign, badge: 0 },
  { path: '/batch', label: '批量操作', icon: Layers, badge: 0 },
  { path: '/reports', label: '报表中心', icon: BarChart3, badge: 0 },
])

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

onMounted(() => {
  notificationStore.fetchUnreadCount()
})
</script>
