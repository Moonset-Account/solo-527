<template>
  <n-layout has-sider>
    <n-layout-sider
      v-model:collapsed="collapsed"
      :width="240"
      :collapsed-width="64"
      show-trigger
      bordered
      content-style="padding: 0"
    >
      <div class="logo">
        <span v-if="!collapsed">票务运营系统</span>
        <span v-else>票务</span>
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
          <span class="page-title">{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <n-tag v-if="environment !== 'production'" :type="envTagType">
            {{ environmentLabel }}
          </n-tag>
          <n-dropdown :options="userOptions" @select="handleUserAction">
            <n-button text>
              <span>{{ user?.full_name || user?.username }}</span>
              <n-icon style="margin-left: 4px">
                <ChevronDownOutline />
              </n-icon>
            </n-button>
          </n-dropdown>
        </div>
      </n-layout-header>
      
      <n-layout-content content-style="padding: 0">
        <slot />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NLayout, NLayoutSider, NLayoutHeader, NLayoutContent,
  NMenu, NDropdown, NButton, NIcon, NTag, useMessage
} from 'naive-ui'
import {
  HomeOutline, PeopleOutline, QrCodeOutline,
  SettingsOutline, ListOutline, AlertCircleOutline,
  FileTrayOutline, ChevronDownOutline, LogOutOutline,
  PersonOutline
} from '@vicons/ionicons5'
import { h } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useRuntimeConfig } from '#imports'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const config = useRuntimeConfig()
const { user, isOperator, isAdmin, logout, initAuth } = useAuth()

const collapsed = ref(false)
const activeMenu = ref('dashboard')

const environment = computed(() => config.public.environment)

const environmentLabel = computed(() => {
  const map: Record<string, string> = {
    development: '开发环境',
    testing: '测试环境',
    production: '生产环境',
  }
  return map[environment.value] || environment.value
})

const envTagType = computed(() => {
  if (environment.value === 'production') return 'error'
  if (environment.value === 'testing') return 'warning'
  return 'info'
})

const menuOptions = computed(() => {
  const baseOptions = [
    {
      label: '数据概览',
      key: 'dashboard',
      icon: () => h(HomeOutline),
    },
    {
      label: '报名管理',
      key: 'registrations',
      icon: () => h(PeopleOutline),
    },
    {
      label: '签到核销',
      key: 'checkins',
      icon: () => h(QrCodeOutline),
    },
  ]
  
  if (isOperator.value) {
    baseOptions.push(
      {
        label: '待办事项',
        key: 'todos',
        icon: () => h(ListOutline),
      },
      {
        label: '退票异常',
        key: 'refund-exceptions',
        icon: () => h(AlertCircleOutline),
      },
      {
        label: '设备管理',
        key: 'devices',
        icon: () => h(SettingsOutline),
      },
      {
        label: '操作日志',
        key: 'operation-logs',
        icon: () => h(FileTrayOutline),
      }
    )
  }
  
  if (isAdmin.value) {
    baseOptions.push(
      {
        label: '活动管理',
        key: 'events',
        icon: () => h(HomeOutline),
      }
    )
  }
  
  return baseOptions
})

const titleMap: Record<string, string> = {
  dashboard: '数据概览',
  registrations: '报名管理',
  checkins: '签到核销',
  todos: '待办事项',
  'refund-exceptions': '退票异常',
  devices: '设备管理',
  'operation-logs': '操作日志',
  events: '活动管理',
}

const currentTitle = computed(() => titleMap[activeMenu.value] || '')

const userOptions = computed(() => [
  {
    label: user.value?.full_name || user.value?.username,
    key: 'profile',
    icon: () => h(PersonOutline),
    disabled: true,
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(LogOutOutline),
  },
])

const handleMenuClick = (key: string) => {
  activeMenu.value = key
  router.push(`/admin/${key}`)
}

const handleUserAction = (key: string) => {
  if (key === 'logout') {
    logout()
    message.success('已退出登录')
  }
}

onMounted(() => {
  initAuth()
  const path = route.path.replace('/admin/', '')
  if (path && path !== 'admin') {
    activeMenu.value = path
  }
})

watch(() => route.path, (newPath) => {
  const path = newPath.replace('/admin/', '')
  if (path && path !== 'admin') {
    activeMenu.value = path
  }
})
</script>

<style scoped lang="scss">
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #18a058;
  border-bottom: 1px solid #f0f0f0;
}

.header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  
  .header-left {
    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}
</style>
