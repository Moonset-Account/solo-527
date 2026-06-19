<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Bell,
  ClipboardList,
  PlusCircle,
  LayoutDashboard,
  BellRing,
  Settings,
  ScrollText,
  LogOut,
  ChevronRight,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const navItems = computed(() => {
  const items = [
    { label: '需求列表', icon: ClipboardList, to: '/requirements' },
    { label: '新建需求', icon: PlusCircle, to: '/requirements/new' },
    { label: '值班看板', icon: LayoutDashboard, to: '/dashboard' },
  ]
  if (authStore.canManageReminders) {
    items.push({ label: '提醒管理', icon: BellRing, to: '/reminders' })
  }
  if (authStore.canManageAdmin) {
    items.push({ label: '后台管理', icon: Settings, to: '/admin' })
  }
  if (authStore.canManageReminders) {
    items.push({ label: '操作日志', icon: ScrollText, to: '/logs' })
  }
  return items
})

const breadcrumbs = computed(() => {
  const map: Record<string, string> = {
    requirements: '需求列表',
    'requirement-new': '新建需求',
    'requirement-detail': '需求详情',
    reminders: '提醒管理',
    dashboard: '值班看板',
    admin: '后台管理',
    logs: '操作日志',
  }
  return map[route.name as string] ?? ''
})

const userInitials = computed(() => {
  const name = authStore.user?.name ?? ''
  return name.slice(0, 2).toUpperCase()
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <aside class="fixed left-0 top-0 bottom-0 w-60 bg-slate-800 text-white flex flex-col z-30">
      <div class="h-14 flex items-center gap-2.5 px-5 border-b border-slate-700">
        <Bell class="w-6 h-6 text-amber-500" />
        <span class="text-lg font-semibold tracking-wide">提醒中心</span>
      </div>

      <nav class="flex-1 py-3 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-200 border-l-[3px] border-transparent"
          :class="
            route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to + '/'))
              ? 'bg-slate-700 text-white border-amber-500'
              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white border-transparent'
          "
        >
          <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="border-t border-slate-700 p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {{ userInitials }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium truncate">{{ authStore.user?.name }}</p>
            <p class="text-xs text-slate-400 truncate">{{ authStore.user?.email }}</p>
          </div>
        </div>
        <button
          class="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full cursor-pointer"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <div class="pl-60 min-h-screen flex flex-col">
      <header class="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
        <div class="flex items-center gap-1.5 text-sm text-slate-500">
          <span class="text-slate-400">首页</span>
          <ChevronRight v-if="breadcrumbs" class="w-4 h-4 text-slate-300" />
          <span v-if="breadcrumbs" class="text-slate-700 font-medium">{{ breadcrumbs }}</span>
        </div>
        <div class="flex items-center gap-4">
          <button class="relative text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <Bell class="w-5 h-5" />
            <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div class="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-white">
            {{ userInitials }}
          </div>
        </div>
      </header>

      <main class="flex-1 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
