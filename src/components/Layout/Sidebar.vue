<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Home, ClipboardList, RefreshCcw, TrendingUp, Calendar,
  BarChart3, Tags, FileText, Settings, ChevronLeft, ChevronRight,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/leads', label: '线索管理', icon: ClipboardList },
  { path: '/followup-plans', label: '回访计划', icon: RefreshCcw },
  { path: '/predictions', label: '转化预测', icon: TrendingUp },
  { path: '/followup-rules', label: '回访规则', icon: Calendar },
  { path: '/churn', label: '流失分析', icon: BarChart3 },
  { path: '/tags', label: '标签管理', icon: Tags },
  { path: '/reports', label: '报表中心', icon: FileText },
  { path: '/settings/dicts', label: '系统设置', icon: Settings },
]

const activeRoute = computed(() => route.path)

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <aside
    class="fixed left-0 top-0 h-screen bg-slate-800 text-slate-300 flex flex-col transition-all duration-300 z-30"
    :class="collapsed ? 'w-16' : 'w-56'"
  >
    <div class="flex items-center h-16 px-4 border-b border-slate-700">
      <div v-if="!collapsed" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded bg-amber-500 flex items-center justify-center">
          <Home class="w-4 h-4 text-white" />
        </div>
        <span class="text-white font-semibold text-sm whitespace-nowrap">装修线索回访</span>
      </div>
      <div v-else class="w-8 h-8 rounded bg-amber-500 flex items-center justify-center mx-auto">
        <Home class="w-4 h-4 text-white" />
      </div>
    </div>

    <nav class="flex-1 py-4 overflow-y-auto">
      <div
        v-for="item in navItems"
        :key="item.path"
        class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md cursor-pointer transition-colors"
        :class="
          activeRoute === item.path || (item.path !== '/' && activeRoute.startsWith(item.path))
            ? 'bg-amber-500/20 text-amber-400'
            : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
        "
        @click="navigateTo(item.path)"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!collapsed" class="text-sm whitespace-nowrap">{{ item.label }}</span>
      </div>
    </nav>

    <div class="p-2 border-t border-slate-700">
      <button
        class="w-full flex items-center justify-center py-2 rounded-md hover:bg-slate-700 transition-colors text-slate-400"
        @click="collapsed = !collapsed"
      >
        <component :is="collapsed ? ChevronRight : ChevronLeft" class="w-4 h-4" />
      </button>
    </div>
  </aside>
</template>
