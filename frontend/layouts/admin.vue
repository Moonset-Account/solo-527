<template>
  <n-layout has-sider>
    <n-layout-sider
      :collapsed="appStore.collapsed"
      :collapsed-width="64"
      :width="240"
      show-trigger
      bordered
      @collapse="appStore.collapsed = true"
      @expand="appStore.collapsed = false"
    >
      <div class="p-4 flex items-center gap-3 border-b">
        <n-icon size="28" class="text-blue-500">
          <ShieldCheckOutlined />
        </n-icon>
        <span v-if="!appStore.collapsed" class="font-bold text-lg">IT审批系统</span>
      </div>

      <n-menu
        :value="currentRoute"
        :collapsed="appStore.collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        @update:value="handleMenuClick"
        class="border-none"
      />
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered class="h-16 flex items-center justify-between px-6">
        <div class="flex items-center gap-3">
          <span class="text-lg font-medium">{{ pageTitle }}</span>
        </div>

        <div class="flex items-center gap-4">
          <n-dropdown :options="userOptions" @select="handleUserAction">
            <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg">
              <n-avatar round size="small">
                {{ authStore.user?.full_name?.[0] || authStore.user?.username?.[0] || 'U' }}
              </n-avatar>
              <span class="text-sm">{{ authStore.user?.full_name || authStore.user?.username }}</span>
              <n-tag size="small" :type="roleTagType" class="ml-1">
                {{ authStore.userRoleLabel }}
              </n-tag>
            </div>
          </n-dropdown>
        </div>
      </n-layout-header>

      <n-layout-content class="p-6">
        <slot />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NAvatar,
  NTag,
  NDropdown,
} from 'naive-ui'
import {
  DashboardOutlined,
  FileTextOutlined,
  AlertOutlined,
  BugOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  ShieldCheckOutlined,
  HistoryOutlined,
  DesktopOutlined,
} from '@vicons/antd'
import { useAppStore } from '~/stores/app'
import { useAuthStore } from '~/stores/auth'
import { h } from 'vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

const currentRoute = computed(() => route.path)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': '首页',
    '/requests': '申请管理',
    '/requests/my': '我的申请',
    '/requests/new': '新建申请',
    '/approvals': '审批管理',
    '/devices': '设备巡检',
    '/alerts': '告警管理',
    '/vulnerabilities': '漏洞管理',
    '/users': '用户管理',
    '/logs/audit': '审计日志',
    '/logs/errors': '错误日志',
    '/profile': '个人中心',
  }
  return titles[route.path] || 'IT审批系统'
})

const roleTagType = computed(() => {
  const types: Record<string, any> = {
    user: 'default',
    admin: 'info',
    security_officer: 'error',
  }
  return authStore.user?.role ? types[authStore.user.role] : 'default'
})

const userMenuItems = [
  {
    label: '个人中心',
    key: 'profile',
    icon: () => h(UserOutlined),
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(LogoutOutlined),
  },
]

const userOptions = computed(() => userMenuItems)

const handleUserAction = (key: string) => {
  if (key === 'logout') {
    authStore.logout()
    router.push('/login')
  } else if (key === 'profile') {
    router.push('/profile')
  }
}

const menuOptions = computed(() => {
  const items: any[] = [
    {
      label: '首页',
      key: '/dashboard',
      icon: () => h(DashboardOutlined),
    },
  ]

  if (authStore.isLoggedIn) {
    items.push(
      {
        label: '我的申请',
        key: '/requests/my',
        icon: () => h(FileTextOutlined),
      },
      {
        label: '新建申请',
        key: '/requests/new',
        icon: () => h(FileTextOutlined),
      }
    )
  }

  if (authStore.isAdmin) {
    items.push(
      {
        label: '审批管理',
        key: '/approvals',
        icon: () => h(ShieldCheckOutlined),
      },
      {
        label: '设备巡检',
        key: '/devices',
        icon: () => h(DesktopOutlined),
      },
      {
        label: '告警管理',
        key: '/alerts',
        icon: () => h(AlertOutlined),
      },
      {
        label: '漏洞管理',
        key: '/vulnerabilities',
        icon: () => h(BugOutlined),
      },
      {
        label: '用户管理',
        key: '/users',
        icon: () => h(UserOutlined),
      },
      {
        label: '日志管理',
        key: '/logs',
        icon: () => h(HistoryOutlined),
        children: [
          {
            label: '审计日志',
            key: '/logs/audit',
          },
          {
            label: '错误日志',
            key: '/logs/errors',
          },
        ],
      }
    )
  }

  return items
})

const handleMenuClick = (key: string) => {
  router.push(key)
}
</script>

<style scoped>
.n-layout {
  height: 100vh;
}
</style>
