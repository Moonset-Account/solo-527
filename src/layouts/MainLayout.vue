<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Home,
  ListTodo,
  BarChart3,
  Settings,
  Users,
  LogOut,
  ChevronRight,
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'

export type UserRole = 'pm' | 'admin'

export interface CurrentUser {
  id: string
  name: string
  role: UserRole
}

const route = useRoute()
const router = useRouter()

const currentUser = ref<CurrentUser | null>(null)

const userInfo = computed(() => {
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      currentUser.value = JSON.parse(stored)
      return currentUser.value
    } catch {
      return null
    }
  }
  return null
})

const isAdmin = computed(() => userInfo.value?.role === 'admin')

const menuItems = computed(() => {
  const items = [
    { path: '/', label: '首页', icon: Home, roles: ['pm', 'admin'] as UserRole[] },
    { path: '/items', label: '事项管理', icon: ListTodo, roles: ['pm', 'admin'] as UserRole[] },
  ]
  
  if (isAdmin.value) {
    items.push(
      { path: '/operations', label: '运营后台', icon: BarChart3, roles: ['admin'] as UserRole[] },
      { path: '/settings', label: '配置页', icon: Settings, roles: ['admin'] as UserRole[] },
      { path: '/users', label: '用户管理', icon: Users, roles: ['admin'] as UserRole[] },
    )
  }
  
  return items
})

const breadcrumbItems = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title)
  return matched.map(item => ({
    title: item.meta?.title as string,
    path: item.path,
  }))
})

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="flex h-screen bg-surface">
    <aside class="w-[240px] bg-primary flex-shrink-0 flex flex-col shadow-lg">
      <div class="h-16 flex items-center px-6 border-b border-white/10">
        <span class="text-white font-bold text-lg">事项管理系统</span>
      </div>
      
      <nav class="flex-1 py-4 overflow-y-auto">
        <ul class="space-y-1 px-3">
          <li v-for="item in menuItems" :key="item.path">
            <button
              @click="navigateTo(item.path)"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
              :class="[
                isActive(item.path)
                  ? 'bg-accent text-primary font-medium'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              ]"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <span>{{ item.label }}</span>
            </button>
          </li>
        </ul>
      </nav>
      
      <div class="p-4 border-t border-white/10">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          <LogOut class="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
    
    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
        <div class="flex items-center gap-2 text-sm">
          <template v-for="(item, index) in breadcrumbItems" :key="item.path">
            <span
              v-if="index === breadcrumbItems.length - 1"
              class="text-gray-900 font-medium"
            >
              {{ item.title }}
            </span>
            <router-link
              v-else
              :to="item.path"
              class="text-gray-500 hover:text-primary transition-colors"
            >
              {{ item.title }}
            </router-link>
            <ChevronRight
              v-if="index < breadcrumbItems.length - 1"
              class="w-4 h-4 text-gray-400"
            />
          </template>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span class="text-white text-sm font-medium">
                {{ userInfo?.name?.charAt(0) || 'U' }}
              </span>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900">{{ userInfo?.name || '用户' }}</div>
              <div class="text-xs text-gray-500">
                {{ userInfo?.role === 'admin' ? '管理员' : '项目经理' }}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main class="flex-1 overflow-y-auto p-6">
        <div class="max-w-7xl mx-auto">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>
