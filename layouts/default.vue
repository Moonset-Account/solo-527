<template>
  <div class="flex h-screen overflow-hidden">
    <aside class="w-64 bg-primary-900 text-white flex flex-col shrink-0">
      <div class="h-16 flex items-center gap-3 px-6 border-b border-white/10">
        <Droplets class="w-7 h-7 text-primary-400" />
        <span class="text-lg font-bold tracking-wide">洗车看板</span>
      </div>

      <nav class="flex-1 py-4 space-y-1 px-3">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
            isActive(item.to)
              ? 'bg-primary-500 text-white'
              : 'text-gray-300 hover:bg-white/10 hover:text-white'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="p-4 border-t border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-primary-700 flex items-center justify-center text-sm font-semibold">
            店
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">店长</p>
            <span class="badge bg-primary-500/30 text-primary-200 text-xs">管理员</span>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 overflow-y-auto bg-gray-50">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  ClipboardList,
  BarChart3,
  Droplets,
} from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  { to: '/', label: '经营看板', icon: LayoutDashboard },
  { to: '/appointments', label: '预约管理', icon: CalendarCheck },
  { to: '/payments', label: '支付管理', icon: CreditCard },
  { to: '/tasks', label: '待办处理', icon: ClipboardList },
  { to: '/statistics', label: '运营统计', icon: BarChart3 },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>
