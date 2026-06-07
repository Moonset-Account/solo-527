<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  BarChart3,
  Users,
  AlertTriangle,
  Settings,
  FileText,
  Building2
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const menuItems = [
  { path: '/dashboard', name: '综合能耗看板', icon: LayoutDashboard },
  { path: '/peak-valley', name: '峰谷对比分析', icon: BarChart3 },
  { path: '/allocation', name: '租户分摊管理', icon: Users },
  { path: '/alerts', name: '异常告警中心', icon: AlertTriangle },
  { path: '/reports', name: '报告导出', icon: FileText },
  { path: '/config', name: '系统配置', icon: Settings }
]

const isActive = (path: string) => computed(() => route.path === path)

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <aside class="w-64 bg-bg-secondary border-r border-slate-700/50 flex flex-col h-screen sticky top-0">
    <div class="p-6 border-b border-slate-700/50">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
          <Building2 class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="font-display font-bold text-lg text-white">能源分析平台</h1>
          <p class="text-xs text-slate-400">Energy Management</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 p-4 overflow-y-auto">
      <ul class="space-y-1">
        <li v-for="item in menuItems" :key="item.path">
          <button
            @click="navigateTo(item.path)"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
            :class="isActive(item.path)
              ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-bg-tertiary/50'"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span class="font-medium">{{ item.name }}</span>
          </button>
        </li>
      </ul>
    </nav>

    <div class="p-4 border-t border-slate-700/50">
      <div class="bg-bg-tertiary/50 rounded-lg p-4">
        <p class="text-xs text-slate-400 mb-2">数据更新时间</p>
        <p class="font-mono text-sm text-slate-200">{{ new Date().toLocaleString('zh-CN') }}</p>
      </div>
    </div>
  </aside>
</template>
