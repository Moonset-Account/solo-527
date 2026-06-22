<template>
  <aside
    :class="[
      'flex flex-col bg-brand text-white transition-all duration-300 ease-in-out',
      collapsed ? 'w-16' : 'w-56',
    ]"
  >
    <div class="flex h-14 items-center justify-center border-b border-white/10">
      <span v-if="!collapsed" class="font-serif text-lg font-bold tracking-wide">订单履约台</span>
      <span v-else class="font-serif text-lg font-bold">履</span>
    </div>

    <nav class="mt-2 flex-1 space-y-1 px-2">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm transition-all duration-200',
          isActive(item.path)
            ? 'bg-white/20 font-medium shadow-sm'
            : 'hover:bg-white/10',
        ]"
      >
        <component :is="item.icon" :size="20" />
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
      </router-link>
    </nav>

    <button
      class="mx-2 mb-4 flex items-center justify-center rounded-btn p-2 transition-colors hover:bg-white/10"
      @click="appStore.toggleSidebar()"
    >
      <ChevronLeft :size="18" :class="['transition-transform duration-300', collapsed && 'rotate-180']" />
    </button>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Package,
  BookOpen,
  Beaker,
  Calendar,
  Warehouse,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

const collapsed = computed(() => appStore.sidebarCollapsed)

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/batches', label: '批次管理', icon: Package },
  { path: '/recipes', label: '配方管理', icon: BookOpen },
  { path: '/ingredients', label: '原料管理', icon: Beaker },
  { path: '/scheduling', label: '订单排产', icon: Calendar },
  { path: '/inventory', label: '库存管理', icon: Warehouse },
  { path: '/profit', label: '毛利分析', icon: TrendingUp },
  { path: '/anomalies', label: '成本异常', icon: AlertTriangle },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
