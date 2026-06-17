<template>
  <n-layout has-sider style="min-height: 100vh">
    <n-layout-sider
      :width="240"
      :collapsed-width="64"
      show-trigger
      collapse-mode="width"
      :collapsed="collapsed"
      @update-collapsed="collapsed = $event"
      style="border-right: 1px solid #f0f0f0"
    >
      <div class="logo">
        <n-icon size="28" style="color: #18a058">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </n-icon>
        <span v-if="!collapsed" class="logo-text">农事溯源台</span>
      </div>
      <n-menu
        :value="activeMenu"
        :options="menuOptions"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        @update:value="handleMenuClick"
      />
    </n-layout-sider>

    <n-layout>
      <n-layout-header style="height: 64px; border-bottom: 1px solid #f0f0f0; padding: 0 24px">
        <div class="header-content">
          <n-breadcrumb>
            <n-breadcrumb-item v-for="item in breadcrumbs" :key="item.label">
              {{ item.label }}
            </n-breadcrumb-item>
          </n-breadcrumb>
          <div class="header-right">
            <n-tag type="info" size="small">农技员: 张工</n-tag>
          </div>
        </div>
      </n-layout-header>

      <n-layout-content style="padding: 24px; background: #f5f7fa">
        <slot />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { h } from 'vue'
import { NIcon } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)

const activeMenu = ref(route.path)

const menuOptions = [
  {
    label: '工作台',
    key: '/',
    icon: () => h('span', {}, '🏠'),
  },
  {
    label: '环境监控',
    key: '/environment',
    icon: () => h('span', {}, '🌡️'),
    children: [
      { label: '环境数据', key: '/environment/data' },
      { label: '异常提醒', key: '/environment/alerts' },
    ],
  },
  {
    label: '生产管理',
    key: '/production',
    icon: () => h('span', {}, '🌱'),
    children: [
      { label: '地块管理', key: '/production/plots' },
      { label: '品种管理', key: '/production/varieties' },
      { label: '批次管理', key: '/production/batches' },
    ],
  },
  {
    label: '业务查询',
    key: '/query',
    icon: () => h('span', {}, '📋'),
    children: [
      { label: '分拣订单', key: '/query/sorting-orders' },
      { label: '农机预约', key: '/query/machine-reservations' },
      { label: '农事记录', key: '/query/farm-records' },
    ],
  },
  {
    label: '统计分析',
    key: '/stats',
    icon: () => h('span', {}, '📊'),
    children: [
      { label: '产量统计', key: '/stats/yield' },
    ],
  },
  {
    label: '待办事项',
    key: '/todos',
    icon: () => h('span', {}, '✅'),
  },
]

const breadcrumbMap: Record<string, Array<{ label: string }>> = {
  '/': [{ label: '工作台' }],
  '/environment/data': [{ label: '环境监控' }, { label: '环境数据' }],
  '/environment/alerts': [{ label: '环境监控' }, { label: '异常提醒' }],
  '/production/plots': [{ label: '生产管理' }, { label: '地块管理' }],
  '/production/varieties': [{ label: '生产管理' }, { label: '品种管理' }],
  '/production/batches': [{ label: '生产管理' }, { label: '批次管理' }],
  '/query/sorting-orders': [{ label: '业务查询' }, { label: '分拣订单' }],
  '/query/machine-reservations': [{ label: '业务查询' }, { label: '农机预约' }],
  '/query/farm-records': [{ label: '业务查询' }, { label: '农事记录' }],
  '/stats/yield': [{ label: '统计分析' }, { label: '产量统计' }],
  '/todos': [{ label: '待办事项' }],
}

const breadcrumbs = computed(() => {
  return breadcrumbMap[route.path] || [{ label: '工作台' }]
})

function handleMenuClick(key: string) {
  router.push(key)
}

watch(
  () => route.path,
  (path) => {
    activeMenu.value = path
  }
)
</script>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #18a058;
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
