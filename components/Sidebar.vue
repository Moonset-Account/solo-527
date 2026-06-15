<template>
  <aside class="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
    <div class="h-16 flex items-center px-6 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <BarChart3 class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-base font-bold text-slate-800">数据门户</h1>
          <p class="text-xs text-slate-500">销售经营平台</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
      <div v-for="group in menuGroups" :key="group.title" class="mb-4">
        <p class="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {{ group.title }}
        </p>
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="sidebar-link group"
          :class="{ 'sidebar-link-active': isActive(item.path) }"
        >
          <component :is="item.icon" class="w-5 h-5 transition-colors" :class="isActive(item.path) ? 'text-primary-500' : 'text-slate-400 group-hover:text-primary-400'" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="ml-auto text-xs px-2 py-0.5 rounded-full bg-danger-100 text-danger-600 font-medium">
            {{ item.badge }}
          </span>
        </router-link>
      </div>
    </nav>

    <div class="p-4 border-t border-slate-100">
      <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-semibold text-sm">
          {{ userInitial }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-800 truncate">{{ currentUser?.name || '用户' }}</p>
          <p class="text-xs text-slate-500 truncate">{{ currentUser?.roleName || '' }}</p>
        </div>
        <button class="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors" @click="handleLogout">
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import {
  LayoutDashboard, Shield, Database, Bell, BarChart3, Settings, LogOut, FileBarChart
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const currentUser = ref<{ name?: string; roleName?: string } | null>(null)

const userInitial = computed(() => {
  return currentUser.value?.name?.charAt(0) || 'U'
})

const menuGroups = [
  {
    title: '经营分析',
    items: [
      { path: '/', label: '总监首页', icon: LayoutDashboard, badge: '' },
      { path: '/alerts', label: '告警中心', icon: Bell, badge: '12' },
      { path: '/reports', label: '复盘报表', icon: FileBarChart, badge: '' }
    ]
  },
  {
    title: '数据管理',
    items: [
      { path: '/permissions', label: '权限管理', icon: Shield, badge: '' },
      { path: '/datasets', label: '数据集', icon: Database, badge: '' }
    ]
  },
  {
    title: '系统',
    items: [
      { path: '/settings', label: '系统设置', icon: Settings, badge: '' }
    ]
  }
]

const isActive = (path: string): boolean => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const fetchUser = async () => {
  try {
    const data = await $fetch('/api/auth')
    currentUser.value = data as any
  } catch {
    // 用户未登录
  }
}

const handleLogout = async () => {
  try {
    await $fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  } catch (e) {
    console.error('Logout error:', e)
  }
}

onMounted(() => {
  fetchUser()
})
</script>
