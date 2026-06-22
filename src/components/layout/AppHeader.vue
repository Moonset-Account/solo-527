<template>
  <header class="flex h-14 items-center justify-between border-b border-brand/10 bg-white px-6">
    <div class="flex items-center gap-2 text-sm text-bark/60">
      <span
        v-for="(crumb, i) in breadcrumbs"
        :key="i"
        class="flex items-center gap-2"
      >
        <router-link v-if="crumb.to" :to="crumb.to" class="hover:text-brand transition-colors">
          {{ crumb.label }}
        </router-link>
        <span v-else class="text-bark font-medium">{{ crumb.label }}</span>
        <span v-if="i < breadcrumbs.length - 1" class="text-bark/30">/</span>
      </span>
    </div>

    <div class="flex items-center gap-4">
      <div
        :class="[
          'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-all duration-200',
          appStore.sandboxMode
            ? 'bg-accent/10 text-accent'
            : 'bg-green-50 text-green-700',
        ]"
        @click="appStore.toggleSandbox()"
      >
        <span
          :class="[
            'h-2 w-2 rounded-full',
            appStore.sandboxMode ? 'bg-accent' : 'bg-green-500',
          ]"
        />
        {{ appStore.sandboxMode ? '沙箱模式' : '生产模式' }}
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

const nameMap: Record<string, string> = {
  dashboard: '仪表盘',
  batches: '批次管理',
  'batch-detail': '批次详情',
  recipes: '配方管理',
  'recipe-detail': '配方详情',
  ingredients: '原料管理',
  scheduling: '订单排产',
  inventory: '库存管理',
  profit: '毛利分析',
  anomalies: '成本异常',
  'anomaly-detail': '异常详情',
}

const breadcrumbs = computed(() => {
  const crumbs: { label: string; to?: string }[] = [{ label: '首页', to: '/' }]
  if (route.name && route.name !== 'dashboard') {
    const parent = String(route.name).replace('-detail', '')
    if (nameMap[parent] && parent !== route.name) {
      crumbs.push({ label: nameMap[parent], to: `/${parent}` })
    }
    crumbs.push({ label: nameMap[String(route.name)] || String(route.name) })
  }
  return crumbs
})
</script>
