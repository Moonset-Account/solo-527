<template>
  <div class="app-sidebar h-full flex flex-col" :style="{ backgroundColor: '#1A8A7D' }">
    <div class="sidebar-logo h-16 flex items-center px-5 border-b border-white/10">
      <n-icon :size="28" color="#FF8C42">
        <PawSharp />
      </n-icon>
      <span class="ml-3 text-white font-semibold text-lg">宠物管理系统</span>
    </div>

    <div class="flex-1 overflow-y-auto py-4">
      <n-menu
        v-model:value="activeKey"
        :options="menuOptions"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :font-size="14"
        item-color="transparent"
        item-color-active="#126B60"
        item-color-hover="rgba(255,255,255,0.08)"
        text-color="rgba(255,255,255,0.85)"
        text-color-active="#FFFFFF"
        arrow-color="rgba(255,255,255,0.6)"
        :show-icon="true"
        @update:value="handleMenuSelect"
      />
    </div>

    <div class="sidebar-footer p-3 border-t border-white/10">
      <n-button
        quaternary
        size="small"
        block
        @click="toggleCollapse"
      >
        <template #icon>
          <n-icon>
            <ChevronBackSharp v-if="!collapsed" />
            <ChevronForwardSharp v-else />
          </n-icon>
        </template>
        {{ collapsed ? '' : '收起菜单' }}
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import {
  HomeSharp,
  CalendarSharp,
  PawSharp,
  FileTraySharp,
  HeartSharp,
  TimeSharp,
  DocumentTextSharp,
  ChevronBackSharp,
  ChevronForwardSharp,
  PeopleSharp,
  SettingsSharp,
} from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const activeKey = ref(route.path)

const menuOptions = computed<MenuOption[]>(() => [
  {
    label: '仪表板',
    key: '/dashboard',
    icon: () => h(HomeSharp),
  },
  {
    label: '预约订单',
    key: '/orders',
    icon: () => h(CalendarSharp),
    children: [
      { label: '全部订单', key: '/orders/list', icon: () => h(DocumentTextSharp) },
      { label: '待处理', key: '/orders/pending', icon: () => h(TimeSharp) },
      { label: '进行中', key: '/orders/processing', icon: () => h(FileTraySharp) },
      { label: '已完成', key: '/orders/completed', icon: () => h(DocumentTextSharp) },
    ],
  },
  {
    label: '宠物档案',
    key: '/pets',
    icon: () => h(PawSharp),
    children: [
      { label: '宠物列表', key: '/pets/list', icon: () => h(PawSharp) },
      { label: '新增宠物', key: '/pets/create', icon: () => h(PawSharp) },
      { label: '健康记录', key: '/pets/health', icon: () => h(HeartSharp) },
    ],
  },
  {
    label: '领养审核',
    key: '/adoption',
    icon: () => h(HeartSharp),
    children: [
      { label: '待审核', key: '/adoption/pending', icon: () => h(TimeSharp) },
      { label: '已通过', key: '/adoption/approved', icon: () => h(FileTraySharp) },
      { label: '已拒绝', key: '/adoption/rejected', icon: () => h(DocumentTextSharp) },
    ],
  },
  {
    label: '回访提醒',
    key: '/follow-up',
    icon: () => h(TimeSharp),
  },
  {
    label: '排班管理',
    key: '/schedule',
    icon: () => h(CalendarSharp),
  },
  {
    label: '用户管理',
    key: '/users',
    icon: () => h(PeopleSharp),
  },
  {
    label: '操作日志',
    key: '/logs',
    icon: () => h(DocumentTextSharp),
  },
  {
    label: '系统设置',
    key: '/settings',
    icon: () => h(SettingsSharp),
  },
])

function handleMenuSelect(key: string) {
  activeKey.value = key
  router.push(key)
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

defineExpose({
  collapsed,
  toggleCollapse,
})
</script>

<style scoped>
.app-sidebar {
  width: 240px;
  transition: width 0.25s ease;
}

.app-sidebar :deep(.n-menu) {
  background-color: transparent !important;
}

.sidebar-logo {
  user-select: none;
}

.sidebar-footer {
  user-select: none;
}
</style>
