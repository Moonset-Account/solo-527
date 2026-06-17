<template>
  <div class="layout-container">
    <n-layout has-sider>
      <n-layout-sider
        :collapsed="sidebarCollapsed"
        :collapsed-width="64"
        :width="240"
        show-trigger
        @collapse="onCollapse"
        @expand="onExpand"
        bordered
      >
        <div class="logo">
          <span v-if="!sidebarCollapsed">租约账单系统</span>
          <span v-else>租约</span>
        </div>
        <n-menu
          :value="activeMenu"
          :collapsed="sidebarCollapsed"
          :collapsed-width="64"
          :options="menuOptions"
          @update:value="handleMenuClick"
        />
      </n-layout-sider>

      <n-layout>
        <n-layout-header bordered>
          <div class="header-content">
            <div class="header-left">
              <span class="page-title">{{ pageTitle }}</span>
            </div>
            <div class="header-right">
              <n-dropdown :options="userDropdownOptions" @select="handleUserAction">
                <div class="user-info">
                  <n-avatar round size="small">
                    {{ userStore.userInfo?.full_name?.charAt(0) || 'U' }}
                  </n-avatar>
                  <span class="username">{{ userStore.userInfo?.full_name || userStore.userInfo?.username }}</span>
                </div>
              </n-dropdown>
            </div>
          </div>
        </n-layout-header>

        <n-layout-content content-style="padding: 20px; height: calc(100vh - 64px);">
          <slot />
        </n-layout-content>
      </n-layout>
    </n-layout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeOutline,
  FileTrayOutline,
  ReceiptOutline,
  AlertCircleOutline,
  SettingsOutline,
  PeopleOutline,
  BookOutline,
  ShieldCheckmarkOutline,
  DocumentTextOutline,
  PersonCircleOutline,
  LogOutOutline,
} from '@vicons/ionicons5'
import { useUserStore } from '~/stores/user'
import { useAppStore } from '~/stores/app'
import { useDictStore } from '~/stores/dict'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()
const dictStore = useDictStore()

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = ref('dashboard')
const pageTitle = ref('首页')

const menuOptions = computed(() => {
  const options: any[] = [
    {
      label: '首页概览',
      key: 'dashboard',
      icon: () => h(HomeOutline),
    },
  ]

  if (userStore.hasPermission('lease:view')) {
    options.push({
      label: '租约管理',
      key: 'leases',
      icon: () => h(FileTrayOutline),
    })
  }

  if (userStore.hasPermission('bill:view')) {
    options.push({
      label: '账单管理',
      key: 'bills',
      icon: () => h(ReceiptOutline),
    })
  }

  if (userStore.hasPermission('exception:view')) {
    options.push({
      label: '异常单管理',
      key: 'exception-orders',
      icon: () => h(AlertCircleOutline),
    })
  }

  if (userStore.hasPermission('user:manage') || userStore.hasPermission('dictionary:manage') || userStore.hasPermission('log:view')) {
    const children: any[] = []
    if (userStore.hasPermission('user:manage')) {
      children.push({
        label: '用户管理',
        key: 'admin/users',
        icon: () => h(PeopleOutline),
      })
    }
    if (userStore.hasPermission('dictionary:manage')) {
      children.push({
        label: '字段字典',
        key: 'admin/dictionaries',
        icon: () => h(BookOutline),
      })
    }
    if (userStore.hasPermission('validation:manage')) {
      children.push({
        label: '校验规则',
        key: 'admin/validation-rules',
        icon: () => h(ShieldCheckmarkOutline),
      })
    }
    if (userStore.hasPermission('log:view')) {
      children.push({
        label: '操作日志',
        key: 'admin/operation-logs',
        icon: () => h(DocumentTextOutline),
      })
    }
    options.push({
      label: '系统管理',
      key: 'admin',
      icon: () => h(SettingsOutline),
      children,
    })
  }

  return options
})

const userDropdownOptions = [
  {
    label: '个人中心',
    key: 'profile',
    icon: () => h(PersonCircleOutline),
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(LogOutOutline),
  },
]

import { h } from 'vue'

function onCollapse() {
  appStore.sidebarCollapsed = true
}

function onExpand() {
  appStore.sidebarCollapsed = false
}

function handleMenuClick(key: string) {
  activeMenu.value = key
  router.push(`/${key}`)
}

function handleUserAction(key: string) {
  if (key === 'logout') {
    userStore.logoutAction()
    router.push('/login')
  } else if (key === 'profile') {
    router.push('/profile')
  }
}

function updateActiveMenu() {
  const path = route.path.replace(/^\//, '')
  activeMenu.value = path || 'dashboard'

  const menuLabels: Record<string, string> = {
    dashboard: '首页概览',
    leases: '租约管理',
    bills: '账单管理',
    'exception-orders': '异常单管理',
    'admin/users': '用户管理',
    'admin/dictionaries': '字段字典',
    'admin/validation-rules': '校验规则',
    'admin/operation-logs': '操作日志',
    profile: '个人中心',
  }
  pageTitle.value = menuLabels[path.replace(/^\//, '')] || '首页'
}

onMounted(() => {
  updateActiveMenu()
  if (userStore.isLoggedIn) {
    dictStore.loadAllDictionaries()
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #18a058;
  border-bottom: 1px solid #f0f0f0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.header-left .page-title {
  font-size: 18px;
  font-weight: 500;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.username {
  font-size: 14px;
  color: #333;
}
</style>
