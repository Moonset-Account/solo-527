<template>
  <div style="display: flex; flex-direction: column; height: 100%;">
    <div
      style="height: 64px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid rgba(255,255,255,0.08); color: #fff; padding: 0 16px; overflow: hidden;"
    >
      <n-icon size="28" style="color: #18a058; flex-shrink: 0;">
        <SchoolOutline />
      </n-icon>
      <n-text
        v-if="!collapsed"
        type="primary"
        style="color: #fff !important; font-size: 16px; font-weight: 600; margin-left: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
        depth="1"
      >
        艺考家校通
      </n-text>
    </div>
    <n-scrollbar style="flex: 1;">
      <n-menu
        :options="menuOptions"
        :value="activeMenu"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        @update:value="handleMenuClick"
      />
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { h, computed } from 'vue'
import {
  SchoolOutline,
  HomeOutline,
  CalendarOutline,
  CheckmarkCircleOutline,
  PeopleOutline,
  PersonCircleOutline,
  ChatboxEllipsesOutline,
  NotificationsOutline,
  DocumentTextOutline,
  BarChartOutline,
  AlertCircleOutline,
  ConstructOutline,
  SearchOutline,
  SparklesOutline,
} from '@vicons/ionicons5'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '~/stores/app'
import type { MenuOption } from 'naive-ui'

const appStore = useAppStore()
const collapsed = computed(() => appStore.collapsed)

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => {
  const p = route.path
  if (p.startsWith('/workstation') || p.startsWith('/schedules') || p.startsWith('/consumptions') || p.startsWith('/calendar')) {
    return '/workstation'
  }
  if (p.startsWith('/feedbacks') || p.startsWith('/homeworks')) {
    return '/feedbacks'
  }
  if (p.startsWith('/notifications') || p.startsWith('/receipts')) {
    return '/notifications'
  }
  if (p.startsWith('/students')) {
    return '/students'
  }
  if (p.startsWith('/classes')) {
    return '/classes'
  }
  if (p.startsWith('/questions')) {
    return '/questions'
  }
  if (p.startsWith('/reports')) {
    return '/reports'
  }
  if (p.startsWith('/reminders')) {
    return '/reminders'
  }
  if (p.startsWith('/operations')) {
    return '/operations'
  }
  return '/dashboard'
})

const menuOptions: MenuOption[] = [
  {
    label: '首页看板',
    key: '/dashboard',
    icon: () => h(HomeOutline),
  },
  {
    label: '排课消课台',
    key: '/workstation',
    icon: () => h(SparklesOutline),
    children: [
      { label: '工作台', key: '/workstation' },
      { label: '课程日历', key: '/calendar' },
      { label: '排课管理', key: '/schedules' },
      { label: '消课记录', key: '/consumptions' },
    ],
  },
  {
    label: '家校反馈',
    key: '/feedbacks',
    icon: () => h(ChatboxEllipsesOutline),
    children: [
      { label: '班级列表', key: '/classes' },
      { label: '作品反馈', key: '/feedbacks' },
      { label: '作业中心', key: '/homeworks' },
    ],
  },
  {
    label: '通知回执',
    key: '/notifications',
    icon: () => h(NotificationsOutline),
  },
  {
    label: '日常查询',
    key: '/questions',
    icon: () => h(SearchOutline as any),
    children: [
      { label: '题库版本', key: '/questions' },
      { label: '学生档案', key: '/students' },
      { label: '消课明细', key: '/consumptions' },
    ],
  },
  {
    label: '提醒中心',
    key: '/reminders',
    icon: () => h(AlertCircleOutline),
  },
  {
    label: '报表中心',
    key: '/reports',
    icon: () => h(BarChartOutline),
  },
  {
    label: '运营管理',
    key: '/operations',
    icon: () => h(ConstructOutline),
    children: [
      { label: '通知发布', key: '/operations/notifications' },
      { label: '回执收集', key: '/operations/receipts' },
      { label: '满班率报表', key: '/operations/fill-rate' },
    ],
  },
]

function handleMenuClick(key: string) {
  router.push(key)
}
</script>

<style scoped>
:deep(.n-menu) {
  background-color: #001529;
  border: none;
  color: rgba(255, 255, 255, 0.75);
}
:deep(.n-menu-item-content-header),
:deep(.n-submenu-children) {
  color: rgba(255, 255, 255, 0.75);
}
:deep(.n-menu-item.n-menu-item--selected),
:deep(.n-submenu.n-submenu--selected > .n-submenu-justify-content) {
  background-color: rgba(32, 128, 240, 0.2);
  color: #fff;
}
:deep(.n-menu-item:not(.n-menu-item--selected):hover) {
  background-color: rgba(255, 255, 255, 0.06);
  color: #fff;
}
:deep(.n-menu-item-content .n-icon) {
  color: rgba(255, 255, 255, 0.75);
}
</style>
