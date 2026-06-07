<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  BarChart3,
  AlertTriangle,
  Table,
  BookOpen,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const menuItems = [
  { path: '/', name: '总览仪表盘', icon: LayoutDashboard },
  { path: '/comparison', name: '多维对比分析', icon: BarChart3 },
  { path: '/anomaly', name: '异常矩阵', icon: AlertTriangle },
  { path: '/details', name: '明细下钻', icon: Table },
  { path: '/specs', name: '口径说明', icon: BookOpen },
]

const isActive = (path: string) => computed(() => route.path === path)

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <aside class="w-64 h-full bg-survey-surface border-r border-survey-border flex flex-col">
    <div class="p-6 border-b border-survey-border">
      <h1 class="font-mono text-xl font-bold text-survey-primary">
        Survey QA
      </h1>
      <p class="text-sm text-survey-text-muted mt-1">样本质量监控平台</p>
    </div>

    <nav class="flex-1 p-4 space-y-1">
      <button
        v-for="item in menuItems"
        :key="item.path"
        @click="navigateTo(item.path)"
        class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group"
        :class="[
          isActive(item.path).value
            ? 'bg-survey-primary/10 text-survey-primary border-l-2 border-survey-primary'
            : 'text-survey-text-secondary hover:bg-survey-surface-hover hover:text-survey-text-primary'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span class="text-sm font-medium">{{ item.name }}</span>
      </button>
    </nav>

    <div class="p-4 border-t border-survey-border">
      <div class="flex items-center gap-3 px-2">
        <div class="w-8 h-8 rounded-full bg-survey-secondary/20 flex items-center justify-center">
          <span class="text-survey-secondary text-sm font-medium">管</span>
        </div>
        <div>
          <p class="text-sm text-survey-text-primary font-medium">管理员</p>
          <p class="text-xs text-survey-text-muted">调研项目部</p>
        </div>
      </div>
    </div>
  </aside>
</template>
