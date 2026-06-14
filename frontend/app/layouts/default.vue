<template>
  <n-layout has-sider style="height: 100vh">
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="220"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="logo">
        <span v-if="!collapsed">装修巡检系统</span>
        <span v-else>巡检</span>
      </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuSelect"
      />
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered style="height: 56px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between">
        <span style="font-size: 16px; font-weight: 500">{{ pageTitle }}</span>
        <n-space align="center">
          <n-button quaternary circle @click="router.push('/notifications')">
            <template #icon>
              <n-icon><NotificationsOutline /></n-icon>
            </template>
          </n-button>
          <n-tag size="small" type="info">{{ authStore.displayName }}</n-tag>
          <n-button size="small" @click="handleLogout">退出登录</n-button>
        </n-space>
      </n-layout-header>
      <n-layout-content content-style="padding: 24px">
        <slot />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import { useRouter, useRoute, navigateTo } from '#imports'
import {
  HomeOutline,
  DocumentTextOutline,
  BriefcaseOutline,
  ClipboardOutline,
  HappyOutline,
  SettingsOutline,
  BarChartOutline,
  NotificationsOutline,
  TrashBinOutline,
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const collapsed = ref(false)

onMounted(() => {
  if (import.meta.client) {
    const token = localStorage.getItem('token')
    if (!token) {
      navigateTo('/login', { replace: true })
    } else {
      authStore.init()
    }
  }
})

const activeKey = computed(() => route.path)

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = [
  { label: '首页', key: '/', icon: renderIcon(HomeOutline) },
  { label: '方案查看', key: '/plans', icon: renderIcon(DocumentTextOutline) },
  { label: '合同管理', key: '/contracts', icon: renderIcon(BriefcaseOutline) },
  { label: '巡检任务', key: '/inspections', icon: renderIcon(ClipboardOutline) },
  { label: '满意度看板', key: '/satisfaction', icon: renderIcon(HappyOutline) },
  {
    label: '配置管理',
    key: '/config',
    icon: renderIcon(SettingsOutline),
    children: [
      { label: '验收反馈', key: '/config/acceptance' },
      { label: '预算版本', key: '/config/budget' },
      { label: '巡检模板', key: '/config/templates' },
    ],
  },
  { label: '质量报表', key: '/reports', icon: renderIcon(BarChartOutline) },
  { label: '提醒中心', key: '/notifications', icon: renderIcon(NotificationsOutline) },
  { label: '演示管理', key: '/demo', icon: renderIcon(TrashBinOutline) },
]

const pageTitles: Record<string, string> = {
  '/': '首页',
  '/plans': '方案查看',
  '/contracts': '合同管理',
  '/inspections': '巡检任务',
  '/satisfaction': '满意度看板',
  '/config/acceptance': '验收反馈配置',
  '/config/budget': '预算版本配置',
  '/config/templates': '巡检模板配置',
  '/reports': '质量报表',
  '/notifications': '提醒中心',
  '/demo': '演示管理',
}

const pageTitle = computed(() => {
  return pageTitles[route.path] ?? '装修巡检系统'
})

function handleMenuSelect(key: string) {
  router.push(key)
}

function handleLogout() {
  authStore.logout()
  navigateTo('/login', { replace: true })
}
</script>

<style scoped>
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #1B2A4A;
  border-bottom: 1px solid var(--n-border-color);
}
</style>
