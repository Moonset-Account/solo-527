<script setup lang="ts">
import { LayoutDashboard, MessageSquareText, ListTodo, Filter, BarChart3, Settings, LogOut, AlertTriangle } from 'lucide-vue-next'

const { user, isLoggedIn, clearAuth, initAuth } = useAuthState()
const route = useRoute()
const router = useRouter()

onMounted(() => {
  initAuth()
})

const navItems = computed(() => [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/generator', label: '会话生成器', icon: MessageSquareText },
  { path: '/tasks', label: '批处理任务', icon: ListTodo },
  { path: '/results', label: '结果与筛选', icon: Filter },
  { path: '/statistics', label: '统计分析', icon: BarChart3 },
])

const handleLogout = () => {
  clearAuth()
  router.push('/login')
}
</script>

<template>
  <div v-if="isLoggedIn" class="flex h-screen overflow-hidden">
    <aside class="w-60 bg-[#0F172A] text-white flex flex-col flex-shrink-0">
      <div class="px-5 py-4 border-b border-slate-700">
        <h1 class="text-lg font-bold text-brand-400">会话批量生成器</h1>
        <p class="text-xs text-slate-400 mt-1">客服主管工作台</p>
      </div>
      <nav class="flex-1 py-3 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-5 py-2.5 text-sm transition-colors duration-150"
          :class="route.path === item.path ? 'bg-[#1E293B] text-brand-400 border-r-2 border-brand-400' : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'"
        >
          <component :is="item.icon" class="w-4 h-4" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
      <div class="px-5 py-4 border-t border-slate-700">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white">
            {{ user?.displayName?.charAt(0) || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ user?.displayName }}</p>
            <p class="text-xs text-slate-400">{{ user?.role === 'admin' ? '管理员' : user?.role === 'supervisor' ? '客服主管' : '客服专员' }}</p>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut class="w-3.5 h-3.5" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
    <main class="flex-1 overflow-y-auto bg-slate-50">
      <slot />
    </main>
  </div>
  <div v-else>
    <slot />
  </div>
</template>
