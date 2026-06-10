<template>
  <div class="min-h-screen flex">
    <aside class="w-64 bg-slate-900 text-slate-100 flex flex-col">
      <div class="h-16 flex items-center justify-center border-b border-slate-800">
        <h1 class="text-lg font-bold">🏸 羽毛球馆管理</h1>
      </div>
      <nav class="flex-1 overflow-y-auto py-4">
        <template v-for="(group, gi) in menuGroups" :key="gi">
          <div class="px-4 py-2 text-xs uppercase text-slate-500 font-semibold">{{ group.title }}</div>
          <nuxt-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="flex items-center px-6 py-2.5 text-sm hover:bg-slate-800 transition-colors"
            :class="{ 'bg-slate-800 text-white border-l-2 border-primary-500': isActive(item.path) }"
          >
            <span class="mr-3 text-lg">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
            <span v-if="item.badge && item.badge > 0" class="ml-auto bg-red-500 text-white text-xs px-1.5 rounded-full">{{ item.badge > 99 ? '99+' : item.badge }}</span>
          </nuxt-link>
        </template>
      </nav>
      <div class="border-t border-slate-800 p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center font-bold">
            {{ auth.userName.charAt(0) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">{{ auth.userName }}</div>
            <div class="text-xs text-slate-400 truncate">{{ roleText }}</div>
          </div>
        </div>
      </div>
    </aside>
    <div class="flex-1 flex flex-col">
      <header class="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h2>
        </div>
        <div class="flex items-center gap-4">
          <button class="relative p-2 hover:bg-gray-100 rounded-lg" @click="router.push('/notifications')">
            <span class="text-xl">🔔</span>
            <span v-if="unreadCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </button>
          <button class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg" @click="handleLogout">
            退出登录
          </button>
        </div>
      </header>
      <main class="flex-1 overflow-y-auto p-6 bg-gray-50">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const unreadCount = ref(0)

const roleText = computed(() => {
  const m: Record<string, string> = {
    SUPER_ADMIN: '超级管理员', ADMIN: '管理员', MANAGER: '运营经理',
    COACH: '教练', STAFF: '前台', CUSTOMER: '客户'
  }
  return m[auth.role] || auth.role
})

const menuGroups = computed(() => [
  {
    title: '常用功能',
    items: [
      { path: '/dashboard', name: '运营看板', icon: '📊' },
      { path: '/todos', name: '待办中心', icon: '✅', badge: 0 },
      { path: '/bookings', name: '预约管理', icon: '📅' },
      { path: '/court-board', name: '场地看板', icon: '🎯' },
      { path: '/checkin', name: '签到核销', icon: '✋' }
    ]
  },
  {
    title: '资源管理',
    items: [
      { path: '/courts', name: '场地管理', icon: '🏟️' },
      { path: '/court-prices', name: '价格配置', icon: '💰' },
      { path: '/tournaments', name: '赛事管理', icon: '🏆' },
      { path: '/devices/faults', name: '设备故障', icon: '🔧' }
    ]
  },
  {
    title: '报表与配置',
    items: [
      { path: '/reports/capacity', name: '教练产能', icon: '📈' },
      { path: '/downloads', name: '导出下载', icon: '📥' }
    ]
  },
  ...((auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN' || auth.role === 'MANAGER') ? [{
    title: '系统管理',
    items: [
      { path: '/users', name: '用户管理', icon: '👥' },
      { path: '/notifications', name: '通知中心', icon: '📢' }
    ]
  }] : [])
])

const pageTitle = computed(() => {
  for (const g of menuGroups.value) {
    const found = g.items.find(i => isActive(i.path))
    if (found) return found.name
  }
  return ''
})

function isActive(p: string) {
  if (p === '/dashboard') return route.path === '/' || route.path === '/dashboard'
  return route.path === p || route.path.startsWith(p + '/')
}

function handleLogout() {
  if (confirm('确定退出登录吗？')) {
    auth.logout()
  }
}

onMounted(async () => {
  try {
    const r = await $fetch<any>('/api/notifications', {
      headers: { Authorization: `Bearer ${auth.token}` },
      query: { page: 1, pageSize: 1, unread: 'true' }
    })
    if (r.code === 0) unreadCount.value = r.data.unreadCount || 0
  } catch {}
})
</script>
