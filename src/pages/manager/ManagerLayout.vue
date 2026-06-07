<script setup lang="ts">
import { RouterLink as Link, useRoute } from 'vue-router'
import {
  LayoutDashboard,
  TrendingDown,
  AlertCircle,
  Clock,
  MapPinCheck,
  Building2,
  ChevronRight
} from 'lucide-vue-next'
import NavBar from '@/components/NavBar.vue'

const route = useRoute()

const menuItems = [
  { name: '工作台', path: '/manager', icon: LayoutDashboard },
  { name: '误投趋势', path: '/manager/misuse', icon: TrendingDown },
  { name: '桶满报警', path: '/manager/full-alert', icon: AlertCircle },
  { name: '清运效率', path: '/manager/efficiency', icon: Clock },
  { name: '巡查覆盖', path: '/manager/inspection', icon: MapPinCheck },
  { name: '社区对比', path: '/manager/community', icon: Building2 }
]

function isActive(path: string) {
  if (path === '/manager') {
    return route.path === '/manager'
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <NavBar />

    <div class="flex-1 flex">
      <aside class="w-56 bg-white border-r border-gray-100 flex-shrink-0 hidden md:block">
        <nav class="p-3 space-y-1">
          <Link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            :class="isActive(item.path) ? 'sidebar-link-active' : 'sidebar-link'"
          >
            <component :is="item.icon" class="w-4 h-4" />
            <span class="flex-1">{{ item.name }}</span>
            <ChevronRight v-if="isActive(item.path)" class="w-4 h-4" />
          </Link>
        </nav>
      </aside>

      <main class="flex-1 overflow-auto">
        <router-view v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>
    </div>
  </div>
</template>
