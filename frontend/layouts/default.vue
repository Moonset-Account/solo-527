<template>
  <n-layout has-sider>
    <n-layout-sider
      v-model:collapsed="collapsed"
      :width="220"
      :collapsed-width="64"
      show-trigger
      collapse-mode="width"
    >
      <div class="logo">
        <span v-if="!collapsed" class="logo-text">青禾管道台</span>
        <span v-else class="logo-text">青</span>
      </div>
      <n-menu
        :value="activeMenu"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        @update:value="handleMenuClick"
      />
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered class="header">
        <div class="header-left">
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <n-badge :value="todoCount" :max="99" v-if="!isCandidate">
            <n-button quaternary @click="goTodos">
              <template #icon>
                <n-icon>
                  <Notifications />
                </n-icon>
              </template>
              待办
            </n-button>
          </n-badge>
          <n-dropdown :options="userOptions" @select="handleUserMenu">
            <n-button quaternary class="user-btn">
              <template #icon>
                <n-icon><UserOutlined /></n-icon>
              </template>
              {{ authStore.user?.full_name || authStore.user?.username }}
              <n-icon style="margin-left: 4px"><DownOutlined /></n-icon>
            </n-button>
          </n-dropdown>
        </div>
      </n-layout-header>
      <n-layout-content class="content">
        <slot />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BookOutlined,
  SettingOutlined,
  Notifications,
  DownOutlined,
  UserAddOutlined,
  AuditOutlined,
} from '@vicons/antd'
import { useAuthStore } from '~/stores/auth'
import api from '~/utils/api'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const collapsed = ref(false)
const todoCount = ref(0)

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/candidates')) return 'candidates'
  if (path.startsWith('/positions')) return 'positions'
  if (path.startsWith('/applications')) return 'applications'
  if (path.startsWith('/interviews')) return 'interviews'
  if (path.startsWith('/assessments')) return 'assessments'
  if (path.startsWith('/todos')) return 'todos'
  if (path.startsWith('/my')) return 'my'
  return 'dashboard'
})

const pageTitle = computed(() => {
  const path = route.path
  const titles: Record<string, string> = {
    '/': '首页',
    '/dashboard': '数据看板',
    '/positions': '职位列表',
    '/my/applications': '我的投递',
    '/applications': '投递管理',
    '/candidates': '候选人管理',
    '/interviews': '面试管理',
    '/assessments': '测评管理',
    '/todos': '待办中心',
    '/admin/offers': '录用管理',
    '/admin/check-ins': '签到记录',
    '/admin/dictionary': '字典配置',
    '/admin/settings': '系统设置',
    '/admin/audit': '操作日志',
  }
  for (const [key, value] of Object.entries(titles)) {
    if (path.startsWith(key) && key !== '/') return value
  }
  return '首页'
})

const isCandidate = computed(() => authStore.user?.role === 'candidate')

const menuOptions = computed(() => {
  if (isCandidate.value) {
    return [
      {
        label: '首页',
        key: 'home',
        icon: renderIcon(HomeOutlined),
      },
      {
        label: '职位大厅',
        key: 'positions',
        icon: renderIcon(FileTextOutlined),
      },
      {
        label: '我的投递',
        key: 'my-applications',
        icon: renderIcon(BookOutlined),
      },
      {
        label: '我的面试',
        key: 'my-interviews',
        icon: renderIcon(CalendarOutlined),
      },
      {
        label: '我的资料',
        key: 'my-profile',
        icon: renderIcon(UserOutlined),
      },
    ]
  }
  const menus = [
    {
      label: '数据看板',
      key: 'dashboard',
      icon: renderIcon(HomeOutlined),
    },
    {
      label: '投递管理',
      key: 'applications',
      icon: renderIcon(FileTextOutlined),
    },
    {
      label: '候选人管理',
      key: 'candidates',
      icon: renderIcon(TeamOutlined),
    },
    {
      label: '职位管理',
      key: 'positions',
      icon: renderIcon(BookOutlined),
    },
    {
      label: '面试管理',
      key: 'interviews',
      icon: renderIcon(CalendarOutlined),
    },
    {
      label: '待办中心',
      key: 'todos',
      icon: renderIcon(Notifications),
    },
  ]
  if (authStore.isAdmin) {
    menus.push(
      {
        label: '测评题库',
        key: 'assessments',
        icon: renderIcon(BookOutlined),
      },
      {
        label: '管理员后台',
        key: 'admin',
        icon: renderIcon(SettingOutlined),
        children: [
          { label: '录用管理', key: 'admin-offers' },
          { label: '签到记录', key: 'admin-check-ins' },
          { label: '字典配置', key: 'admin-dictionary' },
          { label: '系统设置', key: 'admin-settings' },
          { label: '操作日志', key: 'admin-audit' },
        ],
      }
    )
  }
  return menus
})

const userOptions = computed(() => [
  {
    label: '个人中心',
    key: 'profile',
    icon: renderIcon(UserOutlined),
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: renderIcon(Notifications),
  },
])

function renderIcon(icon: any) {
  return () => h(icon)
}

import { h } from 'vue'

function handleMenuClick(key: string) {
  const routes: Record<string, string> = {
    home: '/',
    'my-applications': '/my/applications',
    'my-interviews': '/my/interviews',
    'my-profile': '/my/profile',
    positions: '/positions',
    dashboard: '/dashboard',
    applications: '/applications',
    candidates: '/candidates',
    interviews: '/interviews',
    assessments: '/assessments/questions',
    todos: '/todos',
    'admin-offers': '/admin/offers',
    'admin-check-ins': '/admin/check-ins',
    'admin-dictionary': '/admin/dictionary',
    'admin-settings': '/admin/settings',
    'admin-audit': '/admin/audit',
  }
  if (routes[key]) {
    navigateTo(routes[key])
  }
}

function handleUserMenu(key: string) {
  if (key === 'logout') {
    authStore.logout()
  } else if (key === 'profile') {
    navigateTo('/my/profile')
  }
}

function goTodos() {
  navigateTo('/todos')
}

async function fetchTodoCount() {
  if (isCandidate.value) return
  try {
    const response = await api.get('/todos/my/normal')
    todoCount.value = response.data?.length || 0
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  authStore.init()
  if (!isCandidate.value) {
    fetchTodoCount()
  }
})
</script>

<style scoped>
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #18a058;
}
.header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
}
.page-title {
  margin: 0;
  font-size: 18px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-btn {
  text-transform: none;
}
.content {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}
</style>
